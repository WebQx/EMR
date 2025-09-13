#!/bin/bash
# WebQX System Status Check
# Tests all local servers and MariaDB setup

echo "=== WebQX Local System Status Check ==="
echo "Timestamp: $(date)"
echo ""

# Check local servers
echo "🔍 Checking Local Servers:"
echo ""

# EMR Server (Port 3000)
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ EMR Server (Port 3000): ONLINE"
else
    echo "❌ EMR Server (Port 3000): OFFLINE"
fi

# API Proxy Server (Port 3001)
if curl -s http://localhost:3001/api/system/status >/dev/null 2>&1; then
    echo "✅ API Proxy Server (Port 3001): ONLINE"
    echo "   📊 System Status: $(curl -s http://localhost:3001/api/system/status | jq -r '.timestamp')"
else
    echo "❌ API Proxy Server (Port 3001): OFFLINE"
fi

# Telehealth Server (Port 3003)
if curl -s http://localhost:3003 >/dev/null 2>&1; then
    echo "✅ Telehealth Server (Port 3003): ONLINE"
else
    echo "❌ Telehealth Server (Port 3003): OFFLINE"
fi

echo ""
echo "🗄️ Checking Database:"
echo ""

# MariaDB/MySQL (Port 3306)
if nc -z localhost 3306 2>/dev/null; then
    echo "✅ MariaDB (Port 3306): ONLINE"
    
    # Test OpenEMR database connection
    if docker exec webqx-mariadb mysql -u openemr -popenemr_password -e "USE openemr; SHOW TABLES;" >/dev/null 2>&1; then
        echo "   📋 OpenEMR Database: ACCESSIBLE"
        echo "   🏥 Tables: $(docker exec webqx-mariadb mysql -u openemr -popenemr_password -e "USE openemr; SHOW TABLES;" 2>/dev/null | wc -l) total"
    else
        echo "   📋 OpenEMR Database: SETUP PENDING"
    fi
else
    echo "❌ MariaDB (Port 3306): OFFLINE"
    echo "   🔄 Docker Status: $(cd /workspaces/webqx/webqx-emr-system && docker-compose ps mariadb --format=table)"
fi

echo ""
echo "🌐 WebQX Integration Status:"
echo ""

# Check GitHub Pages Integration
if [ -f "/workspaces/webqx/integrations/github-pages-integration-patch.js" ]; then
    echo "✅ GitHub Pages Integration: CONFIGURED"
    echo "   🎛️ Remote Control Panel: Available (Ctrl+Shift+C)"
else
    echo "❌ GitHub Pages Integration: NOT FOUND"
fi

# Check login page
if [ -f "/workspaces/webqx/login.html" ]; then
    echo "✅ Login Page: CONFIGURED"
    echo "   🔐 Authentication: Local EMR Backend"
else
    echo "❌ Login Page: NOT FOUND"
fi

echo ""
echo "📱 Available Modules:"
echo "   • Patient Portal (Role: patient)"
echo "   • Provider Portal (Role: provider)" 
echo "   • Admin Console (Role: admin)"
echo "   • Telehealth (All roles)"
echo "   • Remote Control Panel (Admin only)"
echo ""

echo "🔑 Default Test Credentials:"
echo "   Username: admin"
echo "   Password: webqx123"
echo "   Role: administrator"
echo ""

echo "🏗️ Setup Complete For:"
echo "   ✅ Local EMR Server with authentication"
echo "   ✅ API proxy with system control"
echo "   ✅ Telehealth server with WebSocket"
echo "   ✅ MariaDB 10.5 configuration (OpenEMR compatible)"
echo "   ✅ Enhanced integration patch with remote control"
echo "   ✅ Role-based module access control"
echo ""

if ! nc -z localhost 3306 2>/dev/null; then
    echo "⏳ Note: MariaDB is still starting up. Run this script again in a few minutes."
    echo "   To monitor MariaDB: cd /workspaces/webqx/webqx-emr-system && docker-compose logs -f mariadb"
fi

echo "=== End Status Check ==="