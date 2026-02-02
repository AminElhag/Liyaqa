#!/bin/bash
# ===========================================
# Liyaqa Rollback Script
# ===========================================
# Emergency rollback to previous deployment
#
# Usage:
#   ./rollback.sh                    # Rollback to previous commit
#   ./rollback.sh COMMIT_HASH        # Rollback to specific commit
#   ./rollback.sh --list             # List recent commits
#
# Safety: Creates backup before rollback

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.droplet.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Check if running on droplet
check_environment() {
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_error ".env file not found in $PROJECT_ROOT"
        print_error "This script should be run on the production droplet"
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "docker-compose.droplet.yml not found"
        exit 1
    fi
}

# List recent commits
list_commits() {
    print_info "Recent deployments (last 10 commits):"
    echo ""
    cd "$PROJECT_ROOT"
    git log --oneline --decorate -10
    echo ""
    print_info "Current deployment:"
    git log -1 --oneline --decorate
}

# Create backup
create_backup() {
    print_info "Creating backup of current deployment..."

    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CURRENT_COMMIT=$(cd "$PROJECT_ROOT" && git rev-parse --short HEAD)
    BACKUP_FILE="$BACKUP_DIR/rollback_backup_${CURRENT_COMMIT}_${TIMESTAMP}.tar.gz"

    cd "$PROJECT_ROOT"

    # Backup current code state
    tar -czf "$BACKUP_FILE" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='backups' \
        --exclude='deploy/postgres_data' \
        .

    print_success "Backup created: $BACKUP_FILE"
    echo ""
}

# Rollback code
rollback_code() {
    local target_commit="$1"

    cd "$PROJECT_ROOT"

    if [ -z "$target_commit" ]; then
        # Rollback to previous commit
        print_info "Rolling back to previous commit..."
        target_commit="HEAD~1"
    else
        # Validate commit exists
        if ! git rev-parse --verify "$target_commit" >/dev/null 2>&1; then
            print_error "Commit '$target_commit' not found"
            exit 1
        fi
    fi

    # Show what we're rolling back from/to
    print_info "Current commit:"
    git log -1 --oneline HEAD
    echo ""
    print_info "Rolling back to:"
    git log -1 --oneline "$target_commit"
    echo ""

    # Confirm rollback
    print_warning "This will rollback the code to the selected commit"
    read -p "Continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Rollback cancelled"
        exit 0
    fi

    # Perform rollback
    print_info "Performing git reset..."
    git reset --hard "$target_commit"

    print_success "Code rolled back to: $(git log -1 --oneline)"
}

# Redeploy services
redeploy_services() {
    print_info "Redeploying services with rolled back code..."
    echo ""

    # Copy environment
    cp "$PROJECT_ROOT/.env" "$SCRIPT_DIR/.env"

    cd "$SCRIPT_DIR"

    # Pull images (may be from cache)
    print_info "Pulling Docker images..."
    docker compose -f docker-compose.droplet.yml pull

    # Restart services
    print_info "Restarting services..."
    docker compose -f docker-compose.droplet.yml up -d

    # Wait for backend to be healthy
    print_info "Waiting for backend to be healthy (this may take 1-2 minutes)..."
    MAX_ATTEMPTS=40
    ATTEMPT=0

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        ATTEMPT=$((ATTEMPT + 1))

        if docker ps | grep -q liyaqa-backend; then
            if docker exec liyaqa-backend curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
                print_success "Backend is healthy!"
                break
            fi
        fi

        echo -n "."
        sleep 3
    done
    echo ""

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        print_error "Backend failed to become healthy"
        print_warning "Check logs: docker compose -f $COMPOSE_FILE logs backend"
        exit 1
    fi
}

# Verify rollback
verify_deployment() {
    print_info "Verifying deployment..."
    echo ""

    cd "$SCRIPT_DIR"

    # Check container status
    print_info "Container status:"
    docker compose -f docker-compose.droplet.yml ps
    echo ""

    # Check backend health
    if docker exec liyaqa-backend curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
    fi

    # Check current deployment
    cd "$PROJECT_ROOT"
    print_info "Current deployment:"
    git log -1 --oneline --decorate
}

# Main rollback process
perform_rollback() {
    local target_commit="$1"

    echo ""
    echo "=========================================="
    echo "  Liyaqa Deployment Rollback"
    echo "=========================================="
    echo ""

    check_environment
    create_backup
    rollback_code "$target_commit"
    redeploy_services
    verify_deployment

    echo ""
    echo "=========================================="
    print_success "Rollback completed successfully!"
    echo "=========================================="
    echo ""
    print_info "Current deployment: $(cd "$PROJECT_ROOT" && git log -1 --oneline)"
    echo ""
    print_info "If you need to rollback further, run:"
    echo "  ./rollback.sh --list    # View commits"
    echo "  ./rollback.sh COMMIT    # Rollback to specific commit"
    echo ""
    print_info "Monitor logs with:"
    echo "  docker compose -f docker-compose.droplet.yml logs -f"
}

# Script entry point
main() {
    case "${1:-}" in
        --list|-l)
            list_commits
            ;;
        --help|-h)
            echo "Usage: $0 [COMMIT_HASH|--list|--help]"
            echo ""
            echo "Options:"
            echo "  (no args)        Rollback to previous commit"
            echo "  COMMIT_HASH      Rollback to specific commit"
            echo "  --list, -l       List recent commits"
            echo "  --help, -h       Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                   # Rollback 1 commit"
            echo "  $0 abc1234           # Rollback to commit abc1234"
            echo "  $0 --list            # Show recent commits"
            ;;
        *)
            perform_rollback "$1"
            ;;
    esac
}

main "$@"
