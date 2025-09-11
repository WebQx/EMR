<?php
/**
 * WebQX™ EMR Configuration
 * Custom configuration and branding for WebQX Electronic Medical Records
 */

namespace WebQX\EMR;

class WebQXConfig {
    
    // WebQX Branding
    const BRAND_NAME = 'WebQX™ EMR';
    const BRAND_TAGLINE = 'The Future of Healthcare Technology';
    const BRAND_VERSION = '1.0.0';
    const BRAND_COPYRIGHT = '© 2025 WebQX Technologies';
    
    // Theme Configuration
    const THEME_NAME = 'webqx-modern';
    const THEME_VERSION = '1.0.0';
    const PRIMARY_COLOR = '#0891b2';
    const SECONDARY_COLOR = '#164e63';
    const ACCENT_COLOR = '#00ffd5';
    
    // Feature Flags
    const FEATURES = [
        'modern_ui' => true,
        'cloud_integration' => true,
        'advanced_analytics' => true,
        'mobile_responsive' => true,
        'api_enhanced' => true,
        'multi_tenant' => true,
        'telehealth_integration' => true,
        'ai_assistant' => true,
    ];
    
    // Custom Modules
    const CUSTOM_MODULES = [
        'webqx_dashboard' => [
            'name' => 'WebQX Dashboard',
            'version' => '1.0.0',
            'enabled' => true,
            'path' => '/modules/webqx_dashboard'
        ],
        'webqx_analytics' => [
            'name' => 'WebQX Analytics',
            'version' => '1.0.0', 
            'enabled' => true,
            'path' => '/modules/webqx_analytics'
        ],
        'webqx_telehealth' => [
            'name' => 'WebQX Telehealth',
            'version' => '1.0.0',
            'enabled' => true,
            'path' => '/modules/webqx_telehealth'
        ],
        'webqx_ai_assistant' => [
            'name' => 'WebQX AI Assistant',
            'version' => '1.0.0',
            'enabled' => true,
            'path' => '/modules/webqx_ai_assistant'
        ],
    ];
    
    // API Configuration
    const API_CONFIG = [
        'version' => 'v2',
        'base_url' => '/api/v2',
        'rate_limit' => 1000,
        'authentication' => 'oauth2',
        'cors_enabled' => true,
        'swagger_enabled' => true,
    ];
    
    // Database Configuration
    const DB_CONFIG = [
        'driver' => 'mysql',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => 'webqx_',
        'pool_size' => 20,
        'timeout' => 30,
    ];
    
    // Security Configuration
    const SECURITY_CONFIG = [
        'password_policy' => [
            'min_length' => 12,
            'require_uppercase' => true,
            'require_lowercase' => true,
            'require_numbers' => true,
            'require_symbols' => true,
            'max_age_days' => 90,
        ],
        'session_timeout' => 3600, // 1 hour
        'max_login_attempts' => 5,
        'lockout_duration' => 900, // 15 minutes
        'two_factor_required' => true,
        'encryption_algorithm' => 'AES-256-GCM',
    ];
    
    // Cloud Configuration
    const CLOUD_CONFIG = [
        'provider' => 'aws', // aws, azure, gcp
        'region' => 'us-east-1',
        'storage_bucket' => 'webqx-emr-storage',
        'cdn_enabled' => true,
        'backup_enabled' => true,
        'backup_retention_days' => 365,
    ];
    
    // Compliance Configuration
    const COMPLIANCE_CONFIG = [
        'hipaa_enabled' => true,
        'audit_logging' => true,
        'data_encryption' => true,
        'access_logging' => true,
        'compliance_reports' => true,
        'patient_consent_tracking' => true,
    ];
    
    /**
     * Get WebQX Configuration
     */
    public static function getConfig($section = null) {
        $config = [
            'brand' => [
                'name' => self::BRAND_NAME,
                'tagline' => self::BRAND_TAGLINE,
                'version' => self::BRAND_VERSION,
                'copyright' => self::BRAND_COPYRIGHT,
            ],
            'theme' => [
                'name' => self::THEME_NAME,
                'version' => self::THEME_VERSION,
                'primary_color' => self::PRIMARY_COLOR,
                'secondary_color' => self::SECONDARY_COLOR,
                'accent_color' => self::ACCENT_COLOR,
            ],
            'features' => self::FEATURES,
            'modules' => self::CUSTOM_MODULES,
            'api' => self::API_CONFIG,
            'database' => self::DB_CONFIG,
            'security' => self::SECURITY_CONFIG,
            'cloud' => self::CLOUD_CONFIG,
            'compliance' => self::COMPLIANCE_CONFIG,
        ];
        
        return $section ? ($config[$section] ?? null) : $config;
    }
    
    /**
     * Check if feature is enabled
     */
    public static function isFeatureEnabled($feature) {
        return self::FEATURES[$feature] ?? false;
    }
    
    /**
     * Get module configuration
     */
    public static function getModuleConfig($module) {
        return self::CUSTOM_MODULES[$module] ?? null;
    }
    
    /**
     * Apply WebQX customizations to OpenEMR
     */
    public static function applyCustomizations() {
        // Override OpenEMR globals with WebQX settings
        global $webqx_config;
        $webqx_config = self::getConfig();
        
        // Set custom theme
        if (self::isFeatureEnabled('modern_ui')) {
            self::enqueueWebQXStyles();
        }
        
        // Enable custom modules
        foreach (self::CUSTOM_MODULES as $module_key => $module_config) {
            if ($module_config['enabled']) {
                self::loadCustomModule($module_key, $module_config);
            }
        }
    }
    
    /**
     * Enqueue WebQX styles and scripts
     */
    public static function enqueueWebQXStyles() {
        // Add WebQX theme CSS to page header
        $theme_css = '<link rel="stylesheet" href="/themes/webqx-theme.css?v=' . self::THEME_VERSION . '">';
        $core_js = '<script src="/js/webqx-core.js?v=' . self::BRAND_VERSION . '"></script>';
        
        return $theme_css . "\n" . $core_js . "\n";
    }
    
    /**
     * Load custom WebQX module
     */
    public static function loadCustomModule($module_key, $module_config) {
        $module_path = __DIR__ . $module_config['path'] . '/module.php';
        if (file_exists($module_path)) {
            require_once $module_path;
        }
    }
    
    /**
     * Get WebQX branding for headers/footers
     */
    public static function getBrandingHtml() {
        return sprintf(
            '<div class="webqx-branding">
                <div class="webqx-logo">%s</div>
                <div class="webqx-tagline">%s</div>
                <div class="webqx-version">v%s</div>
            </div>',
            self::BRAND_NAME,
            self::BRAND_TAGLINE,
            self::BRAND_VERSION
        );
    }
}

// Initialize WebQX customizations
WebQXConfig::applyCustomizations();
