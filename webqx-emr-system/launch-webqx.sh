#!/bin/bash
# WebQX™ EMR System - Quick Launch Script
# Automated setup and deployment for Windows/Linux/macOS

echo "🚀 WebQX™ EMR System - Quick Launch"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   After installing Docker Desktop:"
    echo "   1. Launch Docker Desktop"
    echo "   2. Wait for Docker to start completely"
    echo "   3. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if Docker Compose is available
if ! docker compose version > /dev/null 2>&1; then
    if ! docker-compose --version > /dev/null 2>&1; then
        echo "❌ Docker Compose not found"
        exit 1
    else
        COMPOSE_CMD="docker-compose"
    fi
else
    COMPOSE_CMD="docker compose"
fi

echo "✅ Docker Compose available: $COMPOSE_CMD"
echo ""

# Navigate to WebQX EMR directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"
echo ""

# Pull required images
echo "📥 Pulling Docker images..."
$COMPOSE_CMD pull

echo ""
echo "🏗️  Building WebQX EMR container..."
$COMPOSE_CMD build

echo ""
echo "🚀 Starting WebQX EMR System..."

# Start with development profile by default
$COMPOSE_CMD --profile development up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo ""
echo "📊 Service Status:"
$COMPOSE_CMD ps

echo ""
echo "🎉 WebQX™ EMR System is ready!"
echo ""
echo "🌐 Access Points:"
echo "   📱 WebQX EMR:        http://localhost:8080"
echo "   🗄️  phpMyAdmin:       http://localhost:8081"
echo "   🔴 Redis Commander:   http://localhost:8082"
echo "   📧 Email Testing:     http://localhost:8025"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:    $COMPOSE_CMD logs -f"
echo "   Stop system:  $COMPOSE_CMD down"
echo "   Restart:      $COMPOSE_CMD restart"
echo ""
echo "📚 Documentation: ./DOCKER_README.md"
echo ""

# Health check
echo "🏥 Performing health check..."
sleep 10

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ WebQX EMR is responding!"
else
    echo "⚠️  WebQX EMR might still be starting up..."
    echo "   Check logs: $COMPOSE_CMD logs webqx-emr"
fi

echo ""
echo "🎊 Your custom WebQX™ EMR system is now running!"
echo "   Built on OpenEMR 7.0.3 with WebQX enhancements"
echo ""
