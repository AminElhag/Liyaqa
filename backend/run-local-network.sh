#!/bin/bash
# Run backend with local network subdomain configuration
# Usage: ./run-local-network.sh

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "Detected local IP: $LOCAL_IP"

# Set environment variables for local domain testing
# Spring Boot maps liyaqa.domain.base to LIYAQA_DOMAIN_BASE
export LIYAQA_DOMAIN_BASE="liyaqa.local"
export LIYAQA_DOMAIN_DEV_HOSTS=""  # Empty to enable subdomain detection
export CORS_ALLOWED_ORIGINS="http://liyaqa.local:3000,http://${LOCAL_IP}:3000"
export CORS_ALLOWED_ORIGIN_PATTERNS="http://*.liyaqa.local:3000"

echo ""
echo "=== Local Network Configuration ==="
echo "Base Domain: $LIYAQA_DOMAIN_BASE"
echo "CORS Origins: $CORS_ALLOWED_ORIGINS"
echo "CORS Patterns: $CORS_ALLOWED_ORIGIN_PATTERNS"
echo ""
echo "Starting backend server..."
echo ""

# Run the backend
./gradlew bootRun
