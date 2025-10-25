#!/bin/bash

# Discord Bot CLI Installation Script
# This script installs the Discord Bot CLI utility

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
INSTALL_DIR="/opt/discord-bot-cli"
CONFIG_DIR="/etc/discord-bot"
LOG_DIR="/var/log"
SERVICE_USER="discord-bot"
PYTHON_VERSION="3.8"
VENV_DIR="$INSTALL_DIR/venv"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        log_info "Please run as a regular user. The script will use sudo when needed."
        exit 1
    fi
}

check_python() {
    log_info "Checking Python installation..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        log_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    PYTHON_VERSION_CHECK=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    REQUIRED_VERSION="3.8"
    
    if ! $PYTHON_CMD -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
        log_error "Python $PYTHON_VERSION_CHECK is installed, but Python $REQUIRED_VERSION or higher is required."
        exit 1
    fi
    
    log_success "Python $PYTHON_VERSION_CHECK found"
}

check_dependencies() {
    log_info "Checking system dependencies..."
    
    # Check for required system packages
    local missing_packages=()
    
    if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
        missing_packages+=("python3-pip")
    fi
    
    if ! command -v socat &> /dev/null; then
        missing_packages+=("socat")
    fi
    
    if ! command -v systemctl &> /dev/null; then
        log_warning "systemd not found. Service installation will be skipped."
        SKIP_SERVICE=true
    fi
    
    if [ ${#missing_packages[@]} -ne 0 ]; then
        log_info "Installing missing packages: ${missing_packages[*]}"
        
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y "${missing_packages[@]}"
        elif command -v yum &> /dev/null; then
            sudo yum install -y "${missing_packages[@]}"
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y "${missing_packages[@]}"
        elif command -v pacman &> /dev/null; then
            sudo pacman -S --noconfirm "${missing_packages[@]}"
        else
            log_error "Package manager not found. Please install the following packages manually:"
            for pkg in "${missing_packages[@]}"; do
                echo "  - $pkg"
            done
            exit 1
        fi
    fi
    
    log_success "System dependencies satisfied"
}

create_user() {
    log_info "Creating service user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
        log_success "Created user: $SERVICE_USER"
    else
        log_info "User $SERVICE_USER already exists"
    fi
}

create_directories() {
    log_info "Creating directories..."
    
    sudo mkdir -p "$INSTALL_DIR"
    sudo mkdir -p "$CONFIG_DIR"
    sudo mkdir -p "$LOG_DIR"
    sudo mkdir -p "$INSTALL_DIR/scripts"
    
    log_success "Created directories"
}

install_application() {
    log_info "Installing application..."
    
    # Copy application files
    sudo cp -r . "$INSTALL_DIR/"
    
    # Create virtual environment
    log_info "Creating virtual environment..."
    sudo $PYTHON_CMD -m venv "$VENV_DIR"
    
    # Install Python dependencies
    log_info "Installing Python dependencies..."
    sudo "$VENV_DIR/bin/pip" install --upgrade pip
    sudo "$VENV_DIR/bin/pip" install -r "$INSTALL_DIR/requirements.txt"
    sudo "$VENV_DIR/bin/pip" install -e "$INSTALL_DIR/"
    
    # Set permissions
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    sudo chmod +x "$INSTALL_DIR/venv/bin/discord-bot"
    
    log_success "Application installed"
}

create_config() {
    log_info "Creating configuration file..."
    
    cat > /tmp/discord-bot.yaml << EOF
bot:
  token: "\${DISCORD_BOT_TOKEN}"
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
  script_directory: "$INSTALL_DIR/scripts"
  allowed_commands: ["ls", "ps", "df", "free", "uptime", "whoami", "pwd"]
  max_execution_time: 30
  working_directory: "$INSTALL_DIR"

logging:
  level: "INFO"
  file: "$LOG_DIR/discord-bot.log"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  max_file_size: 10485760
  backup_count: 5
EOF
    
    sudo mv /tmp/discord-bot.yaml "$CONFIG_DIR/config.yaml"
    sudo chown "$SERVICE_USER:$SERVICE_USER" "$CONFIG_DIR/config.yaml"
    sudo chmod 600 "$CONFIG_DIR/config.yaml"
    
    log_success "Configuration file created: $CONFIG_DIR/config.yaml"
}

create_systemd_service() {
    if [ "$SKIP_SERVICE" = true ]; then
        log_warning "Skipping systemd service creation"
        return
    fi
    
    log_info "Creating systemd service..."
    
    cat > /tmp/discord-bot.service << EOF
[Unit]
Description=Discord Bot CLI
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment=DISCORD_BOT_TOKEN=
Environment=DISCORD_CHANNEL_ID=
ExecStart=$VENV_DIR/bin/discord-bot --config $CONFIG_DIR/config.yaml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/discord-bot.service /etc/systemd/system/
    sudo systemctl daemon-reload
    
    log_success "Systemd service created"
}

create_example_scripts() {
    log_info "Creating example scripts..."
    
    # System info script
    cat > /tmp/sysinfo.sh << 'EOF'
#!/bin/bash
echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo "Date: $(date)"
EOF
    
    # Hello script
    cat > /tmp/hello.sh << 'EOF'
#!/bin/bash
echo "Hello $DISCORD_AUTHOR!"
echo "You sent: $DISCORD_MESSAGE_CONTENT"
echo "From channel: $DISCORD_CHANNEL_ID"
echo "Arguments: $DISCORD_ARGS"
EOF
    
    # Status script
    cat > /tmp/status.sh << 'EOF'
#!/bin/bash
echo "Bot Status:"
echo "  User: $(whoami)"
echo "  Hostname: $(hostname)"
echo "  Uptime: $(uptime -p)"
echo "  Load: $(cat /proc/loadavg)"
echo "  Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "  Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
EOF
    
    sudo mv /tmp/sysinfo.sh "$INSTALL_DIR/scripts/"
    sudo mv /tmp/hello.sh "$INSTALL_DIR/scripts/"
    sudo mv /tmp/status.sh "$INSTALL_DIR/scripts/"
    
    sudo chmod +x "$INSTALL_DIR/scripts"/*.sh
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/scripts"
    
    log_success "Example scripts created"
}

create_wrapper_script() {
    log_info "Creating wrapper script..."
    
    cat > /tmp/discord-bot << EOF
#!/bin/bash
# Discord Bot CLI Wrapper Script

# Set default configuration
export DISCORD_BOT_CONFIG="$CONFIG_DIR/config.yaml"

# Run the bot
exec "$VENV_DIR/bin/discord-bot" "\$@"
EOF
    
    sudo mv /tmp/discord-bot /usr/local/bin/
    sudo chmod +x /usr/local/bin/discord-bot
    sudo chown root:root /usr/local/bin/discord-bot
    
    log_success "Wrapper script created: /usr/local/bin/discord-bot"
}

show_usage_instructions() {
    log_success "Installation completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Configure your Discord bot token:"
    echo "   sudo nano $CONFIG_DIR/config.yaml"
    echo "   # Set your DISCORD_BOT_TOKEN"
    echo
    echo "2. Set environment variables:"
    echo "   export DISCORD_BOT_TOKEN='your_bot_token_here'"
    echo "   export DISCORD_CHANNEL_ID='your_channel_id_here'"
    echo
    echo "3. Start the service:"
    if [ "$SKIP_SERVICE" != true ]; then
        echo "   sudo systemctl start discord-bot"
        echo "   sudo systemctl enable discord-bot"
    else
        echo "   discord-bot --config $CONFIG_DIR/config.yaml"
    fi
    echo
    echo "4. Check status:"
    if [ "$SKIP_SERVICE" != true ]; then
        echo "   sudo systemctl status discord-bot"
    else
        echo "   ps aux | grep discord-bot"
    fi
    echo
    echo "5. View logs:"
    if [ "$SKIP_SERVICE" != true ]; then
        echo "   sudo journalctl -u discord-bot -f"
    else
        echo "   tail -f $LOG_DIR/discord-bot.log"
    fi
    echo
    echo "Configuration file: $CONFIG_DIR/config.yaml"
    echo "Scripts directory: $INSTALL_DIR/scripts"
    echo "Log file: $LOG_DIR/discord-bot.log"
    echo
    echo "For more information, see the documentation in $INSTALL_DIR/docs/"
}

# Main installation process
main() {
    log_info "Starting Discord Bot CLI installation..."
    
    check_root
    check_python
    check_dependencies
    create_user
    create_directories
    install_application
    create_config
    create_systemd_service
    create_example_scripts
    create_wrapper_script
    show_usage_instructions
}

# Run main function
main "$@"