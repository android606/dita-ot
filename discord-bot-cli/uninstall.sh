#!/bin/bash

# Discord Bot CLI Uninstallation Script
# This script removes the Discord Bot CLI utility

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
SERVICE_NAME="discord-bot"

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

confirm_uninstall() {
    echo
    log_warning "This will completely remove Discord Bot CLI and all its data."
    echo "The following will be removed:"
    echo "  - Installation directory: $INSTALL_DIR"
    echo "  - Configuration directory: $CONFIG_DIR"
    echo "  - Log files: $LOG_DIR/discord-bot.log*"
    echo "  - Systemd service: $SERVICE_NAME"
    echo "  - Service user: $SERVICE_USER"
    echo "  - Wrapper script: /usr/local/bin/discord-bot"
    echo
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Uninstallation cancelled"
        exit 0
    fi
}

stop_service() {
    log_info "Stopping Discord Bot service..."
    
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        sudo systemctl stop "$SERVICE_NAME"
        log_success "Service stopped"
    else
        log_info "Service is not running"
    fi
}

disable_service() {
    log_info "Disabling Discord Bot service..."
    
    if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        sudo systemctl disable "$SERVICE_NAME"
        log_success "Service disabled"
    else
        log_info "Service is not enabled"
    fi
}

remove_systemd_service() {
    log_info "Removing systemd service..."
    
    if [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
        sudo rm -f "/etc/systemd/system/$SERVICE_NAME.service"
        sudo systemctl daemon-reload
        log_success "Systemd service removed"
    else
        log_info "Systemd service file not found"
    fi
}

remove_application() {
    log_info "Removing application files..."
    
    if [ -d "$INSTALL_DIR" ]; then
        sudo rm -rf "$INSTALL_DIR"
        log_success "Application directory removed: $INSTALL_DIR"
    else
        log_info "Application directory not found: $INSTALL_DIR"
    fi
}

remove_config() {
    log_info "Removing configuration files..."
    
    if [ -d "$CONFIG_DIR" ]; then
        sudo rm -rf "$CONFIG_DIR"
        log_success "Configuration directory removed: $CONFIG_DIR"
    else
        log_info "Configuration directory not found: $CONFIG_DIR"
    fi
}

remove_logs() {
    log_info "Removing log files..."
    
    if [ -f "$LOG_DIR/discord-bot.log" ]; then
        sudo rm -f "$LOG_DIR/discord-bot.log"*
        log_success "Log files removed"
    else
        log_info "Log files not found"
    fi
}

remove_wrapper_script() {
    log_info "Removing wrapper script..."
    
    if [ -f "/usr/local/bin/discord-bot" ]; then
        sudo rm -f "/usr/local/bin/discord-bot"
        log_success "Wrapper script removed"
    else
        log_info "Wrapper script not found"
    fi
}

remove_user() {
    log_info "Removing service user..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        sudo userdel "$SERVICE_USER"
        log_success "User removed: $SERVICE_USER"
    else
        log_info "User not found: $SERVICE_USER"
    fi
}

cleanup_socket_files() {
    log_info "Cleaning up socket files..."
    
    # Remove common socket file locations
    local socket_files=(
        "/tmp/discord-bot.sock"
        "/var/run/discord-bot.sock"
        "/tmp/discord.sock"
    )
    
    for socket_file in "${socket_files[@]}"; do
        if [ -S "$socket_file" ]; then
            sudo rm -f "$socket_file"
            log_info "Removed socket file: $socket_file"
        fi
    done
}

cleanup_temp_files() {
    log_info "Cleaning up temporary files..."
    
    # Remove common temp file locations
    local temp_files=(
        "/tmp/discord_input"
        "/tmp/discord_output"
        "/tmp/discord_dev_input"
        "/tmp/discord_dev_output"
    )
    
    for temp_file in "${temp_files[@]}"; do
        if [ -f "$temp_file" ]; then
            rm -f "$temp_file"
            log_info "Removed temp file: $temp_file"
        fi
    done
}

check_running_processes() {
    log_info "Checking for running processes..."
    
    local pids=$(pgrep -f "discord-bot" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        log_warning "Found running Discord Bot processes:"
        ps aux | grep -E "(discord-bot|discord_bot)" | grep -v grep || true
        echo
        read -p "Do you want to kill these processes? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$pids" | xargs sudo kill -TERM 2>/dev/null || true
            sleep 2
            # Force kill if still running
            echo "$pids" | xargs sudo kill -KILL 2>/dev/null || true
            log_success "Processes terminated"
        else
            log_warning "Processes left running. You may need to stop them manually."
        fi
    else
        log_info "No running Discord Bot processes found"
    fi
}

show_cleanup_instructions() {
    log_success "Uninstallation completed!"
    echo
    echo "Manual cleanup (if needed):"
    echo "1. Remove any remaining configuration files:"
    echo "   rm -rf ~/.config/discord-bot"
    echo
    echo "2. Remove any remaining log files:"
    echo "   rm -f /var/log/discord-bot.log*"
    echo
    echo "3. Remove any remaining socket files:"
    echo "   rm -f /tmp/discord*.sock"
    echo
    echo "4. Remove any remaining temp files:"
    echo "   rm -f /tmp/discord_*"
    echo
    echo "5. If you installed Python packages globally, you may want to remove them:"
    echo "   pip uninstall discord-bot-cli"
    echo
    echo "6. Remove any cron jobs or other automation that referenced the bot"
    echo
    echo "The Discord Bot CLI has been completely removed from your system."
}

# Main uninstallation process
main() {
    log_info "Starting Discord Bot CLI uninstallation..."
    
    confirm_uninstall
    check_running_processes
    stop_service
    disable_service
    remove_systemd_service
    remove_application
    remove_config
    remove_logs
    remove_wrapper_script
    remove_user
    cleanup_socket_files
    cleanup_temp_files
    show_cleanup_instructions
}

# Run main function
main "$@"