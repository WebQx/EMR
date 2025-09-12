#!/bin/bash

# WebQX Production Server Setup Script
# This script configures the system for production deployment

set -e

echo "🏥 WebQX Production Server Setup"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root for security reasons${NC}"
   exit 1
fi

echo -e "${BLUE}1. Installing system dependencies...${NC}"

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    sudo apt install -y nginx
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install other dependencies
sudo apt install -y ufw certbot python3-certbot-nginx

echo -e "${BLUE}2. Configuring firewall...${NC}"

# Configure UFW firewall
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow WebQX application ports (internal access only)
sudo ufw allow from any to any port 3000
sudo ufw allow from any to any port 3001
sudo ufw allow from any to any port 3002
sudo ufw allow from any to any port 3003

# Enable firewall
sudo ufw --force enable

echo -e "${BLUE}3. Creating WebQX user and directories...${NC}"

# Create webqx user if it doesn't exist
if ! id "webqx" &>/dev/null; then
    sudo useradd -m -s /bin/bash webqx
    sudo usermod -aG sudo webqx
fi

# Create necessary directories
sudo mkdir -p /var/log/webqx
sudo mkdir -p /var/lib/webqx/uploads
sudo mkdir -p /etc/webqx

# Set permissions
sudo chown -R webqx:webqx /var/log/webqx
sudo chown -R webqx:webqx /var/lib/webqx
sudo chown -R webqx:webqx /etc/webqx

echo -e "${BLUE}4. Installing Node.js dependencies...${NC}"

# Install WebQX dependencies
npm install --production

echo -e "${BLUE}5. Setting up SSL certificate (optional)...${NC}"

read -p "Do you want to set up SSL with Let's Encrypt? (y/N): " setup_ssl
if [[ $setup_ssl =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name: " domain_name
    if [[ -n "$domain_name" ]]; then
        echo "Setting up SSL for $domain_name..."
        sudo certbot --nginx -d $domain_name --non-interactive --agree-tos --email admin@$domain_name
        
        # Update .env.production with SSL settings
        sed -i 's/SSL_ENABLED=false/SSL_ENABLED=true/' .env.production
        sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=/etc/letsencrypt/live/$domain_name/fullchain.pem|" .env.production
        sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=/etc/letsencrypt/live/$domain_name/privkey.pem|" .env.production
    fi
fi

echo -e "${BLUE}6. Creating systemd service...${NC}"

# Copy current directory path
WEBQX_PATH=$(pwd)

# Create systemd service file
sudo tee /etc/systemd/system/webqx.service > /dev/null <<EOF
[Unit]
Description=WebQX Healthcare Platform
After=network.target

[Service]
Type=simple
User=webqx
WorkingDirectory=$WEBQX_PATH
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/bin/node start-webqx-server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=webqx

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable webqx

echo -e "${BLUE}7. Getting server information...${NC}"

# Get server IP addresses
LOCAL_IP=$(hostname -I | awk '{print $1}')
PUBLIC_IP=$(curl -s ifconfig.me || echo "Unable to determine public IP")

echo -e "${GREEN}✅ WebQX Production Server Setup Complete!${NC}"
echo "=========================================="
echo -e "${YELLOW}Server Information:${NC}"
echo "Local IP: $LOCAL_IP"
echo "Public IP: $PUBLIC_IP"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo "Local: http://$LOCAL_IP:3000"
if [[ -n "$domain_name" ]]; then
    if [[ $setup_ssl =~ ^[Yy]$ ]]; then
        echo "Domain: https://$domain_name"
    else
        echo "Domain: http://$domain_name:3000"
    fi
fi
echo ""
echo -e "${YELLOW}Management Commands:${NC}"
echo "Start service: sudo systemctl start webqx"
echo "Stop service: sudo systemctl stop webqx"
echo "Restart service: sudo systemctl restart webqx"
echo "Check status: sudo systemctl status webqx"
echo "View logs: sudo journalctl -u webqx -f"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update .env.production with your specific configuration"
echo "2. Start the service: sudo systemctl start webqx"
echo "3. Test access from remote devices"
echo "4. Configure your router/firewall for external access if needed"
echo ""
echo -e "${GREEN}🎉 Your WebQX server is ready for production use!${NC}"