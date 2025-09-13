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

