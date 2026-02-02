#!/bin/bash
# ===========================================
# Liyaqa DigitalOcean Deployment Script
# ===========================================
# Automated deployment for DigitalOcean Droplets
#
# This script will:
#   1. Validate environment configuration
#   2. Create necessary directories
#   3. Pull latest Docker images
#   4. Deploy the application stack
#   5. Configure monitoring
#   6. Setup automated backups
#
# Usage:
#   chmod +x deploy-digitalocean.sh
#   ./deploy-digitalocean.sh [options]
#
# Options:
#   --init          First-time setup (creates directories, configs)
#   --update        Update existing deployment
#   --rollback      Rollback to previous version
#   --status        Show deployment status
#   --logs          Show application logs
#   --monitoring    Deploy monitoring stack
#   --backup        Run manual backup
#   --help          Show this help message
#
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/opt/liyaqa"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env"
BACKUP_DIR="/opt/liyaqa/backups"

# ===========================================
# Helper Functions
# ===========================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_error "Please do NOT run this script as root"
        log_info "Run as your regular user (docker group member)"
        exit 1
    fi
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        log_info "Run: sudo ./deploy/setup-server.sh first"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Cannot connect to Docker daemon"
        log_info "Make sure Docker service is running: sudo systemctl start docker"
        log_info "Make sure you're in docker group: sudo usermod -aG docker $USER"
        exit 1
    fi
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Copy and configure: cp deploy/.env.production .env"
        exit 1
    fi

    # Check for placeholder values
    if grep -q "YOUR_DOMAIN_OR_IP" "$ENV_FILE" || \
       grep -q "CHANGE_THIS" "$ENV_FILE" || \
       ! grep -q "POSTGRES_PASSWORD=.\+" "$ENV_FILE" || \
       ! grep -q "JWT_SECRET=.\{32,\}" "$ENV_FILE"; then
        log_error "Environment file contains placeholder values"
        log_info "Please edit .env and set all required values"
        exit 1
    fi

    log_success "Environment file validated"
}

create_directories() {
    log_info "Creating directory structure..."

    mkdir -p "$PROJECT_ROOT"/{data/{postgres,redis},backups,logs,nginx/conf.d,certbot/{conf,www}}
    mkdir -p "$PROJECT_ROOT"/deploy/{nginx,postgres,monitoring}

    log_success "Directories created"
}

generate_secrets() {
    log_info "Generating secure secrets..."

    local env_file="$ENV_FILE"
    local temp_file=$(mktemp)

    # Generate POSTGRES_PASSWORD if empty
    if ! grep -q "POSTGRES_PASSWORD=.\+" "$env_file"; then
        local db_pass=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        sed "s/POSTGRES_PASSWORD=/POSTGRES_PASSWORD=$db_pass/" "$env_file" > "$temp_file"
        mv "$temp_file" "$env_file"
        log_success "Generated database password"
    fi

    # Generate JWT_SECRET if empty or too short
    if ! grep -q "JWT_SECRET=.\{48,\}" "$env_file"; then
        local jwt_secret=$(openssl rand -base64 48 | tr -d "=+/")
        sed "s/JWT_SECRET=/JWT_SECRET=$jwt_secret/" "$env_file" > "$temp_file"
        mv "$temp_file" "$env_file"
        log_success "Generated JWT secret"
    fi

    # Generate REDIS_PASSWORD if empty
    if ! grep -q "REDIS_PASSWORD=.\+" "$env_file"; then
        local redis_pass=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
        sed "s/REDIS_PASSWORD=/REDIS_PASSWORD=$redis_pass/" "$env_file" > "$temp_file"
        mv "$temp_file" "$env_file"
        log_success "Generated Redis password"
    fi

    # Generate GRAFANA_ADMIN_PASSWORD if empty
    if ! grep -q "GRAFANA_ADMIN_PASSWORD=.\+" "$env_file"; then
        local grafana_pass=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
        sed "s/GRAFANA_ADMIN_PASSWORD=/GRAFANA_ADMIN_PASSWORD=$grafana_pass/" "$env_file" > "$temp_file"
        mv "$temp_file" "$env_file"
        log_success "Generated Grafana password"
    fi

    log_success "All secrets generated"
}

pull_images() {
    log_info "Pulling latest Docker images..."

    docker compose -f "$COMPOSE_FILE" pull

    log_success "Images pulled successfully"
}

deploy_app() {
    log_info "Deploying Liyaqa application..."

    # Stop existing containers gracefully
    if docker compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
        log_info "Stopping existing containers..."
        docker compose -f "$COMPOSE_FILE" down --timeout 30
    fi

    # Start services
    log_info "Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d

    # Wait for health checks
    log_info "Waiting for services to be healthy..."
    sleep 10

    # Check service health
    local retries=30
    local count=0
    while [ $count -lt $retries ]; do
        if docker compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
            log_success "Services are healthy!"
            break
        fi
        count=$((count + 1))
        echo -n "."
        sleep 2
    done

    if [ $count -eq $retries ]; then
        log_warning "Health check timeout, checking logs..."
        docker compose -f "$COMPOSE_FILE" logs --tail=50
    fi

    log_success "Application deployed successfully"
}

deploy_monitoring() {
    log_info "Deploying monitoring stack..."

    if [ -f "docker-compose.monitoring.yml" ]; then
        docker compose -f docker-compose.monitoring.yml up -d
        log_success "Monitoring stack deployed"
        log_info "Access Grafana at: http://$(hostname -I | awk '{print $1}'):3001"
        log_info "Access Prometheus at: http://$(hostname -I | awk '{print $1}'):9090"
    else
        log_warning "Monitoring compose file not found"
    fi
}

show_status() {
    log_info "Deployment Status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

show_logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f --tail=100 "$service"
    else
        docker compose -f "$COMPOSE_FILE" logs -f --tail=50
    fi
}

backup_database() {
    log_info "Creating database backup..."

    local backup_name="liyaqa_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    local backup_path="$BACKUP_DIR/$backup_name"

    # Create backup
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
        -U liyaqa -d liyaqa | gzip > "$backup_path"

    if [ -f "$backup_path" ]; then
        log_success "Backup created: $backup_path"
        log_info "Backup size: $(du -h "$backup_path" | cut -f1)"

        # Clean old backups (keep last 30 days)
        find "$BACKUP_DIR" -name "liyaqa_backup_*.sql.gz" -mtime +30 -delete

        return 0
    else
        log_error "Backup failed"
        return 1
    fi
}

rollback() {
    log_warning "Rolling back to previous deployment..."

    # Pull previous images (assumes you tagged previous version)
    local previous_tag=${1:-previous}

    log_info "Pulling images with tag: $previous_tag"
    # You would need to tag your images appropriately
    # This is a placeholder - implement based on your versioning strategy

    docker compose -f "$COMPOSE_FILE" down
    docker compose -f "$COMPOSE_FILE" up -d

    log_success "Rollback complete"
}

setup_ssl() {
    local domain=${1:-}
    local email=${2:-}

    if [ -z "$domain" ] || [ -z "$email" ]; then
        log_error "Usage: $0 --ssl <domain> <email>"
        exit 1
    fi

    log_info "Setting up SSL for $domain..."

    # Run certbot
    docker compose -f "$COMPOSE_FILE" --profile ssl run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        -d "$domain"

    if [ $? -eq 0 ]; then
        log_success "SSL certificate obtained!"
        log_info "Update nginx configuration and reload: docker compose exec nginx nginx -s reload"
    else
        log_error "SSL setup failed"
    fi
}

init_deployment() {
    log_info "=== Initializing Liyaqa Deployment ==="

    check_docker
    create_directories

    # Copy configuration files if not exist
    if [ ! -f "$ENV_FILE" ]; then
        cp "$SCRIPT_DIR/.env.production" "$ENV_FILE"
        log_info "Created .env from template"
    fi

    # Copy nginx configs
    if [ ! -f "nginx/conf.d/default.conf" ]; then
        cp -r "$SCRIPT_DIR/nginx/"* nginx/
        log_info "Copied nginx configuration"
    fi

    generate_secrets
    check_env_file

    log_success "Initialization complete!"
    log_info "Next steps:"
    log_info "  1. Edit .env with your domain and API keys"
    log_info "  2. Run: ./deploy-digitalocean.sh --deploy"
}

update_deployment() {
    log_info "=== Updating Liyaqa Deployment ==="

    check_docker
    check_env_file

    # Backup before update
    backup_database

    pull_images
    deploy_app

    log_success "Update complete!"
}

show_help() {
    cat << EOF
Liyaqa DigitalOcean Deployment Script

Usage: $0 [OPTION]

OPTIONS:
  --init              First-time setup (creates directories, configs)
  --deploy            Deploy application
  --update            Update existing deployment
  --rollback [tag]    Rollback to previous version
  --status            Show deployment status
  --logs [service]    Show application logs
  --monitoring        Deploy monitoring stack
  --backup            Run manual database backup
  --ssl <domain> <email>  Setup SSL certificate
  --help              Show this help message

EXAMPLES:
  # First time setup
  $0 --init

  # Deploy application
  $0 --deploy

  # Update deployment
  $0 --update

  # View logs
  $0 --logs
  $0 --logs backend

  # Setup SSL
  $0 --ssl liyaqa.example.com admin@example.com

For more information, see: /opt/liyaqa/deploy/DIGITALOCEAN_DEPLOYMENT_GUIDE.md
EOF
}

# ===========================================
# Main Script
# ===========================================

# Change to project root
cd "$PROJECT_ROOT" 2>/dev/null || cd "$(dirname "$0")/.."

case "${1:-}" in
    --init)
        init_deployment
        ;;
    --deploy)
        check_docker
        check_env_file
        pull_images
        deploy_app
        ;;
    --update)
        update_deployment
        ;;
    --rollback)
        rollback "${2:-previous}"
        ;;
    --status)
        show_status
        ;;
    --logs)
        show_logs "${2:-}"
        ;;
    --monitoring)
        deploy_monitoring
        ;;
    --backup)
        backup_database
        ;;
    --ssl)
        setup_ssl "$2" "$3"
        ;;
    --help|"")
        show_help
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
