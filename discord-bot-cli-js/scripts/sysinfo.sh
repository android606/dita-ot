#!/bin/bash
# Example system information script for Discord Bot CLI
# This script provides detailed system information

echo "=== System Information ==="
echo
echo "Host Information:"
echo "  Hostname: $(hostname)"
echo "  Operating System: $(uname -s) $(uname -r)"
echo "  Architecture: $(uname -m)"
echo "  Uptime: $(uptime)"
echo
echo "Memory Usage:"
free -h | while read line; do
    echo "  $line"
done
echo
echo "Disk Usage:"
df -h | while read line; do
    echo "  $line"
done
echo
echo "CPU Information:"
echo "  Load Average: $(cat /proc/loadavg)"
echo "  CPU Cores: $(nproc)"
echo
echo "Network Information:"
ip addr show | grep -E "inet |inet6 " | while read line; do
    echo "  $line"
done
echo
echo "Process Information:"
echo "  Total Processes: $(ps aux | wc -l)"
echo "  Running Processes: $(ps aux | grep -v grep | wc -l)"
echo
echo "Date and Time:"
echo "  Current Time: $(date)"
echo "  Timezone: $(timedatectl show --property=Timezone --value 2>/dev/null || echo 'Unknown')"
echo
echo "System Information completed successfully!"