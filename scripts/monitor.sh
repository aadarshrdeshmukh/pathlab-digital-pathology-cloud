#!/bin/bash
# PathLab Digital Pathology Cloud - Server Resource Monitor Script
# Appends system resource usage metrics to /var/log/pathlab_monitor.log

LOG_FILE="/var/log/pathlab_monitor.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Ensure log directory exists
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo touch "$LOG_FILE"
sudo chmod 666 "$LOG_FILE"

# 1. Check CPU Utilization
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

# 2. Check Memory Consumption
MEM_INFO=$(free -m)
MEM_TOTAL=$(echo "$MEM_INFO" | awk '/Mem:/ {print $2}')
MEM_USED=$(echo "$MEM_INFO" | awk '/Mem:/ {print $3}')
MEM_PCT=$(echo "$MEM_USED $MEM_TOTAL" | awk '{printf "%.2f", ($1/$2)*100}')

# 3. Check Storage Usage
DISK_PCT=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# Write metrics log
echo "[$TIMESTAMP] CPU: ${CPU_USAGE}% | RAM: ${MEM_PCT}% (${MEM_USED}MB/${MEM_TOTAL}MB) | Disk: ${DISK_PCT}%" >> "$LOG_FILE"

# Alert thresholds
CPU_THRESHOLD=90
MEM_THRESHOLD=90
DISK_THRESHOLD=90

if [ "$(echo "$CPU_USAGE $CPU_THRESHOLD" | awk '{print ($1 > $2) ? 1 : 0}')" -eq 1 ]; then
    echo "[$TIMESTAMP] [ALERT] High CPU usage detected: ${CPU_USAGE}%" >> "$LOG_FILE"
fi

if [ "$(echo "$MEM_PCT $MEM_THRESHOLD" | awk '{print ($1 > $2) ? 1 : 0}')" -eq 1 ]; then
    echo "[$TIMESTAMP] [ALERT] High Memory usage detected: ${MEM_PCT}%" >> "$LOG_FILE"
fi

if [ "$DISK_PCT" -gt "$DISK_THRESHOLD" ]; then
    echo "[$TIMESTAMP] [ALERT] High Disk usage detected: ${DISK_PCT}%" >> "$LOG_FILE"
fi
