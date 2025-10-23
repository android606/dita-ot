# Discord Bot CLI Makefile

.PHONY: help install uninstall test clean build package install-dev

# Default target
help:
	@echo "Discord Bot CLI - Available targets:"
	@echo "  install      - Install the application system-wide"
	@echo "  uninstall    - Remove the application from system"
	@echo "  install-dev  - Install for development (editable install)"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean build artifacts"
	@echo "  build        - Build the package"
	@echo "  package      - Create distribution package"
	@echo "  lint         - Run code linting"
	@echo "  format       - Format code"
	@echo "  docs         - Generate documentation"

# Installation targets
install:
	@echo "Installing Discord Bot CLI system-wide..."
	sudo ./install.sh

uninstall:
	@echo "Uninstalling Discord Bot CLI..."
	./uninstall.sh

install-dev:
	@echo "Installing Discord Bot CLI for development..."
	pip install -e .

# Testing targets
test:
	@echo "Running tests..."
	python -m pytest tests/ -v

test-coverage:
	@echo "Running tests with coverage..."
	python -m pytest tests/ -v --cov=discord_bot_cli --cov-report=html

# Build targets
build:
	@echo "Building package..."
	python -m build

package: clean build
	@echo "Package created in dist/"

# Code quality targets
lint:
	@echo "Running linters..."
	flake8 discord_bot_cli/
	pylint discord_bot_cli/
	mypy discord_bot_cli/

format:
	@echo "Formatting code..."
	black discord_bot_cli/
	isort discord_bot_cli/

# Documentation targets
docs:
	@echo "Generating documentation..."
	@echo "Documentation is available in docs/ directory"

# Cleanup targets
clean:
	@echo "Cleaning build artifacts..."
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Development setup
dev-setup: install-dev
	@echo "Setting up development environment..."
	pip install -r requirements-dev.txt
	pre-commit install

# Docker targets
docker-build:
	@echo "Building Docker image..."
	docker build -t discord-bot-cli .

docker-run:
	@echo "Running Docker container..."
	docker run -it --rm \
		-e DISCORD_BOT_TOKEN="$(DISCORD_BOT_TOKEN)" \
		-e DISCORD_CHANNEL_ID="$(DISCORD_CHANNEL_ID)" \
		discord-bot-cli

# Service management (requires systemd)
service-start:
	@echo "Starting Discord Bot service..."
	sudo systemctl start discord-bot

service-stop:
	@echo "Stopping Discord Bot service..."
	sudo systemctl stop discord-bot

service-restart:
	@echo "Restarting Discord Bot service..."
	sudo systemctl restart discord-bot

service-status:
	@echo "Discord Bot service status:"
	sudo systemctl status discord-bot

service-logs:
	@echo "Discord Bot service logs:"
	sudo journalctl -u discord-bot -f

# Configuration management
config-edit:
	@echo "Editing configuration..."
	sudo nano /etc/discord-bot/config.yaml

config-show:
	@echo "Current configuration:"
	sudo cat /etc/discord-bot/config.yaml

# Quick start
quick-start:
	@echo "Quick start guide:"
	@echo "1. Set your Discord bot token:"
	@echo "   export DISCORD_BOT_TOKEN='your_token_here'"
	@echo "2. Set your channel ID:"
	@echo "   export DISCORD_CHANNEL_ID='your_channel_id_here'"
	@echo "3. Run the bot:"
	@echo "   make run"

run:
	@echo "Running Discord Bot CLI..."
	python -m discord_bot_cli.main

run-stdin:
	@echo "Running Discord Bot CLI with stdin/stdout..."
	python -m discord_bot_cli.main --stdin

run-service:
	@echo "Running Discord Bot CLI in service mode..."
	python -m discord_bot_cli.main --service --script-dir ./scripts

run-socket:
	@echo "Running Discord Bot CLI with socket..."
	python -m discord_bot_cli.main --socket-path /tmp/discord.sock

# Debug targets
debug:
	@echo "Running Discord Bot CLI in debug mode..."
	python -m discord_bot_cli.main --log-level DEBUG

debug-service:
	@echo "Running Discord Bot CLI in debug service mode..."
	python -m discord_bot_cli.main --service --script-dir ./scripts --log-level DEBUG

# Example scripts
create-example-scripts:
	@echo "Creating example scripts..."
	mkdir -p scripts
	@echo '#!/bin/bash' > scripts/hello.sh
	@echo 'echo "Hello from Discord Bot CLI!"' >> scripts/hello.sh
	@echo 'echo "Author: $$DISCORD_AUTHOR"' >> scripts/hello.sh
	@echo 'echo "Message: $$DISCORD_MESSAGE_CONTENT"' >> scripts/hello.sh
	@echo 'echo "Args: $$DISCORD_ARGS"' >> scripts/hello.sh
	chmod +x scripts/hello.sh
	@echo "Example script created: scripts/hello.sh"

# System information
info:
	@echo "Discord Bot CLI Information:"
	@echo "  Python version: $(shell python --version)"
	@echo "  Installation directory: /opt/discord-bot-cli"
	@echo "  Configuration directory: /etc/discord-bot"
	@echo "  Log directory: /var/log"
	@echo "  Service name: discord-bot"
	@echo "  Service user: discord-bot"