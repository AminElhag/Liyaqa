# Database Backup Scripts

This directory contains scripts for automated database backup and verification.

## Scripts

### `backup-database.sh`

Automated PostgreSQL backup script with compression, retention policy, and optional S3 upload.

**Features:**
- Compressed backups using gzip
- 30-day retention policy for daily backups
- Monthly backups kept forever
- Optional S3 upload for off-site storage
- Detailed logging

**Usage:**
```bash
# Daily backup
./backup-database.sh

# Monthly backup (kept forever)
./backup-database.sh monthly
```

**Environment Variables:**
- `BACKUP_DIR` - Local backup directory (default: `/var/backups/liyaqa`)
- `AWS_S3_BACKUP_BUCKET` - S3 bucket for off-site backups (optional)
- `DB_CONTAINER` - Docker container name (default: `postgres`)
- `DB_USER` - Database user (default: `liyaqa`)
- `DB_NAME` - Database name (default: `liyaqa`)
- `RETENTION_DAYS` - Days to keep daily backups (default: `30`)
- `LOG_FILE` - Log file location (default: `/var/log/liyaqa-backup.log`)

### `verify-backup.sh`

Verifies backup integrity by restoring to a temporary database and running validation checks.

**Features:**
- Restores backup to temporary test database
- Verifies table count
- Checks for key tables (users, members, bookings, etc.)
- Validates migration history
- Automatic cleanup of test database

**Usage:**
```bash
# Verify latest backup
./verify-backup.sh

# Verify specific backup
./verify-backup.sh /var/backups/liyaqa/liyaqa_20260131_020000.sql.gz
```

**Environment Variables:**
- `BACKUP_DIR` - Backup directory to search (default: `/var/backups/liyaqa`)
- `DB_CONTAINER` - Docker container name (default: `postgres`)
- `DB_USER` - Database user (default: `liyaqa`)
- `MIN_TABLE_COUNT` - Minimum expected tables (default: `50`)
- `LOG_FILE` - Log file location (default: `/var/log/liyaqa-backup.log`)

## Setup Instructions

### 1. Create Backup Directory

```bash
sudo mkdir -p /var/backups/liyaqa/monthly
sudo chown -R $USER:$USER /var/backups/liyaqa
```

### 2. Create Log Directory

```bash
sudo mkdir -p /var/log
sudo touch /var/log/liyaqa-backup.log
sudo chown $USER:$USER /var/log/liyaqa-backup.log
```

### 3. Test Scripts Manually

```bash
# Test backup creation
cd /opt/liyaqa
./backend/scripts/backup-database.sh

# Test backup verification
./backend/scripts/verify-backup.sh
```

### 4. Install Cron Jobs

```bash
# Install the crontab
crontab deploy/crontab.txt

# Verify cron jobs are installed
crontab -l
```

### 5. Configure S3 (Optional)

For off-site backups to AWS S3:

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Set S3 bucket in environment
export AWS_S3_BACKUP_BUCKET=liyaqa-backups-prod

# Add to .env or systemd service file for persistence
echo "AWS_S3_BACKUP_BUCKET=liyaqa-backups-prod" | sudo tee -a /opt/liyaqa/.env
```

## Monitoring

### Check Backup Status

```bash
# View recent backup logs
tail -f /var/log/liyaqa-backup.log

# List all backups
ls -lh /var/backups/liyaqa/

# Check backup sizes
du -sh /var/backups/liyaqa/*
```

### Verify Cron Jobs Are Running

```bash
# Check system cron logs
sudo grep -i liyaqa /var/log/syslog

# Or on systems using journalctl
sudo journalctl -u cron | grep liyaqa
```

## Disaster Recovery

### Manual Restore Procedure

```bash
# 1. Stop the application
cd /opt/liyaqa
docker-compose down

# 2. Drop and recreate the database
docker-compose up -d postgres
docker-compose exec postgres psql -U liyaqa -c "DROP DATABASE IF EXISTS liyaqa;"
docker-compose exec postgres psql -U liyaqa -c "CREATE DATABASE liyaqa;"

# 3. Restore from backup
gunzip -c /var/backups/liyaqa/liyaqa_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U liyaqa liyaqa

# 4. Restart the application
docker-compose up -d

# 5. Verify the application is working
curl http://localhost:8080/api/health
```

### Point-in-Time Recovery

PostgreSQL backups created by `pg_dump` are logical backups and don't support point-in-time recovery. For PITR, you would need to set up WAL archiving. This is typically only necessary for very large databases or strict compliance requirements.

## Troubleshooting

### Backup Script Fails

```bash
# Check if Docker is running
docker ps

# Check if postgres container is running
docker ps | grep postgres

# Test database connection
docker-compose exec postgres psql -U liyaqa -c "SELECT version();"

# Check disk space
df -h /var/backups/liyaqa
```

### Verification Script Fails

```bash
# Check if backup file exists and is readable
ls -lh /var/backups/liyaqa/

# Try manual restore to test database
gunzip -c /var/backups/liyaqa/liyaqa_*.sql.gz | head -n 100

# Check PostgreSQL logs
docker-compose logs postgres
```

### Cron Jobs Not Running

```bash
# Check cron service is running
sudo systemctl status cron

# Verify crontab is installed
crontab -l

# Check cron logs for errors
sudo tail -f /var/log/syslog | grep CRON
```

## Best Practices

1. **Monitor backup sizes** - Significant changes in backup size may indicate data loss or corruption
2. **Test restores regularly** - The verification script helps, but periodically do a full manual restore test
3. **Store backups off-site** - Use S3 or another cloud storage provider
4. **Keep multiple backup generations** - Don't rely on just the latest backup
5. **Document restore procedures** - Make sure your team knows how to restore from backup
6. **Alert on backup failures** - Set up monitoring to notify you if backups fail
7. **Encrypt sensitive backups** - If backups contain PII, encrypt them before uploading to S3

## Security Considerations

- Backup files contain sensitive data - protect them with appropriate file permissions
- Use encrypted S3 buckets for off-site storage
- Rotate AWS credentials regularly
- Limit access to backup directories
- Consider encrypting backups before upload: `gpg --encrypt backup.sql.gz`
