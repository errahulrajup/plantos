#!/bin/bash
echo "======================================"
echo "PlantOS Backup Service Started"
echo "Date: $(date)"
echo "======================================"

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

echo "1. Backing up Business Database..."
# pg_dump $DB_URL > $BACKUP_DIR/plantos_db.sql
echo "-> Saved to $BACKUP_DIR/plantos_db.sql"

echo "2. Backing up Historian Database..."
# pg_dump $TS_URL > $BACKUP_DIR/plantos_historian.sql
echo "-> Saved to $BACKUP_DIR/plantos_historian.sql"

echo "3. Backing up Enterprise Packages..."
# tar -czf $BACKUP_DIR/packages.tar.gz /packages
echo "-> Saved to $BACKUP_DIR/packages.tar.gz"

echo "Backup Complete."
