#!/bin/bash
# Example hello script for Discord Bot CLI
# This script demonstrates how to use Discord context variables

echo "=== Hello from Discord Bot CLI! ==="
echo
echo "Discord Context:"
echo "  Message ID: $DISCORD_MESSAGE_ID"
echo "  Author: $DISCORD_AUTHOR"
echo "  Channel ID: $DISCORD_CHANNEL_ID"
echo "  Guild ID: $DISCORD_GUILD_ID"
echo "  Message Content: $DISCORD_MESSAGE_CONTENT"
echo "  Arguments: $DISCORD_ARGS"
echo
echo "System Information:"
echo "  Hostname: $(hostname)"
echo "  User: $(whoami)"
echo "  Date: $(date)"
echo "  Uptime: $(uptime -p)"
echo
echo "This script was executed successfully!"