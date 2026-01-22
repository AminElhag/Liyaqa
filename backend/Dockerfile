# ===========================================
# Liyaqa Backend - Multi-stage Dockerfile
# ===========================================

# ===========================================
# Stage 1: Build
# ===========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Install required packages for Gradle
RUN apk add --no-cache bash

# Copy Gradle wrapper and build files first (for caching)
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
COPY gradle.properties .

# Make gradlew executable
RUN chmod +x gradlew

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY src src

# Build the application
RUN ./gradlew bootJar --no-daemon -x test

# Extract layers for optimized startup
RUN java -Djarmode=layertools -jar build/libs/*.jar extract

# ===========================================
# Stage 2: Runtime
# ===========================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# Add labels for image metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="Liyaqa Backend" \
      org.opencontainers.image.description="Gym Management System Backend API" \
      org.opencontainers.image.vendor="Liyaqa" \
      org.opencontainers.image.source="https://github.com/AminElhag/Liyaqa"

# Install required fonts for Arabic PDF generation and utilities
RUN apk add --no-cache \
    ttf-dejavu \
    fontconfig \
    tzdata \
    curl \
    && rm -rf /var/cache/apk/*

# Set timezone to Saudi Arabia
ENV TZ=Asia/Riyadh

# Create non-root user for security
RUN addgroup -g 1001 liyaqa && \
    adduser -u 1001 -G liyaqa -D -s /bin/sh liyaqa

WORKDIR /app

# Copy extracted layers from builder (ordered by change frequency)
COPY --from=builder --chown=liyaqa:liyaqa /app/dependencies/ ./
COPY --from=builder --chown=liyaqa:liyaqa /app/spring-boot-loader/ ./
COPY --from=builder --chown=liyaqa:liyaqa /app/snapshot-dependencies/ ./
COPY --from=builder --chown=liyaqa:liyaqa /app/application/ ./

# Switch to non-root user
USER liyaqa

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM optimizations for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseG1GC \
    -XX:+HeapDumpOnOutOfMemoryError \
    -XX:HeapDumpPath=/tmp \
    -Djava.security.egd=file:/dev/./urandom"

# Run the application using Spring Boot layered JAR launcher
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
