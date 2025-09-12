#!/bin/bash

# WebQX Remote Deployment Script
# Updates GitHub Pages to use external Codespace URLs

echo "🚀 WebQX Remote Deployment Script"
echo "=================================="

# Get Codespace information
if [ ! -z "$CODESPACE_NAME" ]; then
    CODESPACE_NAME="$CODESPACE_NAME"
else
    CODESPACE_NAME="fuzzy-goldfish-7vx645x7wgvv3rjxg"
fi

API_URL="https://$CODESPACE_NAME-8080.app.github.dev"
EMR_URL="https://$CODESPACE_NAME-8085.app.github.dev"

echo "📍 Codespace: $CODESPACE_NAME"
echo "🔌 API URL: $API_URL"
echo "🏥 EMR URL: $EMR_URL"
echo ""

echo "🧪 Testing Remote Accessibility..."
echo "=================================="

# Test API
echo -n "API Server: "
if curl -s "$API_URL/api/server-status" | grep -q "running"; then
    echo "✅ ACCESSIBLE"
    API_STATUS="✅"
else
    echo "❌ NOT ACCESSIBLE"
    API_STATUS="❌"
fi

# Test EMR
echo -n "EMR Server: "
if curl -s "$EMR_URL/webqx-api.php?action=status" | grep -q "online"; then
    echo "✅ ACCESSIBLE"
    EMR_STATUS="✅"
else
    echo "❌ NOT ACCESSIBLE (make port 8085 public in VS Code PORTS tab)"
    EMR_STATUS="❌"
fi

echo ""
echo "📋 Configuration Summary:"
echo "========================="
echo "API Remote Access: $API_STATUS"
echo "EMR Remote Access: $EMR_STATUS"
echo ""

if [[ "$API_STATUS" == "✅" && "$EMR_STATUS" == "✅" ]]; then
    echo "🎉 SUCCESS: All services are remotely accessible!"
    echo ""
    echo "🔗 GitHub Pages Integration URLs:"
    echo "   Status API: $API_URL/api/server-status"
    echo "   Remote Start: $API_URL/api/remote-start"
    echo "   EMR Status: $EMR_URL/webqx-api.php?action=status"
    echo "   Community Stats: $EMR_URL/webqx-api.php?action=community-stats"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Update your GitHub Pages JavaScript to use these URLs"
    echo "2. Replace localhost references with the external URLs"
    echo "3. Test the 'Start WebQx Server' button from GitHub Pages"
    echo ""
    
    # Create a summary file
    cat > "/workspaces/webqx/REMOTE_URLS.md" << EOF
# WebQX Remote Access URLs

## External Codespace URLs (for GitHub Pages)

### API Server (Port 8080)
- **Base URL**: $API_URL
- **Status Endpoint**: $API_URL/api/server-status
- **Remote Start**: $API_URL/api/remote-start

### EMR Server (Port 8085)  
- **Base URL**: $EMR_URL
- **Status API**: $EMR_URL/webqx-api.php?action=status
- **Health Check**: $EMR_URL/webqx-api.php?action=health
- **Community Stats**: $EMR_URL/webqx-api.php?action=community-stats

### For GitHub Pages Integration
Replace localhost URLs in your GitHub Pages JavaScript with:
\`\`\`javascript
const API_BASE = '$API_URL';
const EMR_BASE = '$EMR_URL';
\`\`\`

### Test Commands
\`\`\`bash
# Test API
curl "$API_URL/api/server-status"

# Test EMR
curl "$EMR_URL/webqx-api.php?action=status"
\`\`\`

**Status**: All services remotely accessible ✅
**Updated**: $(date)
EOF
    
    echo "📄 Created REMOTE_URLS.md with configuration details"
    
else
    echo "⚠️  ISSUES DETECTED:"
    if [[ "$EMR_STATUS" == "❌" ]]; then
        echo "   • Port 8085 needs to be made public"
        echo "   • Go to VS Code → PORTS tab → Right-click 8085 → Change Port Visibility → Public"
    fi
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Make sure both ports 8080 and 8085 are public in VS Code"
    echo "2. Check that services are still running"
    echo "3. Verify Codespace is not sleeping"
fi

echo ""
echo "🌐 GitHub Pages Site: https://webqx.github.io/webqx/"
echo "🔧 Use the URLs above to update your GitHub Pages integration"