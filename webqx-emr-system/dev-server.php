<?php
/**
 * WebQX™ EMR Development Server
 * Simple PHP built-in server launcher for testing
 */

// Set error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('America/New_York');

// WebQX Development Configuration
define('WEBQX_DEV_MODE', true);
define('WEBQX_VERSION', '1.0.0');
define('WEBQX_DEBUG', true);

// Simple routing for development
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Remove query string
$path = strtok($path, '?');

// Basic routing
switch ($path) {
    case '/':
    case '/index.php':
        include 'index.php';
        break;
    
    case '/api/status':
    case '/api/v2/status':
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'healthy',
            'service' => 'WebQX EMR Development Server',
            'version' => WEBQX_VERSION,
            'timestamp' => date('c'),
            'mode' => 'development'
        ]);
        break;
    
    case '/api/health':
    case '/api/v2/health':
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'healthy',
            'checks' => [
                'webqx_core' => 'healthy',
                'php_version' => PHP_VERSION,
                'memory_usage' => memory_get_usage(true),
                'uptime' => time()
            ]
        ]);
        break;
    
    default:
        // Check if file exists
        $file = __DIR__ . $path;
        if (file_exists($file) && is_file($file)) {
            // Serve static files
            $ext = pathinfo($file, PATHINFO_EXTENSION);
            switch ($ext) {
                case 'css':
                    header('Content-Type: text/css');
                    break;
                case 'js':
                    header('Content-Type: application/javascript');
                    break;
                case 'json':
                    header('Content-Type: application/json');
                    break;
                case 'png':
                    header('Content-Type: image/png');
                    break;
                case 'jpg':
                case 'jpeg':
                    header('Content-Type: image/jpeg');
                    break;
                case 'gif':
                    header('Content-Type: image/gif');
                    break;
                case 'svg':
                    header('Content-Type: image/svg+xml');
                    break;
                default:
                    header('Content-Type: text/plain');
            }
            readfile($file);
        } else {
            // 404 for development
            http_response_code(404);
            echo "<h1>WebQX EMR Development - 404 Not Found</h1>";
            echo "<p>Path: " . htmlspecialchars($path) . "</p>";
            echo "<p><a href='/'>← Back to WebQX EMR</a></p>";
        }
}
?>
