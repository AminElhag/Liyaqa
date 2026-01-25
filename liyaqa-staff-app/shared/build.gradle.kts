import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.compose.multiplatform)
    alias(libs.plugins.kotlin.compose.compiler)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.sqldelight)
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
            baseName = "Shared"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            // Compose
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.materialIconsExtended)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(compose.components.uiToolingPreview)

            // Ktor
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.ktor.client.logging)
            implementation(libs.ktor.client.auth)

            // SQLDelight
            implementation(libs.sqldelight.runtime)
            implementation(libs.sqldelight.coroutines)

            // Koin
            implementation(libs.koin.core)
            implementation(libs.koin.compose)

            // Voyager
            implementation(libs.voyager.navigator)
            implementation(libs.voyager.screenmodel)
            implementation(libs.voyager.transitions)
            implementation(libs.voyager.koin)
            implementation(libs.voyager.tab.navigator)

            // Coroutines
            implementation(libs.kotlinx.coroutines.core)

            // Kotlinx
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.datetime)

            // Image Loading
            implementation(libs.coil.compose)
            implementation(libs.coil.network.ktor)
        }

        commonTest.dependencies {
            implementation(libs.kotlin.test)
            implementation(libs.kotlinx.coroutines.test)
            implementation(libs.koin.test)
            implementation(libs.ktor.client.mock)
            implementation(libs.turbine)
        }

        androidMain.dependencies {
            // Ktor Android
            implementation(libs.ktor.client.okhttp)

            // SQLDelight Android
            implementation(libs.sqldelight.android.driver)

            // Koin Android
            implementation(libs.koin.android)

            // Coroutines Android
            implementation(libs.kotlinx.coroutines.android)

            // Security
            implementation(libs.security.crypto)

            // QR Code Scanner
            implementation(libs.zxing.core)
            implementation(libs.mlkit.barcode)

            // CameraX
            implementation(libs.camerax.core)
            implementation(libs.camerax.camera2)
            implementation(libs.camerax.lifecycle)
            implementation(libs.camerax.view)

            // Compose Preview
            implementation(compose.preview)
        }

        iosMain.dependencies {
            // Ktor iOS
            implementation(libs.ktor.client.darwin)

            // SQLDelight iOS
            implementation(libs.sqldelight.native.driver)
        }
    }
}

android {
    namespace = "com.liyaqa.staff.shared"
    compileSdk = 35

    defaultConfig {
        minSdk = 26
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }
}

sqldelight {
    databases {
        create("LiyaqaStaffDatabase") {
            packageName.set("com.liyaqa.staff.data.local")
            schemaOutputDirectory.set(file("src/commonMain/sqldelight/databases"))
            verifyMigrations.set(true)
        }
    }
}

compose.resources {
    publicResClass = true
    packageOfResClass = "com.liyaqa.staff.resources"
    generateResClass = always
}
