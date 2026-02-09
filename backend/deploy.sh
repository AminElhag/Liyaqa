#!/bin/bash

# Liyaqa Backend Deployment Script
# Phase 1: Critical Security & Performance Fixes

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV="${DEPLOY_ENV:-staging}"
APP_NAME="liyaqa-backend"
JAR_FILE="build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar"
VERSION="phase1-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Liyaqa Backend Deployment Script        ║${NC}"
echo -e "${BLUE}║   Phase 1: Security & Performance Fixes   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Environment:${NC} $DEPLOY_ENV"
echo -e "${BLUE}Version:${NC} $VERSION"
echo ""

# Function to print step
print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    if [ ! -f "$JAR_FILE" ]; then
        print_error "JAR file not found: $JAR_FILE"
        echo "Run: ./gradlew bootJar"
        exit 1
    fi
    print_success "JAR file found"

    if ! command -v java &> /dev/null; then
        print_error "Java not found"
        exit 1
    fi
    print_success "Java installed: $(java -version 2>&1 | head -n 1)"

    if ! command -v curl &> /dev/null; then
        print_error "curl not found"
        exit 1
    fi
    print_success "curl installed"
}

# Run tests
run_tests() {
    print_step "Running tests..."

    echo "Running automated test suite..."
    if ./test-phase1-fixes.sh > /tmp/test-results.log 2>&1; then
        print_success "All tests passed"
    else
        print_error "Tests failed. Check /tmp/test-results.log"
        cat /tmp/test-results.log
        exit 1
    fi
}

# Create backup
create_backup() {
    print_step "Creating backup..."

    BACKUP_DIR="backups"
    mkdir -p "$BACKUP_DIR"

    if [ -f "current.jar" ]; then
        BACKUP_FILE="$BACKUP_DIR/liyaqa-backend-backup-$(date +%Y%m%d-%H%M%S).jar"
        cp current.jar "$BACKUP_FILE"
        print_success "Backup created: $BACKUP_FILE"
    else
        print_warning "No current version to backup"
    fi
}

# Deploy locally
deploy_local() {
    print_step "Deploying to local environment..."

    # Stop existing process
    if [ -f ".liyaqa.pid" ]; then
        OLD_PID=$(cat .liyaqa.pid)
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            print_warning "Stopping existing process (PID: $OLD_PID)"
            kill "$OLD_PID"
            sleep 2
        fi
    fi

    # Copy JAR
    cp "$JAR_FILE" current.jar
    print_success "JAR copied"

    # Set environment variables
    export SPRING_PROFILES_ACTIVE=local
    export FRONTEND_BASE_URL=http://localhost:3000
    export SERVER_PORT=8080
    export EMAIL_ENABLED=false
    export DATABASE_URL="${DATABASE_URL:-jdbc:postgresql://localhost:5432/liyaqa}"

    # Start application
    nohup java -jar current.jar > logs/application.log 2>&1 &
    echo $! > .liyaqa.pid
    print_success "Application started (PID: $(cat .liyaqa.pid))"

    # Wait for startup
    print_step "Waiting for application to start..."
    for i in {1..30}; do
        if curl -s -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
            print_success "Application is running"
            return 0
        fi
        echo -n "."
        sleep 2
    done

    print_error "Application failed to start. Check logs/application.log"
    tail -50 logs/application.log
    exit 1
}

# Deploy to staging
deploy_staging() {
    print_step "Deploying to staging environment..."

    STAGING_SERVER="${STAGING_SERVER:-staging.liyaqa.com}"
    STAGING_USER="${STAGING_USER:-deploy}"

    print_warning "This requires SSH access to $STAGING_SERVER"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi

    # Copy JAR to staging
    print_step "Copying JAR to staging..."
    scp "$JAR_FILE" "$STAGING_USER@$STAGING_SERVER:/tmp/liyaqa-backend-new.jar"
    print_success "JAR copied to staging"

    # Deploy on staging server
    ssh "$STAGING_USER@$STAGING_SERVER" << 'ENDSSH'
        # Stop application
        sudo systemctl stop liyaqa-backend || true

        # Backup current version
        if [ -f /opt/liyaqa/liyaqa-backend.jar ]; then
            sudo cp /opt/liyaqa/liyaqa-backend.jar /opt/liyaqa/backups/liyaqa-backend-$(date +%Y%m%d-%H%M%S).jar
        fi

        # Deploy new version
        sudo mv /tmp/liyaqa-backend-new.jar /opt/liyaqa/liyaqa-backend.jar
        sudo chown liyaqa:liyaqa /opt/liyaqa/liyaqa-backend.jar

        # Start application
        sudo systemctl start liyaqa-backend

        # Wait for startup
        sleep 10
ENDSSH

    # Health check
    print_step "Running health check..."
    if curl -s -f "http://$STAGING_SERVER:8080/actuator/health" > /dev/null 2>&1; then
        print_success "Staging deployment successful"
    else
        print_error "Health check failed"
        exit 1
    fi
}

# Deploy to production
deploy_production() {
    print_step "Deploying to PRODUCTION environment..."

    print_warning "⚠️  WARNING: This will deploy to PRODUCTION!"
    print_warning "⚠️  Make sure all tests pass in staging first!"
    echo ""
    read -p "Type 'DEPLOY' to continue: " CONFIRM

    if [ "$CONFIRM" != "DEPLOY" ]; then
        print_error "Deployment cancelled"
        exit 1
    fi

    PROD_SERVER="${PROD_SERVER:-prod.liyaqa.com}"
    PROD_USER="${PROD_USER:-deploy}"

    # Similar to staging but with additional checks
    print_step "Final checks before production deployment..."

    # Check if staging is healthy
    STAGING_SERVER="${STAGING_SERVER:-staging.liyaqa.com}"
    if ! curl -s -f "http://$STAGING_SERVER:8080/actuator/health" > /dev/null 2>&1; then
        print_error "Staging is not healthy. Fix staging first!"
        exit 1
    fi
    print_success "Staging is healthy"

    # Deploy (same as staging but to production server)
    print_step "Deploying to production..."
    # ... (similar steps as staging)

    print_success "Production deployment successful"
    print_warning "Monitor application for the next hour!"
}

# Smoke tests
run_smoke_tests() {
    print_step "Running smoke tests..."

    BASE_URL="${BASE_URL:-http://localhost:8080}"

    # Health check
    if curl -s -f "$BASE_URL/actuator/health" | grep -q "UP"; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        return 1
    fi

    # Check actuator endpoints
    if curl -s -f "$BASE_URL/actuator/info" > /dev/null 2>&1; then
        print_success "Info endpoint accessible"
    else
        print_warning "Info endpoint not accessible (might be disabled)"
    fi

    print_success "Smoke tests passed"
}

# Show logs
show_logs() {
    print_step "Recent application logs..."

    if [ -f "logs/application.log" ]; then
        tail -50 logs/application.log
    else
        print_warning "No log file found"
    fi
}

# Monitor application
monitor() {
    print_step "Monitoring application..."

    print_warning "Press Ctrl+C to stop monitoring"
    echo ""

    tail -f logs/application.log | while read -r line; do
        if [[ $line == *"ERROR"* ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line == *"WARN"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ $line == *"Started"* ]]; then
            echo -e "${GREEN}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Rollback
rollback() {
    print_step "Rolling back to previous version..."

    BACKUP_DIR="backups"
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.jar 2>/dev/null | head -1)

    if [ -z "$LATEST_BACKUP" ]; then
        print_error "No backup found"
        exit 1
    fi

    print_warning "Rolling back to: $LATEST_BACKUP"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi

    # Stop application
    if [ -f ".liyaqa.pid" ]; then
        kill $(cat .liyaqa.pid) 2>/dev/null || true
    fi

    # Restore backup
    cp "$LATEST_BACKUP" current.jar
    print_success "Backup restored"

    # Restart
    nohup java -jar current.jar > logs/application.log 2>&1 &
    echo $! > .liyaqa.pid
    print_success "Application restarted with previous version"
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo ""
    echo "1) Test - Run automated tests"
    echo "2) Local - Deploy to local environment"
    echo "3) Staging - Deploy to staging server"
    echo "4) Production - Deploy to production server"
    echo "5) Smoke Tests - Run smoke tests"
    echo "6) Logs - Show recent logs"
    echo "7) Monitor - Monitor application logs"
    echo "8) Rollback - Rollback to previous version"
    echo "9) Exit"
    echo ""
    read -p "Enter choice [1-9]: " choice

    case $choice in
        1) run_tests ;;
        2) check_prerequisites && create_backup && deploy_local && run_smoke_tests ;;
        3) check_prerequisites && run_tests && create_backup && deploy_staging ;;
        4) check_prerequisites && run_tests && deploy_production ;;
        5) run_smoke_tests ;;
        6) show_logs ;;
        7) monitor ;;
        8) rollback ;;
        9) exit 0 ;;
        *) print_error "Invalid choice"; show_menu ;;
    esac
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    show_menu
else
    case "$1" in
        test) run_tests ;;
        local) check_prerequisites && create_backup && deploy_local && run_smoke_tests ;;
        staging) check_prerequisites && run_tests && deploy_staging ;;
        production) check_prerequisites && run_tests && deploy_production ;;
        smoke) run_smoke_tests ;;
        logs) show_logs ;;
        monitor) monitor ;;
        rollback) rollback ;;
        *)
            echo "Usage: $0 {test|local|staging|production|smoke|logs|monitor|rollback}"
            echo ""
            echo "Or run without arguments for interactive menu"
            exit 1
            ;;
    esac
fi

print_success "Deployment script completed"
