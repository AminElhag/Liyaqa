#!/bin/bash
# ===========================================
# Liyaqa Automated Backup Script
# ===========================================
# Backs up PostgreSQL database and uploads to S3
#
# Usage:
#   chmod +x backup.sh
#   ./backup.sh
#
# Schedule with cron (daily at 2 AM):
#   0 2 * * * /opt/liyaqa/deploy/backup.sh >> /var/log/liyaqa-backup.log 2>&1
#
# ===========================================

set -e

# Configuration
BACKUP_DIR="/opt/liyaqa/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="liyaqa_backup_${TIMESTAMP}"

# Load environment variables
if [ -f "/opt/liyaqa/.env" ]; then
    export $(grep -v '^#' /opt/liyaqa/.env | xargs)
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# ===========================================
# 1. Create Backup Directory
# ===========================================
mkdir -p "$BACKUP_DIR"

log_info "Starting backup: $BACKUP_NAME"

# ===========================================
# 2. Backup PostgreSQL Database
# ===========================================
log_info "Backing up PostgreSQL database..."

cd /opt/liyaqa

if ! docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-liyaqa}" \
    -d "${POSTGRES_DB:-liyaqa}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl | gzip > "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"; then
    log_error "Database backup failed!"
    exit 1
fi

# Verify backup file
if [ ! -f "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz" ]; then
    log_error "Backup file was not created!"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz" | cut -f1)
log_info "Database backup completed: ${BACKUP_SIZE}"

# ===========================================
# 3. Backup Application Files (Optional)
# ===========================================
log_info "Backing up application files..."

# Backup .env file (encrypted)
if [ -f "/opt/liyaqa/.env" ]; then
    cp /opt/liyaqa/.env "${BACKUP_DIR}/${BACKUP_NAME}.env"
    log_info "Environment file backed up"
fi

# Backup uploads directory if using local storage
if [ "${STORAGE_TYPE:-local}" = "local" ] && [ -d "/opt/liyaqa/uploads" ]; then
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" -C /opt/liyaqa uploads/
    UPLOADS_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" | cut -f1)
    log_info "Uploads backed up: ${UPLOADS_SIZE}"
fi

# ===========================================
# 4. Upload to S3 (if configured)
# ===========================================
if [ "${BACKUP_S3_BUCKET:-}" != "" ] && command -v aws &> /dev/null; then
    log_info "Uploading backup to S3..."

    S3_PATH="s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-backups/}${BACKUP_NAME}.sql.gz"

    if aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz" "$S3_PATH"; then
        log_info "Backup uploaded to S3: $S3_PATH"

        # Upload .env file
        if [ -f "${BACKUP_DIR}/${BACKUP_NAME}.env" ]; then
            aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.env" \
                "s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-backups/}${BACKUP_NAME}.env"
        fi

        # Upload uploads archive
        if [ -f "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" ]; then
            aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" \
                "s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-backups/}${BACKUP_NAME}_uploads.tar.gz"
        fi
    else
        log_warning "S3 upload failed, backup retained locally"
    fi
else
    log_warning "S3 not configured, backup retained locally only"
fi

# ===========================================
# 5. Clean Old Backups
# ===========================================
log_info "Cleaning backups older than ${RETENTION_DAYS} days..."

# Local cleanup
find "$BACKUP_DIR" -name "liyaqa_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "liyaqa_backup_*.env" -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "liyaqa_backup_*_uploads.tar.gz" -mtime +${RETENTION_DAYS} -delete

# S3 cleanup (if configured)
if [ "${BACKUP_S3_BUCKET:-}" != "" ] && command -v aws &> /dev/null; then
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)

    aws s3 ls "s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-backups/}" | \
    while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $4}' | grep -oP 'liyaqa_backup_\K\d{8}' || echo "99999999")
        FILE_NAME=$(echo "$line" | awk '{print $4}')

        if [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
            log_info "Deleting old S3 backup: $FILE_NAME"
            aws s3 rm "s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-backups/}$FILE_NAME"
        fi
    done
fi

# ===========================================
# 6. Backup Summary
# ===========================================
log_info "========================================="
log_info "Backup completed successfully!"
log_info "========================================="
log_info "Backup name: $BACKUP_NAME"
log_info "Database backup: ${BACKUP_SIZE}"
log_info "Location: ${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"

if [ "${BACKUP_S3_BUCKET:-}" != "" ]; then
    log_info "S3 location: s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX:-backups/}"
fi

# Count total backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "liyaqa_backup_*.sql.gz" | wc -l)
log_info "Total local backups: $BACKUP_COUNT"

# Disk usage
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_info "Total backup size: $TOTAL_SIZE"

log_info "========================================="

# ===========================================
# 7. Optional: Send Notification
# ===========================================
if [ "${SLACK_WEBHOOK_URL:-}" != "" ]; then
    curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"✅ Liyaqa backup completed\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Backup Name\", \"value\": \"$BACKUP_NAME\", \"short\": true},
                    {\"title\": \"Size\", \"value\": \"$BACKUP_SIZE\", \"short\": true},
                    {\"title\": \"Total Backups\", \"value\": \"$BACKUP_COUNT\", \"short\": true}
                ]
            }]
        }" > /dev/null 2>&1
fi

exit 0
