#!/bin/bash
# WebQX Complete System Startup Script
# Starts all services for offline operation

echo "🚀 Starting WebQX Complete System..."
echo "===================================="

# Change to WebQX directory
cd /workspaces/webqx

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Start MariaDB if not running
echo "📊 Starting MariaDB 10.5 (OpenEMR)..."
cd /workspaces/webqx/webqx-emr-system
if ! docker ps | grep -q webqx-mariadb; then
    docker-compose up -d mariadb
    echo "   ⏳ MariaDB starting... (this may take a minute)"
else
    echo "   ✅ MariaDB already running"
fi

cd /workspaces/webqx

# Start Local EMR Server
echo "🏥 Starting Local EMR Server..."
if check_port 3000; then
    echo "   ✅ EMR Server already running on port 3000"
else
    echo "   🔄 Starting EMR Server on port 3000..."
    nohup node core/local-emr-server.js > emr-server.log 2>&1 &
    sleep 2
    if check_port 3000; then
        echo "   ✅ EMR Server started successfully"
    else
        echo "   ❌ Failed to start EMR Server"
    fi
fi

# Start API Proxy Server
echo "🔗 Starting API Proxy Server..."
if check_port 3001; then
    echo "   ✅ API Proxy already running on port 3001"
else
    echo "   🔄 Starting API Proxy on port 3001..."
    nohup node api-proxy-server.js > api-proxy.log 2>&1 &
    sleep 2
    if check_port 3001; then
        echo "   ✅ API Proxy started successfully"
    else
        echo "   ❌ Failed to start API Proxy"
    fi
fi

# Start Telehealth Server
echo "📹 Starting Telehealth Server..."
if check_port 3003; then
    echo "   ✅ Telehealth Server already running on port 3003"
else
    echo "   🔄 Starting Telehealth Server on port 3003..."
    nohup node core/telehealth-server.js > telehealth-server.log 2>&1 &
    sleep 2
    if check_port 3003; then
        echo "   ✅ Telehealth Server started successfully"
    else
        echo "   ❌ Failed to start Telehealth Server"
    fi
fi

echo ""
echo "🌐 WebQX System Status:"
echo "======================="

# Wait a moment for servers to fully initialize
sleep 3

# Run status check
if [ -f "/workspaces/webqx/test-webqx-system.sh" ]; then
    /workspaces/webqx/test-webqx-system.sh
else
    echo "Status check script not found. Running basic checks..."
    
    echo "Local Servers:"
    check_port 3000 && echo "✅ EMR Server (3000)" || echo "❌ EMR Server (3000)"
    check_port 3001 && echo "✅ API Proxy (3001)" || echo "❌ API Proxy (3001)"
    check_port 3003 && echo "✅ Telehealth (3003)" || echo "❌ Telehealth (3003)"
    
    echo ""
    echo "Database:"
    nc -z localhost 3306 2>/dev/null && echo "✅ MariaDB (3306)" || echo "❌ MariaDB (3306)"
fi

echo ""
echo "🎯 Quick Access URLs:"
echo "===================="
echo "🏠 Home Page: http://localhost:3000"
echo "🔐 Login Page: file:///workspaces/webqx/login.html"
echo "👤 Patient Portal: http://localhost:3000/patient"
echo "👨‍⚕️ Provider Portal: http://localhost:3000/provider"  
echo "🛠️ Admin Console: http://localhost:3000/admin"
echo "📹 Telehealth: http://localhost:3003"
echo "🔧 API Status: http://localhost:3001/api/system/status"
echo ""

echo "🎛️ Remote Control Panel:"
echo "========================"
echo "Open any WebQX page and press Ctrl+Shift+C for remote control"
echo ""

echo "🔑 Default Login Credentials:"
echo "============================"
echo "Username: admin"
echo "Password: webqx123"
echo "Role: administrator"
echo ""

echo "📁 Log Files:"
echo "============="
echo "EMR Server: /workspaces/webqx/emr-server.log"
echo "API Proxy: /workspaces/webqx/api-proxy.log"
echo "Telehealth: /workspaces/webqx/telehealth-server.log"
echo "MariaDB: docker-compose logs mariadb"
echo ""

echo "✅ WebQX System Startup Complete!"
echo "🌐 All services are configured for offline operation"
echo "📱 All placement cards and modules integrate with local backend"
echo "🔒 Remote login functionality enabled through local servers"