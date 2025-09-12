#!/bin/bash

# WebQX Remote Access Test Script
# This script helps test remote connectivity to your WebQX server

echo "🌐 WebQX Remote Access Test"
echo "=========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get server information
echo -e "${BLUE}Server Network Information:${NC}"
echo "Local IP addresses:"
ip addr show | grep -E "inet.*scope global" | awk '{print "  " $2}' | cut -d'/' -f1

echo ""
echo -e "${BLUE}Port Status Check:${NC}"
ports=(3000 3001 3002 3003)
for port in "${ports[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        echo -e "  Port $port: ${GREEN}LISTENING${NC}"
    else
        echo -e "  Port $port: ${RED}NOT LISTENING${NC}"
    fi
done

echo ""
echo -e "${BLUE}Firewall Status:${NC}"
if command -v ufw &> /dev/null; then
    ufw_status=$(sudo ufw status | head -n 1)
    echo "  UFW: $ufw_status"
    if [[ "$ufw_status" == *"active"* ]]; then
        echo "  Rules for WebQX ports:"
        sudo ufw status numbered | grep -E "(3000|3001|3002|3003|80|443)" || echo "    No specific rules found"
    fi
else
    echo "  UFW not installed"
fi

echo ""
echo -e "${BLUE}Testing Local Access:${NC}"
for port in "${ports[@]}"; do
    if curl -s --connect-timeout 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "  localhost:$port: ${GREEN}ACCESSIBLE${NC}"
    else
        echo -e "  localhost:$port: ${RED}NOT ACCESSIBLE${NC}"
    fi
done

echo ""
echo -e "${BLUE}Network Interface Access URLs:${NC}"
while IFS= read -r ip; do
    if [[ -n "$ip" && "$ip" != "127.0.0.1" ]]; then
        echo "  http://$ip:3000 (Primary WebQX Portal)"
        echo "  http://$ip:3000/patient-portal (Patient Portal)"
        echo "  http://$ip:3000/patient-portal/login (Patient Login)"
    fi
done < <(ip addr show | grep -E "inet.*scope global" | awk '{print $2}' | cut -d'/' -f1)

echo ""
echo -e "${YELLOW}Remote Access Instructions:${NC}"
echo "1. Make sure WebQX server is running:"
echo "   node start-webqx-server.js"
echo ""
echo "2. From another device on the same network, try:"
echo "   http://[SERVER-IP]:3000"
echo ""
echo "3. For external internet access, configure your router to:"
echo "   - Port forward port 3000 to this server"
echo "   - Or set up a VPN for secure access"
echo ""
echo "4. For production deployment, run:"
echo "   ./setup-production-server.sh"
echo ""
echo -e "${YELLOW}Security Notes:${NC}"
echo "- Always use HTTPS in production"
echo "- Configure proper firewall rules"
echo "- Use strong authentication"
echo "- Consider VPN for remote access"
echo ""
echo -e "${GREEN}🎉 Test complete! Check the results above.${NC}"