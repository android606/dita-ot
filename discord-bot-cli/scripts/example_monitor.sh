#!/bin/bash
# Example monitoring script for Discord Bot CLI
# This script monitors system resources and sends alerts

echo "=== System Monitoring Report ==="
echo

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "Report generated at: $TIMESTAMP"
echo

# Memory monitoring
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
MEMORY_TOTAL=$(free -h | grep Mem | awk '{print $2}')
MEMORY_USED=$(free -h | grep Mem | awk '{print $3}')
MEMORY_AVAILABLE=$(free -h | grep Mem | awk '{print $7}')

echo "Memory Status:"
echo "  Usage: ${MEMORY_USAGE}%"
echo "  Total: $MEMORY_TOTAL"
echo "  Used: $MEMORY_USED"
echo "  Available: $MEMORY_AVAILABLE"

if (( $(echo "$MEMORY_USAGE > 80" | bc -l 2>/dev/null || echo "0") )); then
    echo "  ⚠️  WARNING: High memory usage detected!"
fi
echo

# Disk monitoring
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_TOTAL=$(df -h / | tail -1 | awk '{print $2}')
DISK_USED=$(df -h / | tail -1 | awk '{print $3}')
DISK_AVAILABLE=$(df -h / | tail -1 | awk '{print $4}')

echo "Disk Status:"
echo "  Usage: ${DISK_USAGE}%"
echo "  Total: $DISK_TOTAL"
echo "  Used: $DISK_USED"
echo "  Available: $DISK_AVAILABLE"

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "  ⚠️  WARNING: High disk usage detected!"
fi
echo

# CPU monitoring
LOAD_AVG=$(cat /proc/loadavg | awk '{print $1}')
CPU_CORES=$(nproc)
LOAD_PERCENT=$(echo "scale=2; $LOAD_AVG * 100 / $CPU_CORES" | bc 2>/dev/null || echo "0")

echo "CPU Status:"
echo "  Load Average: $LOAD_AVG"
echo "  CPU Cores: $CPU_CORES"
echo "  Load Percentage: ${LOAD_PERCENT}%"

if (( $(echo "$LOAD_PERCENT > 80" | bc -l 2>/dev/null || echo "0") )); then
    echo "  ⚠️  WARNING: High CPU load detected!"
fi
echo

# Process monitoring
TOTAL_PROCESSES=$(ps aux | wc -l)
RUNNING_PROCESSES=$(ps aux | grep -v grep | wc -l)

echo "Process Status:"
echo "  Total Processes: $TOTAL_PROCESSES"
echo "  Running Processes: $RUNNING_PROCESSES"
echo

# Network monitoring
NETWORK_INTERFACES=$(ip link show | grep -E "^[0-9]+:" | wc -l)
ACTIVE_CONNECTIONS=$(ss -tuln | wc -l)

echo "Network Status:"
echo "  Network Interfaces: $NETWORK_INTERFACES"
echo "  Active Connections: $ACTIVE_CONNECTIONS"
echo

# Service monitoring (if systemd is available)
if command -v systemctl &> /dev/null; then
    echo "Service Status:"
    FAILED_SERVICES=$(systemctl --failed --no-legend | wc -l)
    echo "  Failed Services: $FAILED_SERVICES"
    
    if [ "$FAILED_SERVICES" -gt 0 ]; then
        echo "  ⚠️  WARNING: Failed services detected!"
        systemctl --failed --no-legend | while read line; do
            echo "    - $line"
        done
    fi
    echo
fi

# Log monitoring (check for recent errors)
if [ -f "/var/log/syslog" ]; then
    ERROR_COUNT=$(grep -c "ERROR" /var/log/syslog 2>/dev/null || echo "0")
    echo "Log Status:"
    echo "  Error Count (syslog): $ERROR_COUNT"
    
    if [ "$ERROR_COUNT" -gt 10 ]; then
        echo "  ⚠️  WARNING: High error count in logs!"
    fi
    echo
fi

# Summary
echo "=== Summary ==="
ALERTS=0

if (( $(echo "$MEMORY_USAGE > 80" | bc -l 2>/dev/null || echo "0") )); then
    ALERTS=$((ALERTS + 1))
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    ALERTS=$((ALERTS + 1))
fi

if (( $(echo "$LOAD_PERCENT > 80" | bc -l 2>/dev/null || echo "0") )); then
    ALERTS=$((ALERTS + 1))
fi

if [ "$ALERTS" -eq 0 ]; then
    echo "✅ All systems normal"
else
    echo "⚠️  $ALERTS alert(s) detected"
fi

echo "Monitoring report completed successfully!"