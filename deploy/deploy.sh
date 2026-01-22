#!/bin/bash
# ===========================================
# Liyaqa Deployment Script
# ===========================================
# Run this script to deploy or update the application
#
# Usage:
#   ./deploy.sh              # Deploy/update application
#   ./deploy.sh --build      # Force rebuild images
#   ./deploy.sh --logs       # Show logs after deploy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/opt/liyaqa"
FORCE_BUILD=false
SHOW_LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "========================================"
echo "  Liyaqa Deployment"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo "ERROR: .env file not found at $APP_DIR/.env"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp $APP_DIR/deploy/.env.example $APP_DIR/.env"
    echo "  nano $APP_DIR/.env"
    exit 1
fi

cd "$APP_DIR"

# ===========================================
# 1. Pull latest code
# ===========================================
echo "[1/5] Pulling latest code..."
git fetch origin
git pull origin main

# ===========================================
# 2. Copy configuration files
# ===========================================
echo "[2/5] Updating configuration files..."
cp deploy/docker-compose.droplet.yml docker-compose.yml
cp -r deploy/nginx/* nginx/

# ===========================================
# 3. Build images
# ===========================================
echo "[3/5] Building Docker images..."
if [ "$FORCE_BUILD" = true ]; then
    docker compose build --no-cache
else
    docker compose build
fi

# ===========================================
# 4. Deploy
# ===========================================
echo "[4/5] Deploying application..."
docker compose down --remove-orphans
docker compose up -d

# ===========================================
# 5. Health check
# ===========================================
echo "[5/5] Waiting for services to be healthy..."
echo ""

# Wait for backend to be healthy
echo "Waiting for backend..."
for i in {1..30}; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "Backend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "WARNING: Backend health check timed out"
    fi
    sleep 5
done

# Wait for frontend
echo "Waiting for frontend..."
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Frontend is healthy!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "WARNING: Frontend health check timed out"
    fi
    sleep 3
done

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Services status:"
docker compose ps
echo ""

# Get droplet IP
DROPLET_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_DROPLET_IP")

echo "Access your application:"
echo "  Frontend:  http://$DROPLET_IP"
echo "  API Docs:  http://$DROPLET_IP/swagger-ui.html"
echo "  Health:    http://$DROPLET_IP/actuator/health"
echo ""
echo "Login credentials:"
echo "  Platform Admin: admin@liyaqa.com / password123"
echo "  Demo Client:    admin@demo.com / Test1234 (Tenant: 22222222-2222-2222-2222-222222222222)"
echo ""

if [ "$SHOW_LOGS" = true ]; then
    echo "Showing logs (Ctrl+C to exit)..."
    docker compose logs -f
fi
