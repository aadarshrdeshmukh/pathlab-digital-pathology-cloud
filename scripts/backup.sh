#!/bin/bash
# PathLab Digital Pathology Cloud - MySQL Backup & S3 Upload Script
# Designed to run as a nightly cron job on the Linux VM host

# Load variables
BACKUP_DIR="/app/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pathlab_db_$TIMESTAMP.sql"
GZIP_FILE="$BACKUP_FILE.gz"
CONTAINER_NAME="pathlab-db"
DB_NAME="pathlab_db"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:?ERROR: DB_PASSWORD environment variable is not set. Export it before running this script.}"

# S3 configurations (fallback to local if bucket is not defined)
S3_BUCKET_NAME="" # e.g. "pathlab-digital-reports"

# Create local backup directory if it does not exist
mkdir -p "$BACKUP_DIR"

echo "[1/4] Starting MySQL dump from container: $CONTAINER_NAME..."
docker exec "$CONTAINER_NAME" mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[2/4] MySQL database dump created successfully: $BACKUP_FILE"
    
    # Compress the SQL dump
    gzip "$BACKUP_FILE"
    echo "Compression complete: $GZIP_FILE"

    # Upload to AWS S3 if a bucket name is provided
    if [ -n "$S3_BUCKET_NAME" ]; then
        echo "[3/4] Uploading database backup to AWS S3 bucket: s3://$S3_BUCKET_NAME/backups/..."
        aws s3 cp "$GZIP_FILE" "s3://$S3_BUCKET_NAME/backups/pathlab_db_$TIMESTAMP.sql.gz"
        
        if [ $? -eq 0 ]; then
            echo "S3 Cloud upload completed successfully."
        else
            echo "WARNING: AWS S3 copy failed. Verify AWS CLI configuration and permissions."
        fi
    else
        echo "[3/4] Skipping AWS S3 upload (No S3_BUCKET_NAME specified in script)."
    fi

    # Prune local backups older than 7 days
    echo "[4/4] Pruning local backups older than 7 days..."
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +7 -exec rm -f {} \;
    echo "Pruning complete."
else
    echo "ERROR: Database backup dump failed. Make sure container '$CONTAINER_NAME' is running."
    exit 1
fi
