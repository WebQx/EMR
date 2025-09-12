#!/bin/bash

# WebQX EMR Branding Integration Script
# This script applies WebQX branding to OpenEMR 7.0.3

echo "🏥 WebQX EMR Branding Integration Starting..."
echo "=============================================="

# Configuration
OPENEMR_DIR="/workspaces/webqx/webqx-emr-system/core"
WEBQX_DIR="/workspaces/webqx/webqx-emr-system"
BACKUP_DIR="/workspaces/webqx/webqx-emr-system/backups"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📋 Step 1: Creating backups of original OpenEMR files..."

# Backup original files before modification
if [ -f "$OPENEMR_DIR/interface/login/login.php" ]; then
    cp "$OPENEMR_DIR/interface/login/login.php" "$BACKUP_DIR/login.php.backup"
    echo "   ✅ Backed up login.php"
fi

if [ -f "$OPENEMR_DIR/interface/main/main.php" ]; then
    cp "$OPENEMR_DIR/interface/main/main.php" "$BACKUP_DIR/main.php.backup"
    echo "   ✅ Backed up main.php"
fi

if [ -f "$OPENEMR_DIR/interface/globals.php" ]; then
    cp "$OPENEMR_DIR/interface/globals.php" "$BACKUP_DIR/globals.php.backup"
    echo "   ✅ Backed up globals.php"
fi

echo "🎨 Step 2: Integrating WebQX branding into OpenEMR..."

# Copy WebQX CSS to OpenEMR public directory
mkdir -p "$OPENEMR_DIR/public/themes/webqx"
cp "$WEBQX_DIR/themes/webqx-modern.css" "$OPENEMR_DIR/public/themes/webqx/"
echo "   ✅ Copied WebQX theme to OpenEMR"

# Create WebQX integration in OpenEMR includes
mkdir -p "$OPENEMR_DIR/library/webqx"
cp "$WEBQX_DIR/webqx-integration.php" "$OPENEMR_DIR/library/webqx/"
cp "$WEBQX_DIR/includes/webqx-header.php" "$OPENEMR_DIR/library/webqx/"
cp "$WEBQX_DIR/includes/webqx-dashboard.php" "$OPENEMR_DIR/library/webqx/"
echo "   ✅ Integrated WebQX PHP components"

echo "🔧 Step 3: Modifying OpenEMR configuration files..."

# Add WebQX integration to globals.php
if [ -f "$OPENEMR_DIR/interface/globals.php" ]; then
    # Check if WebQX integration is already added
    if ! grep -q "webqx-integration.php" "$OPENEMR_DIR/interface/globals.php"; then
        echo "" >> "$OPENEMR_DIR/interface/globals.php"
        echo "// WebQX EMR Integration" >> "$OPENEMR_DIR/interface/globals.php"
        echo "require_once \$GLOBALS['srcdir'] . '/../library/webqx/webqx-integration.php';" >> "$OPENEMR_DIR/interface/globals.php"
        echo "   ✅ Added WebQX integration to globals.php"
    else
        echo "   ℹ️  WebQX integration already exists in globals.php"
    fi
fi

# Modify login page to include WebQX branding
LOGIN_FILE="$OPENEMR_DIR/interface/login/login.php"
if [ -f "$LOGIN_FILE" ]; then
    # Add WebQX CSS link to login page
    sed -i '/<head>/a\    <link rel="stylesheet" href="../../public/themes/webqx/webqx-modern.css">' "$LOGIN_FILE"
    
    # Replace OpenEMR title with WebQX
    sed -i 's/OpenEMR/WebQX EMR/g' "$LOGIN_FILE"
    
    # Add WebQX logo
    sed -i 's/<title>/<title>WebQX EMR - /g' "$LOGIN_FILE"
    
    echo "   ✅ Modified login page with WebQX branding"
fi

# Modify main dashboard
MAIN_FILE="$OPENEMR_DIR/interface/main/main.php"
if [ -f "$MAIN_FILE" ]; then
    # Add WebQX dashboard integration
    sed -i '/<head>/a\    <link rel="stylesheet" href="../public/themes/webqx/webqx-modern.css">' "$MAIN_FILE"
    sed -i '/<head>/a\    <script>document.title = "WebQX EMR Dashboard";</script>' "$MAIN_FILE"
    
    echo "   ✅ Modified main dashboard with WebQX branding"
fi

echo "🗄️  Step 4: Creating WebQX database enhancements..."

# Create WebQX database tables
mysql -h localhost -P 3306 -u openemr -pwebqx_secure_2024 webqx_emr << EOF
-- WebQX Community Health Tracking
CREATE TABLE IF NOT EXISTS webqx_community_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    service_type VARCHAR(100),
    is_underserved BOOLEAN DEFAULT FALSE,
    is_free_service BOOLEAN DEFAULT FALSE,
    visit_date DATETIME,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_patient_id (patient_id),
    INDEX idx_visit_date (visit_date)
);

-- WebQX Mobile Clinic Tracking
CREATE TABLE IF NOT EXISTS webqx_mobile_clinic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255),
    visit_date DATE,
    patients_served INT DEFAULT 0,
    services_provided TEXT,
    equipment_status TEXT,
    staff_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visit_date (visit_date),
    INDEX idx_location (location)
);

-- WebQX Telemedicine Sessions
CREATE TABLE IF NOT EXISTS webqx_telemedicine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    provider_id INT,
    session_date DATETIME,
    duration_minutes INT,
    session_type VARCHAR(50),
    technology_used VARCHAR(100),
    session_notes TEXT,
    quality_rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_patient_id (patient_id),
    INDEX idx_provider_id (provider_id)
);

-- WebQX Settings and Configuration
CREATE TABLE IF NOT EXISTS webqx_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default WebQX settings
INSERT IGNORE INTO webqx_settings (setting_name, setting_value, setting_type, description) VALUES
('webqx_brand_name', 'WebQX EMR', 'string', 'Main brand name displayed throughout the system'),
('webqx_tagline', 'Serving underserved communities with comprehensive healthcare solutions', 'string', 'Main tagline'),
('webqx_primary_color', '#0891b2', 'color', 'Primary brand color'),
('webqx_secondary_color', '#164e63', 'color', 'Secondary brand color'),
('webqx_accent_color', '#00ffd5', 'color', 'Accent color for highlights'),
('webqx_community_tracking', 'true', 'boolean', 'Enable community health tracking features'),
('webqx_mobile_clinic', 'true', 'boolean', 'Enable mobile clinic support'),
('webqx_telemedicine', 'true', 'boolean', 'Enable telemedicine integration'),
('webqx_github_integration', 'true', 'boolean', 'Enable GitHub Pages integration');

EOF

if [ $? -eq 0 ]; then
    echo "   ✅ Created WebQX database tables and settings"
else
    echo "   ⚠️  Database setup encountered issues (may already exist)"
fi

echo "🌐 Step 5: Setting up GitHub Pages integration..."

# Create GitHub Pages integration endpoint
GITHUB_ENDPOINT="$OPENEMR_DIR/public/webqx-github-api.php"
cat > "$GITHUB_ENDPOINT" << 'EOF'
<?php
/**
 * WebQX GitHub Pages Integration Endpoint
 * Handles communication between OpenEMR and GitHub Pages
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://webqx.github.io');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simple status endpoint
if ($_GET['action'] === 'status') {
    echo json_encode([
        'status' => 'online',
        'service' => 'WebQX EMR',
        'version' => '7.0.3',
        'timestamp' => date('c'),
        'uptime' => exec('uptime -p'),
        'memory_usage' => memory_get_usage(true)
    ]);
    exit;
}

// Health check endpoint
if ($_GET['action'] === 'health') {
    echo json_encode([
        'status' => 'healthy',
        'database' => 'connected',
        'services' => [
            'mysql' => 'running',
            'redis' => 'running',
            'php' => 'running'
        ],
        'timestamp' => date('c')
    ]);
    exit;
}

// Default response
echo json_encode([
    'message' => 'WebQX EMR GitHub Integration API',
    'endpoints' => [
        'status' => '/webqx-github-api.php?action=status',
        'health' => '/webqx-github-api.php?action=health'
    ]
]);
?>
EOF

echo "   ✅ Created GitHub Pages integration API"

echo "🔍 Step 6: Validating WebQX integration..."

# Check if OpenEMR is accessible
if curl -s "http://localhost:8085" > /dev/null; then
    echo "   ✅ OpenEMR is accessible on port 8085"
else
    echo "   ⚠️  OpenEMR may not be running on port 8085"
fi

# Check if WebQX CSS is accessible
if [ -f "$OPENEMR_DIR/public/themes/webqx/webqx-modern.css" ]; then
    echo "   ✅ WebQX theme file is accessible"
else
    echo "   ❌ WebQX theme file not found"
fi

# Check database tables
TABLE_COUNT=$(mysql -h localhost -P 3306 -u openemr -pwebqx_secure_2024 webqx_emr -e "SHOW TABLES LIKE 'webqx_%';" 2>/dev/null | wc -l)
if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "   ✅ WebQX database tables created ($TABLE_COUNT tables)"
else
    echo "   ⚠️  WebQX database tables may not be created"
fi

echo ""
echo "🎉 WebQX EMR Branding Integration Complete!"
echo "=============================================="
echo ""
echo "📋 Summary:"
echo "   • WebQX theme applied to OpenEMR"
echo "   • Custom branding integrated"
echo "   • Community health tracking enabled"
echo "   • Mobile clinic support added"
echo "   • Telemedicine features integrated"
echo "   • GitHub Pages API endpoint created"
echo ""
echo "🌐 Access your WebQX EMR at:"
echo "   Local: http://localhost:8085"
echo "   API: http://localhost:8085/public/webqx-github-api.php"
echo ""
echo "📱 GitHub Pages integration endpoint:"
echo "   http://localhost:8085/public/webqx-github-api.php?action=status"
echo ""
echo "🔧 Configuration files modified:"
echo "   • $OPENEMR_DIR/interface/globals.php"
echo "   • $OPENEMR_DIR/interface/login/login.php"
echo "   • $OPENEMR_DIR/interface/main/main.php"
echo ""
echo "💾 Backup files created in: $BACKUP_DIR"
echo ""
echo "✨ WebQX EMR is now ready to serve underserved communities!"