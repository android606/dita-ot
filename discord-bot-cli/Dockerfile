# Discord Bot CLI Dockerfile
FROM python:3.11-slim

# Set metadata
LABEL maintainer="Discord Bot CLI"
LABEL description="A Linux command-line utility that acts as a Discord bot interface for shell scripts"
LABEL version="1.0.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DISCORD_BOT_CONFIG=/etc/discord-bot/config.yaml

# Install system dependencies
RUN apt-get update && apt-get install -y \
    socat \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r discord-bot && useradd -r -g discord-bot discord-bot

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Install the application
RUN pip install --no-cache-dir -e .

# Create necessary directories
RUN mkdir -p /etc/discord-bot \
    && mkdir -p /var/log \
    && mkdir -p /app/scripts \
    && mkdir -p /tmp

# Create example configuration
RUN cat > /etc/discord-bot/config.yaml << 'EOF'
bot:
  token: "${DISCORD_BOT_TOKEN}"
  channel_id: null
  guild_id: null
  prefix: "!"
  auto_reconnect: true
  max_reconnect_attempts: 5
  reconnect_delay: 5.0

file:
  enabled: false
  input_file: null
  output_file: null
  watch_interval: 1.0
  file_encoding: "utf-8"

socket:
  enabled: false
  socket_path: "/tmp/discord-bot.sock"
  socket_mode: "0o600"
  max_connections: 10

service:
  enabled: false
  script_directory: "/app/scripts"
  allowed_commands: ["ls", "ps", "df", "free", "uptime", "whoami", "pwd"]
  max_execution_time: 30
  working_directory: "/app"

logging:
  level: "INFO"
  file: "/var/log/discord-bot.log"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  max_file_size: 10485760
  backup_count: 5
EOF

# Create example scripts
RUN cat > /app/scripts/hello.sh << 'EOF'
#!/bin/bash
echo "Hello from Docker Discord Bot CLI!"
echo "Author: $DISCORD_AUTHOR"
echo "Message: $DISCORD_MESSAGE_CONTENT"
echo "Args: $DISCORD_ARGS"
echo "Container: $(hostname)"
echo "Date: $(date)"
EOF

RUN cat > /app/scripts/sysinfo.sh << 'EOF'
#!/bin/bash
echo "=== Container System Information ==="
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo "Date: $(date)"
echo "Python: $(python --version)"
echo "OS: $(cat /etc/os-release | head -1)"
EOF

RUN cat > /app/scripts/status.sh << 'EOF'
#!/bin/bash
echo "Discord Bot CLI Status:"
echo "  Container: $(hostname)"
echo "  User: $(whoami)"
echo "  Uptime: $(uptime -p)"
echo "  Load: $(cat /proc/loadavg)"
echo "  Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "  Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
echo "  Python: $(python --version)"
EOF

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

# Set ownership
RUN chown -R discord-bot:discord-bot /app /etc/discord-bot /var/log

# Switch to non-root user
USER discord-bot

# Expose port for potential web interface (future feature)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health')" || exit 1

# Default command
CMD ["discord-bot", "--config", "/etc/discord-bot/config.yaml"]

# Alternative commands for different modes
# CMD ["discord-bot", "--stdin"]
# CMD ["discord-bot", "--service", "--script-dir", "/app/scripts"]
# CMD ["discord-bot", "--socket-path", "/tmp/discord.sock"]