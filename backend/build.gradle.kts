import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {

    kotlin("jvm") version "2.2.0"
    kotlin("plugin.spring") version "2.2.0"
    kotlin("plugin.jpa") version "2.2.0"
    id("org.springframework.boot") version "3.4.1"
    id("io.spring.dependency-management") version "1.1.7"
    id("jacoco")
}

group = "com.liyaqa"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
        freeCompilerArgs.addAll(
            "-Xjsr305=strict",
            "-Xjvm-default=all"
        )
    }
}

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-cache")

    // Caching
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")

    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Database
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("com.h2database:h2") // For development/testing

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")

    // PDF Generation
    implementation("com.github.librepdf:openpdf:2.0.3")

    // Firebase Admin SDK (for push notifications)
    implementation("com.google.firebase:firebase-admin:9.2.0")

    // QR Code Generation
    implementation("com.google.zxing:core:3.5.2")
    implementation("com.google.zxing:javase:3.5.2")

    // TOTP (Time-based One-Time Password) for MFA
    implementation("com.warrenstrange:googleauth:1.5.0")

    // OAuth 2.0 / OpenID Connect (for SSO integration)
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.security:spring-security-oauth2-jose")

    // Prayer Time Calculation (Umm Al-Qura method for Saudi Arabia)
    implementation("com.batoulapps.adhan:adhan:1.2.1")

    // Email (optional)
    implementation("org.springframework.boot:spring-boot-starter-mail")

    // Note: SMS via Twilio uses REST API directly (no SDK dependency needed)

    // API Documentation (Swagger/OpenAPI)
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.0")

    // ShedLock - Distributed job locking
    implementation("net.javacrumbs.shedlock:shedlock-spring:6.0.2")
    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:6.0.2")

    // Spring Retry - For resilient external service calls
    implementation("org.springframework.retry:spring-retry:2.0.11")
    implementation("org.springframework:spring-aspects:6.2.2")

    // AWS Secrets Manager (for production secrets management)
    implementation("software.amazon.awssdk:secretsmanager:2.20.+")

    // Structured Logging (JSON format for production)
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")

    // Distributed Tracing (OpenTelemetry + Zipkin)
    implementation("io.micrometer:micrometer-tracing-bridge-otel")
    implementation("io.opentelemetry:opentelemetry-exporter-zipkin")

    // Prometheus Metrics (for Grafana integration)
    implementation("io.micrometer:micrometer-registry-prometheus")

    // Development
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.junit.vintage", module = "junit-vintage-engine")
    }
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.jetbrains.kotlin:kotlin-reflect")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// Ensure Kotlin compiler can see test dependencies
tasks.named<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>("compileTestKotlin") {
    compilerOptions {
        freeCompilerArgs.add("-Xjvm-default=all")
    }
}

// JPA plugin configuration for Kotlin data classes
allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

////////////////////////////////////////////////////////////////////////////////
// JaCoCo Test Coverage Configuration
////////////////////////////////////////////////////////////////////////////////

jacoco {
    toolVersion = "0.8.11"
}

tasks.test {
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)

    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }

    classDirectories.setFrom(
        files(classDirectories.files.map {
            fileTree(it) {
                exclude(
                    // Configuration classes
                    "**/config/**",

                    // DTOs and request/response objects
                    "**/dto/**",
                    "**/request/**",
                    "**/response/**",

                    // Main application class
                    "**/*Application*",

                    // Generated code
                    "**/Q*.class",

                    // Entities (mostly data classes)
                    "**/entity/**",
                    "**/model/**",

                    // Enums
                    "**/*\$Companion.class",

                    // Spring-generated proxies
                    "**/*\$\$*"
                )
            }
        })
    )
}

tasks.jacocoTestCoverageVerification {
    dependsOn(tasks.jacocoTestReport)

    violationRules {
        // Overall project coverage rule
        rule {
            limit {
                minimum = "0.80".toBigDecimal() // 80% overall coverage
                counter = "LINE"
                value = "COVEREDRATIO"
            }
        }

        // Per-class coverage rule
        rule {
            element = "CLASS"
            limit {
                counter = "LINE"
                value = "COVEREDRATIO"
                minimum = "0.70".toBigDecimal() // 70% per class
            }

            // Exclude same patterns as report
            excludes = listOf(
                "*.config.*",
                "*.dto.*",
                "*.request.*",
                "*.response.*",
                "*Application*",
                "*.entity.*",
                "*.model.*"
            )
        }

        // Branch coverage rule
        rule {
            limit {
                counter = "BRANCH"
                value = "COVEREDRATIO"
                minimum = "0.70".toBigDecimal() // 70% branch coverage
            }
        }
    }

    classDirectories.setFrom(
        files(classDirectories.files.map {
            fileTree(it) {
                exclude(
                    "**/config/**",
                    "**/dto/**",
                    "**/request/**",
                    "**/response/**",
                    "**/*Application*",
                    "**/Q*.class",
                    "**/entity/**",
                    "**/model/**",
                    "**/*\$Companion.class",
                    "**/*\$\$*"
                )
            }
        })
    )
}

// Run coverage verification as part of check task
tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}
