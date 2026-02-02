#!/bin/bash
# ===========================================
# Liyaqa Health Check Script
# ===========================================
# Comprehensive health check for all services
#
# Usage:
#   ./health-check.sh           # Run all checks
#   ./health-check.sh --watch   # Continuous monitoring
#   ./health-check.sh --json    # JSON output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.droplet.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Print functions
print_header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Check if container is running
check_container() {
    local container_name="$1"
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        return 0
    else
        return 1
    fi
}

# Check container health
check_container_health() {
    local container_name="$1"
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

    if [ "$health" = "healthy" ]; then
        return 0
    elif [ "$health" = "none" ]; then
        # No health check defined, check if running
        if check_container "$container_name"; then
            return 0
        fi
    fi
    return 1
}

# Check PostgreSQL
check_postgres() {
    print_header "PostgreSQL Database"

    if ! check_container "liyaqa-postgres"; then
        print_error "Container not running"
        return 1
    fi

    print_success "Container is running"

    # Check connection
    if docker exec liyaqa-postgres pg_isready -U liyaqa > /dev/null 2>&1; then
        print_success "Database is accepting connections"
    else
        print_error "Database is not accepting connections"
        return 1
    fi

    # Check disk space
    local db_size=$(docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -t -c "SELECT pg_size_pretty(pg_database_size('liyaqa'));" 2>/dev/null | xargs)
    if [ -n "$db_size" ]; then
        print_info "Database size: $db_size"
    fi

    return 0
}

# Check Backend
check_backend() {
    print_header "Backend API"

    if ! check_container "liyaqa-backend"; then
        print_error "Container not running"
        return 1
    fi

    print_success "Container is running"

    # Check health endpoint
    if docker exec liyaqa-backend curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
        print_success "Health endpoint responding"

        # Get detailed health
        local health_json=$(docker exec liyaqa-backend curl -s http://localhost:8080/actuator/health 2>/dev/null)
        local db_status=$(echo "$health_json" | grep -o '"db":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")

        if [ "$db_status" = "UP" ]; then
            print_success "Database connection: UP"
        else
            print_warning "Database connection: $db_status"
        fi
    else
        print_error "Health endpoint not responding"
        return 1
    fi

    # Check memory usage
    local mem_usage=$(docker stats liyaqa-backend --no-stream --format "{{.MemUsage}}" 2>/dev/null | awk '{print $1}')
    if [ -n "$mem_usage" ]; then
        print_info "Memory usage: $mem_usage"
    fi

    return 0
}

# Check Frontend
check_frontend() {
    print_header "Frontend"

    if ! check_container "liyaqa-frontend"; then
        print_error "Container not running"
        return 1
    fi

    print_success "Container is running"

    # Check if responding
    if docker exec liyaqa-frontend wget -q --spider http://localhost:3000 2>/dev/null; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
        return 1
    fi

    # Check memory usage
    local mem_usage=$(docker stats liyaqa-frontend --no-stream --format "{{.MemUsage}}" 2>/dev/null | awk '{print $1}')
    if [ -n "$mem_usage" ]; then
        print_info "Memory usage: $mem_usage"
    fi

    return 0
}

# Check Nginx
check_nginx() {
    print_header "Nginx Reverse Proxy"

    if ! check_container "liyaqa-nginx"; then
        print_error "Container not running"
        return 1
    fi

    print_success "Container is running"

    # Check if nginx is responding
    if docker exec liyaqa-nginx nginx -t > /dev/null 2>&1; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors"
        return 1
    fi

    # Check ports
    if netstat -tuln 2>/dev/null | grep -q ':80 '; then
        print_success "Port 80 is listening"
    else
        print_warning "Port 80 is not listening"
    fi

    if netstat -tuln 2>/dev/null | grep -q ':443 '; then
        print_info "Port 443 is listening (HTTPS)"
    fi

    return 0
}

# Check system resources
check_system() {
    print_header "System Resources"

    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    print_info "Disk usage: ${disk_usage}%"
    if [ "$disk_usage" -gt 80 ]; then
        print_warning "Disk usage is high (>80%)"
    fi

    # Memory usage
    if command -v free > /dev/null; then
        local mem_usage=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
        print_info "Memory usage: ${mem_usage}%"
        if [ "$mem_usage" -gt 90 ]; then
            print_warning "Memory usage is high (>90%)"
        fi
    fi

    # Docker disk usage
    if command -v docker > /dev/null; then
        print_info "Docker disk usage:"
        docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}" | tail -n +2 | while read line; do
            echo "  $line"
        done
    fi

    return 0
}

# Check network connectivity
check_network() {
    print_header "Network Connectivity"

    # Check if we can reach the internet
    if curl -sf https://www.google.com > /dev/null 2>&1; then
        print_success "Internet connectivity: OK"
    else
        print_warning "Cannot reach external sites"
    fi

    # Check DNS
    if nslookup google.com > /dev/null 2>&1; then
        print_success "DNS resolution: OK"
    else
        print_warning "DNS resolution issues detected"
    fi

    return 0
}

# Check deployment status
check_deployment() {
    print_header "Deployment Status"

    if [ -d "$SCRIPT_DIR/../.git" ]; then
        cd "$SCRIPT_DIR/.."
        local current_commit=$(git log -1 --oneline 2>/dev/null || echo "unknown")
        local current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")

        print_info "Current branch: $current_branch"
        print_info "Current commit: $current_commit"
        print_info "Last deployment: $(stat -f '%Sm' .git/FETCH_HEAD 2>/dev/null || echo 'unknown')"
    else
        print_warning "Not a git repository"
    fi

    return 0
}

# Run all checks
run_all_checks() {
    local failed=0

    echo ""
    echo "=========================================="
    echo "  Liyaqa Health Check"
    echo "=========================================="
    echo "  Time: $(date)"
    echo "=========================================="

    check_postgres || ((failed++))
    check_backend || ((failed++))
    check_frontend || ((failed++))
    check_nginx || ((failed++))
    check_system
    check_network
    check_deployment

    echo ""
    echo "=========================================="
    if [ $failed -eq 0 ]; then
        print_success "All checks passed! ✓"
    else
        print_error "$failed check(s) failed"
    fi
    echo "=========================================="
    echo ""

    return $failed
}

# Watch mode - continuous monitoring
watch_mode() {
    while true; do
        clear
        run_all_checks
        echo "Refreshing in 30 seconds... (Ctrl+C to stop)"
        sleep 30
    done
}

# JSON output mode
json_mode() {
    local postgres_status="down"
    local backend_status="down"
    local frontend_status="down"
    local nginx_status="down"

    check_container "liyaqa-postgres" && postgres_status="up"
    check_container "liyaqa-backend" && backend_status="up"
    check_container "liyaqa-frontend" && frontend_status="up"
    check_container "liyaqa-nginx" && nginx_status="up"

    cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "services": {
    "postgres": "$postgres_status",
    "backend": "$backend_status",
    "frontend": "$frontend_status",
    "nginx": "$nginx_status"
  },
  "overall": "$([ "$postgres_status" = "up" ] && [ "$backend_status" = "up" ] && [ "$frontend_status" = "up" ] && [ "$nginx_status" = "up" ] && echo "healthy" || echo "unhealthy")"
}
EOF
}

# Main
main() {
    case "${1:-}" in
        --watch|-w)
            watch_mode
            ;;
        --json|-j)
            json_mode
            ;;
        --help|-h)
            echo "Usage: $0 [--watch|--json|--help]"
            echo ""
            echo "Options:"
            echo "  (no args)        Run health check once"
            echo "  --watch, -w      Continuous monitoring (refreshes every 30s)"
            echo "  --json, -j       Output in JSON format"
            echo "  --help, -h       Show this help"
            ;;
        *)
            run_all_checks
            exit $?
            ;;
    esac
}

main "$@"
