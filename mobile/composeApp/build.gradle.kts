import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.io.FileInputStream
import java.util.Properties

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.compose.multiplatform)
    alias(libs.plugins.compose.compiler)
    alias(libs.plugins.android.application)
}

// ===========================================
// Version Management
// ===========================================
// Read version from version.properties or use defaults
val versionPropsFile = rootProject.file("version.properties")
val versionProps = Properties().apply {
    if (versionPropsFile.exists()) {
        load(FileInputStream(versionPropsFile))
    }
}

val appVersionName: String = versionProps.getProperty("VERSION_NAME", "1.0.0")
val appVersionCode: Int = versionProps.getProperty("VERSION_CODE", "1").toInt()

// ===========================================
// Signing Configuration
// ===========================================
// Load keystore properties from local file (not committed to git)
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) {
        load(FileInputStream(keystorePropsFile))
    }
}

kotlin {
    androidTarget {
        @OptIn(ExperimentalKotlinGradlePluginApi::class)
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
            // Export version info to iOS
            freeCompilerArgs += listOf(
                "-Xbinary=bundleId=com.liyaqa.member",
                "-Xbinary=bundleVersion=$appVersionCode",
                "-Xbinary=bundleShortVersionString=$appVersionName"
            )
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(projects.shared)

            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(compose.components.uiToolingPreview)

            // Koin
            implementation(libs.koin.core)
            implementation(libs.koin.compose)
            implementation(libs.koin.compose.viewmodel)

            // Lifecycle
            implementation(libs.lifecycle.viewmodel.compose)
            implementation(libs.lifecycle.runtime.compose)
        }

        androidMain.dependencies {
            implementation(compose.preview)
            implementation(libs.androidx.activity.compose)
            implementation(libs.androidx.core.splashscreen)
            implementation(libs.androidx.core.ktx)
            implementation(libs.koin.android)

            // Coil for image loading
            implementation(libs.coil.compose)
            implementation(libs.coil.network.ktor3)
        }
    }
}

android {
    namespace = "com.liyaqa.member"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.liyaqa.member"
        minSdk = 26
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersionName

        // Test instrumentation runner
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Build config fields
        buildConfigField("String", "API_BASE_URL", "\"https://api.liyaqa.com\"")
        buildConfigField("Boolean", "ENABLE_LOGGING", "false")
    }

    // ===========================================
    // Signing Configurations
    // ===========================================
    signingConfigs {
        // Debug signing (uses default Android debug keystore)
        getByName("debug") {
            // Uses default debug keystore automatically
        }

        // Release signing (load from keystore.properties or environment)
        create("release") {
            val storeFilePath = keystoreProps.getProperty("RELEASE_STORE_FILE")
                ?: System.getenv("RELEASE_STORE_FILE")
            val storePasswordVal = keystoreProps.getProperty("RELEASE_STORE_PASSWORD")
                ?: System.getenv("RELEASE_STORE_PASSWORD")
            val keyAliasVal = keystoreProps.getProperty("RELEASE_KEY_ALIAS")
                ?: System.getenv("RELEASE_KEY_ALIAS")
            val keyPasswordVal = keystoreProps.getProperty("RELEASE_KEY_PASSWORD")
                ?: System.getenv("RELEASE_KEY_PASSWORD")

            if (storeFilePath != null && storePasswordVal != null &&
                keyAliasVal != null && keyPasswordVal != null) {
                storeFile = file(storeFilePath)
                storePassword = storePasswordVal
                keyAlias = keyAliasVal
                keyPassword = keyPasswordVal
            }
        }
    }

    // ===========================================
    // Build Types
    // ===========================================
    buildTypes {
        debug {
            isMinifyEnabled = false
            isDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            signingConfig = signingConfigs.getByName("debug")

            // Debug-specific build config
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080\"")
            buildConfigField("Boolean", "ENABLE_LOGGING", "true")

            // Enable ProGuard only for minification testing
            proguardFiles(
                getDefaultProguardFile("proguard-android.txt"),
                "proguard-rules.pro"
            )
        }

        release {
            isMinifyEnabled = true
            isDebuggable = false
            isShrinkResources = true

            // Use release signing if available, otherwise fall back to debug
            signingConfig = if (signingConfigs.findByName("release")?.storeFile != null) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }

            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )

            // Optimize APK
            ndk {
                debugSymbolLevel = "FULL"
            }
        }

        // Staging build type for testing against staging server
        create("staging") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            isMinifyEnabled = false
            isDebuggable = true
            signingConfig = signingConfigs.getByName("debug")

            buildConfigField("String", "API_BASE_URL", "\"https://staging-api.liyaqa.com\"")
            buildConfigField("Boolean", "ENABLE_LOGGING", "true")

            matchingFallbacks += listOf("release", "debug")
        }
    }

    // ===========================================
    // Product Flavors (optional, for future use)
    // ===========================================
    flavorDimensions += "environment"
    productFlavors {
        create("production") {
            dimension = "environment"
            // Production-specific config
        }
        create("development") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            // Development-specific config
        }
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/INDEX.LIST"
            excludes += "/META-INF/io.netty.versions.properties"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    // ===========================================
    // Lint Options
    // ===========================================
    lint {
        abortOnError = false
        checkReleaseBuilds = true
        warningsAsErrors = false
        disable += setOf("MissingTranslation", "ExtraTranslation")
    }

    // ===========================================
    // Bundle Options (for AAB)
    // ===========================================
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}

// ===========================================
// Custom Tasks
// ===========================================

// Task to print version info
tasks.register("printVersionInfo") {
    doLast {
        println("App Version: $appVersionName ($appVersionCode)")
    }
}

// Task to increment version code for CI
tasks.register("incrementVersionCode") {
    doLast {
        val newVersionCode = appVersionCode + 1
        versionPropsFile.writeText("""
            VERSION_NAME=$appVersionName
            VERSION_CODE=$newVersionCode
        """.trimIndent())
        println("Updated VERSION_CODE to $newVersionCode")
    }
}
