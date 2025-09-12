# WebQX Remote Access URLs

## External Codespace URLs (for GitHub Pages)

### API Server (Port 8080)
- **Base URL**: https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev
- **Status Endpoint**: https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev/api/server-status
- **Remote Start**: https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev/api/remote-start

### EMR Server (Port 8085)  
- **Base URL**: https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev
- **Status API**: https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev/webqx-api.php?action=status
- **Health Check**: https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev/webqx-api.php?action=health
- **Community Stats**: https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev/webqx-api.php?action=community-stats

### For GitHub Pages Integration
Replace localhost URLs in your GitHub Pages JavaScript with:
```javascript
const API_BASE = 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev';
const EMR_BASE = 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev';
```

### Test Commands
```bash
# Test API
curl "https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev/api/server-status"

# Test EMR
curl "https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev/webqx-api.php?action=status"
```

**Status**: All services remotely accessible ✅
**Updated**: Fri Sep 12 18:42:00 UTC 2025
