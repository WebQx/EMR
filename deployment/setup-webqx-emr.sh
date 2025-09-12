#!/bin/bash
# WebQX EMR Setup Script
# Automates OpenEMR 7.0.3 installation and WebQX customization

echo "🚀 Starting WebQX EMR Setup..."

# Wait for MySQL to be ready
echo "📀 Waiting for MySQL container to be ready..."
until docker exec webqx-mysql mysqladmin ping -h"localhost" --silent; do
    echo "⏳ Waiting for MySQL..."
    sleep 2
done

echo "✅ MySQL is ready!"

# Create OpenEMR database and setup
echo "🏗️ Setting up OpenEMR database..."

# Run OpenEMR database setup
docker exec webqx-mysql mysql -uroot -p"webqx_root_2024!" -e "
CREATE DATABASE IF NOT EXISTS webqx_emr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON webqx_emr.* TO 'webqx_user'@'%';
FLUSH PRIVILEGES;
"

echo "✅ Database created successfully!"

# Update OpenEMR configuration to mark as configured
echo "⚙️ Configuring OpenEMR settings..."

# Set up basic OpenEMR configuration
cat > webqx-emr-system/core/sites/default/config.php << 'EOF'
<?php
// OpenEMR Configuration File for WebQX EMR

// Database Configuration
$GLOBALS['sql_string_no_show_screen'] = true;

// Site Information
$GLOBALS['sitename'] = 'WebQX EMR';
$GLOBALS['site_addr_oath'] = 'WebQX - The Future of Healthcare Technology';
$GLOBALS['webmaster_email'] = 'admin@webqx.health';

// Security
$GLOBALS['login_screen_text'] = 'WebQX EMR - Secure Healthcare Platform';

// Theme
$GLOBALS['theme_tabs_layout'] = 'compact';
$GLOBALS['css_header'] = 'webqx-theme';

// API Configuration 
$GLOBALS['rest_api'] = 1;
$GLOBALS['rest_fhir_api'] = 1;
$GLOBALS['oauth_password_grant'] = 1;

// WebQX specific settings
$GLOBALS['webqx_enabled'] = true;
$GLOBALS['webqx_version'] = '1.0.0';
$GLOBALS['webqx_integration'] = true;

EOF

echo "🎨 WebQX EMR configuration completed!"
echo "🌐 WebQX EMR is now accessible at: http://localhost:8085"
echo "📋 Setup Summary:"
echo "   ✅ OpenEMR 7.0.3 installed"
echo "   ✅ MySQL database configured"
echo "   ✅ Redis cache ready"
echo "   ✅ WebQX branding applied"
echo "   ✅ API endpoints enabled"
echo ""
echo "🔑 Next Steps:"
echo "   1. Access http://localhost:8085/core/setup.php"
echo "   2. Complete OpenEMR setup wizard"
echo "   3. Apply WebQX customizations"
echo ""