# Discord Bot CLI Makefile

# Configuration
SERVICE_NAME = discord-bot
INSTALL_DIR = /opt/discord-bot
CONFIG_DIR = /etc/discord-bot
LOG_DIR = /var/log/discord-bot
SCRIPT_DIR = /opt/discord-bot/scripts
SOCKET_DIR = /var/run/discord-bot

# Colors
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m

.PHONY: help install uninstall start stop restart status logs test clean build

help: ## Show this help message
	@echo "Discord Bot CLI - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Install Discord Bot CLI as system service
	@echo "$(BLUE)🚀 Installing Discord Bot CLI...$(NC)"
	@sudo ./install.sh

uninstall: ## Uninstall Discord Bot CLI
	@echo "$(BLUE)🗑️  Uninstalling Discord Bot CLI...$(NC)"
	@sudo ./uninstall.sh

start: ## Start the Discord Bot service
	@echo "$(BLUE)▶️  Starting Discord Bot service...$(NC)"
	@sudo systemctl start $(SERVICE_NAME)
	@echo "$(GREEN)✅ Service started$(NC)"

stop: ## Stop the Discord Bot service
	@echo "$(BLUE)⏹️  Stopping Discord Bot service...$(NC)"
	@sudo systemctl stop $(SERVICE_NAME)
	@echo "$(GREEN)✅ Service stopped$(NC)"

restart: ## Restart the Discord Bot service
	@echo "$(BLUE)🔄 Restarting Discord Bot service...$(NC)"
	@sudo systemctl restart $(SERVICE_NAME)
	@echo "$(GREEN)✅ Service restarted$(NC)"

status: ## Show service status
	@echo "$(BLUE)📊 Service status:$(NC)"
	@sudo systemctl status $(SERVICE_NAME) --no-pager

logs: ## Show service logs
	@echo "$(BLUE)📋 Service logs:$(NC)"
	@sudo journalctl -u $(SERVICE_NAME) -f --no-pager

logs-file: ## Show log file
	@echo "$(BLUE)📋 Log file:$(NC)"
	@sudo tail -f $(LOG_DIR)/discord-bot.log

test: ## Run tests
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	@npm test

test-service: ## Test service mode
	@echo "$(BLUE)🧪 Testing service mode...$(NC)"
	@node test-service.js

test-file: ## Test file messaging
	@echo "$(BLUE)🧪 Testing file messaging...$(NC)"
	@node test-file.js

test-socket: ## Test socket communication
	@echo "$(BLUE)🧪 Testing socket communication...$(NC)"
	@node test-socket.js

test-stdin: ## Test stdin/stdout
	@echo "$(BLUE)🧪 Testing stdin/stdout...$(NC)"
	@node test-stdin.js

dev: ## Run in development mode
	@echo "$(BLUE)🔧 Running in development mode...$(NC)"
	@npm run dev

build: ## Build standalone executable
	@echo "$(BLUE)🔨 Building standalone executable...$(NC)"
	@npm run build

clean: ## Clean build artifacts
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(NC)"
	@rm -rf dist/
	@rm -rf node_modules/
	@rm -f package-lock.json

setup-dev: ## Setup development environment
	@echo "$(BLUE)🔧 Setting up development environment...$(NC)"
	@npm install
	@chmod +x scripts/*.sh
	@echo "$(GREEN)✅ Development environment ready$(NC)"

config: ## Edit configuration file
	@echo "$(BLUE)⚙️  Editing configuration...$(NC)"
	@sudo nano $(CONFIG_DIR)/config.yaml

env: ## Edit environment file
	@echo "$(BLUE)⚙️  Editing environment file...$(NC)"
	@sudo nano $(CONFIG_DIR)/.env

scripts: ## List available scripts
	@echo "$(BLUE)📜 Available scripts:$(NC)"
	@ls -la $(SCRIPT_DIR)/

socket-test: ## Test socket communication
	@echo "$(BLUE)🔌 Testing socket communication...$(NC)"
	@echo '{"command": "status"}' | socat - UNIX-CONNECT:$(SOCKET_DIR)/discord-bot.sock

socket-send: ## Send message via socket
	@echo "$(BLUE)📤 Sending message via socket...$(NC)"
	@echo '{"command": "send", "content": "Hello from socket!"}' | socat - UNIX-CONNECT:$(SOCKET_DIR)/discord-bot.sock

file-send: ## Send message via file
	@echo "$(BLUE)📤 Sending message via file...$(NC)"
	@echo "Hello from file!" | sudo tee $(CONFIG_DIR)/input_file > /dev/null

file-read: ## Read messages from file
	@echo "$(BLUE)📥 Reading messages from file...$(NC)"
	@sudo cat $(CONFIG_DIR)/output_file 2>/dev/null || echo "No messages"

update: ## Update Discord Bot CLI
	@echo "$(BLUE)🔄 Updating Discord Bot CLI...$(NC)"
	@git pull origin main
	@sudo make install
	@sudo make restart
	@echo "$(GREEN)✅ Update completed$(NC)"

backup: ## Backup configuration and logs
	@echo "$(BLUE)💾 Creating backup...$(NC)"
	@sudo tar -czf discord-bot-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz $(CONFIG_DIR) $(LOG_DIR) $(SCRIPT_DIR)
	@echo "$(GREEN)✅ Backup created$(NC)"

restore: ## Restore from backup
	@echo "$(BLUE)📥 Restoring from backup...$(NC)"
	@echo "Available backups:"
	@ls -la discord-bot-backup-*.tar.gz 2>/dev/null || echo "No backups found"
	@echo "Usage: make restore BACKUP_FILE=backup-file.tar.gz"

monitor: ## Monitor system resources
	@echo "$(BLUE)📊 System monitoring:$(NC)"
	@echo "CPU Usage:"
	@top -bn1 | grep "Cpu(s)" | awk '{print $$2}' | cut -d'%' -f1
	@echo "Memory Usage:"
	@free -h
	@echo "Disk Usage:"
	@df -h /
	@echo "Service Status:"
	@systemctl is-active $(SERVICE_NAME)

# Default target
.DEFAULT_GOAL := help