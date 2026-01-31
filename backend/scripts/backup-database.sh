#!/bin/bash
################################################################################
# Automated PostgreSQL Backup Script
#
# This script creates compressed backups of the Liyaqa database with:
# - Automatic compression (gzip)
# - Retention policy (30 days)
# - Optional S3 upload for off-site storage
# - Logging for audit trail
#
# Usage:
#   ./backup-database.sh [monthly]
#
# Environment Variables:
#   BACKUP_DIR           - Directory for local backups (default: /var/backups/liyaqa)
#   AWS_S3_BACKUP_BUCKET - S3 bucket for off-site backups (optional)
#   DB_CONTAINER         - Docker container name (default: postgres)
#   DB_USER              - Database user (default: liyaqa)
#   DB_NAME              - Database name (default: liyaqa)
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/liyaqa}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-postgres}"
DB_USER="${DB_USER:-liyaqa}"
DB_NAME="${DB_NAME:-liyaqa}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_FILE:-/var/log/liyaqa-backup.log}"

# Determine backup type (monthly backups are kept forever)
if [ "${1:-}" = "monthly" ]; then
    BACKUP_TYPE="monthly"
    BACKUP_FILE="${BACKUP_DIR}/monthly/liyaqa_${TIMESTAMP}.sql.gz"
else
    BACKUP_TYPE="daily"
    BACKUP_FILE="${BACKUP_DIR}/liyaqa_${TIMESTAMP}.sql.gz"
fi

# Create backup directories if they don't exist
mkdir -p "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/monthly"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$BACKUP_TYPE] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting database backup..."

# Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    error_exit "Docker container '${DB_CONTAINER}' is not running"
fi

# Create backup with compression
log "Creating backup: ${BACKUP_FILE}"
if docker compose exec -T "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    error_exit "Failed to create database backup"
fi

# Verify backup file is not empty
if [ ! -s "$BACKUP_FILE" ]; then
    error_exit "Backup file is empty"
fi

# Upload to S3 if configured
if [ -n "${AWS_S3_BACKUP_BUCKET:-}" ]; then
    log "Uploading backup to S3: s3://${AWS_S3_BACKUP_BUCKET}/backups/"

    if command -v aws &> /dev/null; then
        if aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BACKUP_BUCKET}/backups/$(basename "$BACKUP_FILE")"; then
            log "S3 upload successful"
        else
            log "WARNING: S3 upload failed, but local backup is available"
        fi
    else
        log "WARNING: AWS CLI not installed, skipping S3 upload"
    fi
fi

# Clean old backups (only for daily backups, keep monthly forever)
if [ "$BACKUP_TYPE" = "daily" ]; then
    log "Cleaning backups older than ${RETENTION_DAYS} days..."

    DELETED_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -name "liyaqa_*.sql.gz" -mtime +${RETENTION_DAYS} -type f -delete -print | wc -l)

    if [ "$DELETED_COUNT" -gt 0 ]; then
        log "Deleted ${DELETED_COUNT} old backup(s)"
    else
        log "No old backups to delete"
    fi
fi

# Display backup summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "liyaqa_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Backup summary:"
log "  - Total backups: ${TOTAL_BACKUPS}"
log "  - Total size: ${TOTAL_SIZE}"
log "  - Latest backup: ${BACKUP_FILE}"
log "Backup completed successfully!"

exit 0
