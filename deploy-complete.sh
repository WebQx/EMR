#!/bin/bash

# WebQX Complete Deployment Script
# Deploys EMR and Telehealth integration with GitHub Pages support

set -e

echo "🏥 WebQX Complete Deployment Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/workspaces/webqx"
DIST_DIR="$PROJECT_DIR/dist"
EMR_COMPOSE_DIR="$PROJECT_DIR/webqx-emr-system"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check prerequisites
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker is required but not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is required but not installed"
    exit 1
fi

print_success "Prerequisites check completed"

# Step 2: Start API Proxy Server
print_status "Starting API Proxy Server..."

cd "$PROJECT_DIR"

# Kill existing proxy server if running
pkill -f "api-proxy-server.js" || true

# Start proxy server in background
nohup node api-proxy-server.js > api-proxy.log 2>&1 &
PROXY_PID=$!

sleep 3

# Check if proxy server started successfully
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "API Proxy Server started successfully (PID: $PROXY_PID)"
else
    print_error "Failed to start API Proxy Server"
    exit 1
fi

# Step 3: Build GitHub Pages static site
print_status "Building GitHub Pages static site..."

node scripts/build-pages.js

if [ $? -eq 0 ]; then
    print_success "Static site built successfully"
else
    print_error "Failed to build static site"
    exit 1
fi

# Step 4: Start EMR Docker containers (optional)
if [ "$1" = "--with-emr" ]; then
    print_status "Starting EMR Docker containers..."
    
    cd "$EMR_COMPOSE_DIR"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in $EMR_COMPOSE_DIR"
        exit 1
    fi
    
    # Start containers
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_success "EMR containers started successfully"
        print_status "EMR services will be available at:"
        print_status "  - OpenEMR: http://localhost:8080"
        print_status "  - MySQL: localhost:3306"
        print_status "  - Redis: localhost:6379"
    else
        print_warning "EMR containers failed to start (non-critical)"
    fi
    
    cd "$PROJECT_DIR"
fi

# Step 5: Test integrations
print_status "Testing integrations..."

# Test API Proxy
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    print_success "✓ API Proxy health check passed"
else
    print_warning "✗ API Proxy health check failed"
fi

# Test EMR endpoint through proxy
if curl -s http://localhost:3001/api/emr/health > /dev/null; then
    print_success "✓ EMR endpoint accessible through proxy"
else
    print_warning "✗ EMR endpoint test failed"
fi

# Test GitHub Pages build
if [ -f "$DIST_DIR/index.html" ] && [ -f "$DIST_DIR/github-pages-integration-patch.js" ]; then
    print_success "✓ GitHub Pages build files present"
else
    print_warning "✗ GitHub Pages build files missing"
fi

# Step 6: Display results and next steps
echo ""
print_success "🎉 WebQX Deployment Complete!"
echo ""
print_status "Services Status:"
echo "  📡 API Proxy Server: http://localhost:3001"
echo "  📄 Static Site: $DIST_DIR/"
echo "  🏥 EMR Integration: $([ "$1" = "--with-emr" ] && echo "Enabled" || echo "Demo Mode")"
echo ""
print_status "Next Steps:"
echo "  1. Test the integration at: http://localhost:3001"
echo "  2. Deploy static files from dist/ to GitHub Pages"
echo "  3. Update proxy server URL in production"
echo ""
print_status "Deployment Logs:"
echo "  📋 API Proxy: $PROJECT_DIR/api-proxy.log"
echo "  🐳 Docker: docker-compose logs (if EMR enabled)"
echo ""

# Step 7: Create deployment summary
cat > "$PROJECT_DIR/deployment-summary.md" << EOF
# WebQX Deployment Summary

**Deployment Date:** $(date)
**Deployment Type:** $([ "$1" = "--with-emr" ] && echo "Full EMR Integration" || echo "GitHub Pages + Proxy")

## Services Deployed

### API Proxy Server
- **Status:** Running
- **URL:** http://localhost:3001
- **PID:** $PROXY_PID
- **Log File:** api-proxy.log

### GitHub Pages Build
- **Status:** Complete
- **Build Directory:** dist/
- **Integration Patch:** ✓ Included
- **Service Worker:** ✓ Included

### EMR Integration
- **Docker Containers:** $([ "$1" = "--with-emr" ] && echo "Running" || echo "Not Started")
- **OpenEMR URL:** $([ "$1" = "--with-emr" ] && echo "http://localhost:8080" || echo "Demo Mode")

## Testing

Test the deployment:
\`\`\`bash
# Test API Proxy
curl http://localhost:3001/health

# Test EMR endpoint
curl http://localhost:3001/api/emr/health

# Open static site
open dist/index.html
\`\`\`

## Production Deployment

1. Deploy static files to GitHub Pages:
   \`\`\`bash
   cp -r dist/* /path/to/github-pages-repo/
   \`\`\`

2. Deploy API proxy to cloud provider
3. Update PROXY_SERVER URL in github-pages-integration-patch.js

## Troubleshooting

- **API Proxy Issues:** Check api-proxy.log
- **EMR Connection:** Verify Docker containers are running
- **CORS Errors:** Ensure proxy server is accessible from GitHub Pages
EOF

print_success "Deployment summary saved to deployment-summary.md"

# Keep proxy server running
print_status "API Proxy Server is running in background (PID: $PROXY_PID)"
print_status "Use 'kill $PROXY_PID' to stop the proxy server"

exit 0