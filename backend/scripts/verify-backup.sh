#!/bin/bash
################################################################################
# Database Backup Verification Script
#
# This script verifies backup integrity by:
# 1. Creating a temporary test database
# 2. Restoring the latest backup to it
# 3. Verifying table count and basic integrity
# 4. Cleaning up the test database
#
# Usage:
#   ./verify-backup.sh [backup_file]
#
# If no backup file is specified, the script tests the latest backup.
#
# Environment Variables:
#   BACKUP_DIR     - Directory containing backups (default: /var/backups/liyaqa)
#   DB_CONTAINER   - Docker container name (default: postgres)
#   DB_USER        - Database user (default: liyaqa)
#   MIN_TABLE_COUNT - Minimum expected tables (default: 50)
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/liyaqa}"
DB_CONTAINER="${DB_CONTAINER:-postgres}"
DB_USER="${DB_USER:-liyaqa}"
MIN_TABLE_COUNT="${MIN_TABLE_COUNT:-50}"
LOG_FILE="${LOG_FILE:-/var/log/liyaqa-backup.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
error_exit() {
    log "${RED}❌ ERROR: $1${NC}"
    exit 1
}

log "${YELLOW}🔍 Starting backup verification...${NC}"

# Determine which backup to verify
if [ $# -eq 1 ]; then
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        error_exit "Backup file not found: ${BACKUP_FILE}"
    fi
else
    # Find latest backup
    BACKUP_FILE=$(find "$BACKUP_DIR" -name "liyaqa_*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)

    if [ -z "$BACKUP_FILE" ]; then
        error_exit "No backup files found in ${BACKUP_DIR}"
    fi
fi

log "Testing backup: ${BACKUP_FILE}"

# Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    error_exit "Docker container '${DB_CONTAINER}' is not running"
fi

# Generate unique test database name
TEST_DB="liyaqa_verify_$(date +%s)"

log "Creating test database: ${TEST_DB}"

# Create test database
if ! docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" -c "CREATE DATABASE ${TEST_DB};" > /dev/null 2>&1; then
    error_exit "Failed to create test database"
fi

# Function to cleanup test database
cleanup() {
    log "Cleaning up test database: ${TEST_DB}"
    docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" -c "DROP DATABASE IF EXISTS ${TEST_DB};" > /dev/null 2>&1 || true
}

# Ensure cleanup happens even if script fails
trap cleanup EXIT

# Restore backup to test database
log "Restoring backup to test database..."
if gunzip -c "$BACKUP_FILE" | docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" "${TEST_DB}" > /dev/null 2>&1; then
    log "${GREEN}✓${NC} Backup restored successfully"
else
    error_exit "Failed to restore backup"
fi

# Verify table count
log "Verifying database integrity..."
TABLE_COUNT=$(docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" "${TEST_DB}" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" | tr -d ' ')

log "Table count: ${TABLE_COUNT}"

# Check if we have the minimum expected number of tables
if [ "$TABLE_COUNT" -ge "$MIN_TABLE_COUNT" ]; then
    log "${GREEN}✓${NC} Table count verification passed (${TABLE_COUNT} >= ${MIN_TABLE_COUNT})"
else
    error_exit "Table count too low: ${TABLE_COUNT} < ${MIN_TABLE_COUNT}"
fi

# Verify flyway_schema_history exists (indicates migrations were restored)
log "Checking migration history..."
FLYWAY_EXISTS=$(docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" "${TEST_DB}" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='flyway_schema_history';" | tr -d ' ')

if [ "$FLYWAY_EXISTS" -eq 1 ]; then
    MIGRATION_COUNT=$(docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" "${TEST_DB}" -t -c \
        "SELECT COUNT(*) FROM flyway_schema_history;" | tr -d ' ')
    log "${GREEN}✓${NC} Migration history verified (${MIGRATION_COUNT} migrations)"
else
    log "${YELLOW}⚠${NC}  WARNING: flyway_schema_history table not found"
fi

# Verify some key tables exist
log "Checking key tables..."
KEY_TABLES=("users" "members" "bookings" "classes" "plans")
MISSING_TABLES=()

for table in "${KEY_TABLES[@]}"; do
    EXISTS=$(docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" "${TEST_DB}" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='${table}';" | tr -d ' ')

    if [ "$EXISTS" -eq 1 ]; then
        # Get row count for this table
        ROW_COUNT=$(docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" "${TEST_DB}" -t -c \
            "SELECT COUNT(*) FROM ${table};" | tr -d ' ' || echo "0")
        log "${GREEN}✓${NC} Table '${table}' exists (${ROW_COUNT} rows)"
    else
        MISSING_TABLES+=("$table")
        log "${YELLOW}⚠${NC}  Table '${table}' not found"
    fi
done

# Check for missing tables
if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    log "${YELLOW}⚠${NC}  WARNING: Some key tables are missing: ${MISSING_TABLES[*]}"
fi

# Get backup file size and age
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_AGE=$(find "$BACKUP_FILE" -printf '%TY-%Tm-%Td %TH:%TM\n')

# Final summary
log ""
log "${GREEN}✅ Backup verification PASSED!${NC}"
log ""
log "Verification Summary:"
log "  - Backup file: ${BACKUP_FILE}"
log "  - Backup size: ${BACKUP_SIZE}"
log "  - Backup date: ${BACKUP_AGE}"
log "  - Tables restored: ${TABLE_COUNT}"
log "  - Key tables verified: $((${#KEY_TABLES[@]} - ${#MISSING_TABLES[@]}))/${#KEY_TABLES[@]}"
log "  - Test database: ${TEST_DB} (will be cleaned up)"
log ""

exit 0
