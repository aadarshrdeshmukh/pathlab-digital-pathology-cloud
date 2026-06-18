#!/bin/bash
# ============================================================
# PathLab Digital Pathology Cloud — Database Restore Script
# Restores MySQL database from a local .sql.gz backup file
# or downloads the latest backup from S3 first.
#
# Usage:
#   ./restore.sh                        # Restore latest S3 backup
#   ./restore.sh /path/to/backup.sql.gz  # Restore specific file
#
# Recovery Targets:
#   RPO (Recovery Point Objective): 24 hours (nightly backups)
#   RTO (Recovery Time Objective): ~4 hours (manual restore)
# ============================================================

set -euo pipefail

# Load environment
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

DB_CONTAINER="pathlab-db"
DB_NAME="${DB_NAME:-pathlab_db}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-pathlab_root_pw}"
BACKUP_DIR="$(dirname "$0")/../backups"
S3_BUCKET="${AWS_BUCKET_NAME:-}"

echo "========================================"
echo "  PathLab Database Restore"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Determine backup file to restore
BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE:-}" ]; then
  # No file specified — download latest from S3
  if [ -n "$S3_BUCKET" ]; then
    echo "[1/4] Fetching latest backup from S3..."
    mkdir -p "$BACKUP_DIR"
    LATEST=$(aws s3 ls "s3://${S3_BUCKET}/backups/" | sort | tail -n 1 | awk '{print $4}')
    if [ -z "$LATEST" ]; then
      echo "ERROR: No backups found in s3://${S3_BUCKET}/backups/"
      exit 1
    fi
    BACKUP_FILE="${BACKUP_DIR}/${LATEST}"
    aws s3 cp "s3://${S3_BUCKET}/backups/${LATEST}" "$BACKUP_FILE"
    echo "  Downloaded: $LATEST"
  else
    # Fall back to latest local backup
    echo "[1/4] No S3 bucket configured. Using latest local backup..."
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -n 1)
    if [ -z "$BACKUP_FILE" ]; then
      echo "ERROR: No local backups found in $BACKUP_DIR"
      exit 1
    fi
    echo "  Using: $(basename "$BACKUP_FILE")"
  fi
else
  echo "[1/4] Using specified backup file..."
  echo "  File: $BACKUP_FILE"
fi

# Verify file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  Size: $FILE_SIZE"

# Confirm before proceeding
echo ""
echo "WARNING: This will OVERWRITE the current database."
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Decompress and restore
echo ""
echo "[2/4] Decompressing backup..."
gunzip -k -f "$BACKUP_FILE"
SQL_FILE="${BACKUP_FILE%.gz}"
echo "  Decompressed: $(basename "$SQL_FILE")"

echo "[3/4] Restoring database..."
docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE"
echo "  Database restored successfully."

# Clean up decompressed file
rm -f "$SQL_FILE"

echo "[4/4] Verifying restore..."
TABLE_COUNT=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';")
ROW_COUNT=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" -N -e "SELECT SUM(TABLE_ROWS) FROM information_schema.tables WHERE table_schema='${DB_NAME}';")

echo ""
echo "========================================"
echo "  Restore Complete"
echo "  Tables: $TABLE_COUNT"
echo "  Total rows: $ROW_COUNT"
echo "  Source: $(basename "$BACKUP_FILE")"
echo "========================================"
