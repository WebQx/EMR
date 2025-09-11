<?php
/**
 * WebQX™ EMR System - Main Entry Point
 * Custom Electronic Medical Records platform built on OpenEMR
 */

// Include WebQX customizations first
require_once __DIR__ . '/customizations/webqx-config.php';

use WebQX\EMR\WebQXConfig;

// Apply WebQX branding and customizations
$webqx_config = WebQXConfig::getConfig();

// Override OpenEMR globals with WebQX settings
$GLOBALS['webqx_enabled'] = true;
$GLOBALS['webqx_version'] = WebQXConfig::BRAND_VERSION;
$GLOBALS['sitename'] = WebQXConfig::BRAND_NAME;
$GLOBALS['site_addr_oath'] = WebQXConfig::BRAND_TAGLINE;

// Custom header with WebQX branding
function webqx_custom_header() {
    $styles = WebQXConfig::enqueueWebQXStyles();
    $branding = WebQXConfig::getBrandingHtml();
    
    echo $styles;
    echo '<div class="webqx-header">' . $branding . '</div>';
}

// Custom footer
function webqx_custom_footer() {
    echo '<div class="webqx-footer">';
    echo '<p>' . WebQXConfig::BRAND_COPYRIGHT . '</p>';
    echo '<p>Powered by WebQX™ EMR System v' . WebQXConfig::BRAND_VERSION . '</p>';
    echo '</div>';
}

// Simple sanitization function
function webqx_sanitize_text($text) {
    return htmlspecialchars(strip_tags($text), ENT_QUOTES, 'UTF-8');
}

// Initialize WebQX EMR header
if (WebQXConfig::isFeatureEnabled('modern_ui')) {
    webqx_custom_header();
}

// Custom routing for WebQX modules
if (isset($_GET['webqx_module'])) {
    $module = webqx_sanitize_text($_GET['webqx_module']);
    $module_config = WebQXConfig::getModuleConfig('webqx_' . $module);
    
    if ($module_config && $module_config['enabled']) {
        $module_path = __DIR__ . $module_config['path'] . '/index.php';
        if (file_exists($module_path)) {
            require_once $module_path;
            webqx_custom_footer();
            exit;
        }
    }
}

// WebQX API routing
if (strpos($_SERVER['REQUEST_URI'], '/api/v2/') !== false) {
    require_once __DIR__ . '/api/webqx-api.php';
    exit;
}

// Include OpenEMR core after WebQX setup
require_once __DIR__ . '/core/index.php';

// Add footer
if (WebQXConfig::isFeatureEnabled('modern_ui')) {
    webqx_custom_footer();
}
?>
