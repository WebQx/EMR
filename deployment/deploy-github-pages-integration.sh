#!/bin/bash

# WebQx GitHub Pages Integration Deployment Script
# This script deploys the enhanced remote triggering integration to GitHub Pages

set -e

echo "🚀 WebQx GitHub Pages Integration Deployment"
echo "=============================================="

# Configuration
REPO_URL="https://github.com/WebQx/webqx.git"
TEMP_DIR="/tmp/webqx-github-pages"
PATCH_FILE="/workspaces/webqx/github-pages-integration-patch.js"
SERVER_IP="192.168.173.251"

echo "📋 Configuration:"
echo "   Repository: $REPO_URL"
echo "   Server IP: $SERVER_IP"
echo "   Patch file: $PATCH_FILE"
echo ""

# Function to check if git is configured
check_git_config() {
    if ! git config --global user.name >/dev/null 2>&1; then
        echo "⚠️  Git user.name not configured. Please run:"
        echo "   git config --global user.name 'Your Name'"
        echo "   git config --global user.email 'your.email@example.com'"
        echo ""
        read -p "Configure git now? (y/n): " configure_git
        if [[ $configure_git == "y" ]]; then
            read -p "Enter your name: " git_name
            read -p "Enter your email: " git_email
            git config --global user.name "$git_name"
            git config --global user.email "$git_email"
            echo "✅ Git configured successfully"
        else
            echo "❌ Git configuration required for deployment"
            exit 1
        fi
    fi
}

# Function to backup current GitHub Pages
backup_github_pages() {
    echo "💾 Creating backup of current GitHub Pages..."
    
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    
    git clone "$REPO_URL" "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Create backup branch
    BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
    git checkout -b "$BACKUP_BRANCH"
    git push origin "$BACKUP_BRANCH"
    
    echo "✅ Backup created on branch: $BACKUP_BRANCH"
    echo ""
}

# Function to modify the main index.html
modify_index_html() {
    echo "✏️  Modifying index.html to use enhanced integration..."
    
    cd "$TEMP_DIR"
    
    # Check if index.html exists
    if [ ! -f "index.html" ]; then
        echo "❌ index.html not found in repository"
        exit 1
    fi
    
    # Create backup of original
    cp index.html index.html.backup
    
    # Add our integration script before the closing </body> tag
    sed -i '/<\/body>/i\    <!-- Enhanced WebQx Remote Triggering Integration -->\
    <script src="github-pages-integration-patch.js"><\/script>' index.html
    
    echo "✅ index.html modified successfully"
}

# Function to deploy the patch file
deploy_patch_file() {
    echo "📦 Deploying integration patch file..."
    
    cd "$TEMP_DIR"
    
    # Copy our enhanced integration patch
    cp "$PATCH_FILE" .
    
    # Update server IP in the patch file if needed
    sed -i "s/192\.168\.173\.251/$SERVER_IP/g" github-pages-integration-patch.js
    
    echo "✅ Integration patch deployed"
}

# Function to test the integration locally
test_integration() {
    echo "🧪 Testing integration locally..."
    
    cd "$TEMP_DIR"
    
    # Start a simple HTTP server for testing
    echo "   Starting local server on port 8000..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    
    sleep 2
    
    echo "   ✅ Local test server started (PID: $SERVER_PID)"
    echo "   🌐 Test URL: http://localhost:8000"
    echo "   📝 Test the integration manually in your browser"
    echo ""
    
    read -p "Press Enter after testing to continue with deployment..."
    
    # Stop the test server
    kill $SERVER_PID 2>/dev/null || true
    echo "   🛑 Test server stopped"
}

# Function to commit and push changes
deploy_to_github() {
    echo "🚀 Deploying to GitHub Pages..."
    
    cd "$TEMP_DIR"
    
    # Switch to gh-pages branch (or main if that's what's used)
    if git branch -r | grep -q "origin/gh-pages"; then
        git checkout gh-pages
        echo "   📝 Using gh-pages branch"
    else
        git checkout main
        echo "   📝 Using main branch"
    fi
    
    # Add changes
    git add .
    git status
    
    echo ""
    echo "📋 Changes to be committed:"
    git diff --cached --name-only
    echo ""
    
    read -p "Proceed with deployment? (y/n): " proceed
    if [[ $proceed != "y" ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
    
    # Commit and push
    git commit -m "🔗 Enhanced WebQx remote server integration
    
- Added dedicated server remote triggering support
- Enhanced status checking with multiple endpoints
- Improved error handling and fallback methods
- Added detailed health monitoring
- Updated for server IP: $SERVER_IP
    
Deployed on $(date)"
    
    git push origin HEAD
    
    echo "✅ Successfully deployed to GitHub Pages!"
    echo ""
}

# Function to verify deployment
verify_deployment() {
    echo "✅ Verifying deployment..."
    
    # Wait a moment for GitHub Pages to update
    echo "   ⏳ Waiting for GitHub Pages to update (30 seconds)..."
    sleep 30
    
    # Test the GitHub Pages URL
    echo "   🌐 Testing GitHub Pages URL..."
    if curl -s "https://webqx.github.io/webqx/" | grep -q "github-pages-integration-patch.js"; then
        echo "   ✅ Integration patch detected on GitHub Pages"
    else
        echo "   ⚠️  Integration patch not yet visible (may need more time)"
    fi
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "=============================="
    echo "   🌐 GitHub Pages: https://webqx.github.io/webqx/"
    echo "   🔗 Remote Server: http://$SERVER_IP:3000"
    echo "   📊 Status API: http://$SERVER_IP:3000/api/server-status"
    echo "   🚀 Remote Start: http://$SERVER_IP:8080/api/remote-start"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Visit GitHub Pages and test the 'Start WebQx Server' button"
    echo "   2. Verify server status checking works"
    echo "   3. Test remote server starting functionality"
    echo "   4. Monitor server logs for remote triggering"
    echo ""
}

# Function to show manual integration option
show_manual_option() {
    echo "📖 Manual Integration Option"
    echo "============================"
    echo ""
    echo "If you prefer to manually integrate, follow these steps:"
    echo ""
    echo "1. Copy the integration patch to your GitHub Pages repository:"
    echo "   cp $PATCH_FILE /path/to/your/github/pages/repo/"
    echo ""
    echo "2. Add this line before </body> in your index.html:"
    echo "   <script src=\"github-pages-integration-patch.js\"></script>"
    echo ""
    echo "3. Update the server IP in the patch file if needed:"
    echo "   sed -i 's/192.168.173.251/YOUR_SERVER_IP/g' github-pages-integration-patch.js"
    echo ""
    echo "4. Commit and push to your GitHub Pages repository"
    echo ""
}

# Main execution
main() {
    echo "🎯 Choose deployment method:"
    echo "   1) Automatic deployment (recommended)"
    echo "   2) Manual integration instructions"
    echo "   3) Test integration locally only"
    echo ""
    
    read -p "Enter your choice (1-3): " choice
    echo ""
    
    case $choice in
        1)
            echo "🤖 Starting automatic deployment..."
            check_git_config
            backup_github_pages
            modify_index_html
            deploy_patch_file
            test_integration
            deploy_to_github
            verify_deployment
            ;;
        2)
            show_manual_option
            ;;
        3)
            echo "🧪 Starting local testing only..."
            backup_github_pages
            modify_index_html
            deploy_patch_file
            test_integration
            echo "✅ Local testing complete"
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
}

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up temporary files..."
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    
    # Kill any remaining test servers
    pkill -f "python3 -m http.server" 2>/dev/null || true
    
    echo "✅ Cleanup complete"
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main