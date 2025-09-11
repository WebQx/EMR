-- WebQX™ EMR Database Initialization Script
-- Sets up the initial database structure for WebQX EMR system
-- Based on OpenEMR 7.0.3 with WebQX customizations

-- Create WebQX EMR database if it doesn't exist
CREATE DATABASE IF NOT EXISTS webqx_emr 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create WebQX user with appropriate privileges
CREATE USER IF NOT EXISTS 'webqx_user'@'%' 
  IDENTIFIED BY 'webqx_pass_2024!';

-- Grant all privileges on WebQX EMR database
GRANT ALL PRIVILEGES ON webqx_emr.* TO 'webqx_user'@'%';

-- Additional grants for specific operations
GRANT SELECT, INSERT, UPDATE, DELETE ON webqx_emr.* TO 'webqx_user'@'%';
GRANT CREATE, DROP, INDEX, ALTER ON webqx_emr.* TO 'webqx_user'@'%';
GRANT EXECUTE ON webqx_emr.* TO 'webqx_user'@'%';

-- Use the WebQX EMR database
USE webqx_emr;

-- WebQX Configuration Table
CREATE TABLE IF NOT EXISTS webqx_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT,
    config_group VARCHAR(100) DEFAULT 'general',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key),
    INDEX idx_config_group (config_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default WebQX configuration
INSERT INTO webqx_config (config_key, config_value, config_group, description) VALUES
('webqx_version', '1.0.0', 'system', 'WebQX EMR System Version'),
('webqx_site_name', 'WebQX™ EMR', 'branding', 'Site Name'),
('webqx_theme', 'webqx-theme', 'appearance', 'Default Theme'),
('webqx_timezone', 'America/New_York', 'general', 'Default Timezone'),
('webqx_language', 'en_US', 'general', 'Default Language'),
('webqx_api_enabled', 'true', 'api', 'Enable API Access'),
('webqx_fhir_enabled', 'true', 'fhir', 'Enable FHIR Support'),
('webqx_hl7_enabled', 'true', 'hl7', 'Enable HL7 Support'),
('webqx_security_mode', 'standard', 'security', 'Security Mode'),
('webqx_debug_mode', 'true', 'development', 'Debug Mode'),
('webqx_maintenance_mode', 'false', 'system', 'Maintenance Mode'),
('webqx_max_upload_size', '100M', 'files', 'Maximum Upload Size'),
('webqx_session_timeout', '28800', 'security', 'Session Timeout (seconds)'),
('webqx_backup_enabled', 'true', 'system', 'Enable Automatic Backups'),
('webqx_audit_log_enabled', 'true', 'security', 'Enable Audit Logging');

-- WebQX User Sessions Table (Enhanced)
CREATE TABLE IF NOT EXISTS webqx_sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload LONGTEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WebQX Audit Log Table
CREATE TABLE IF NOT EXISTS webqx_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WebQX API Keys Table
CREATE TABLE IF NOT EXISTS webqx_api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    api_secret VARCHAR(255) NOT NULL,
    user_id INT,
    permissions JSON,
    rate_limit INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_api_key (api_key),
    INDEX idx_user_id (user_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WebQX Module Registry Table
CREATE TABLE IF NOT EXISTS webqx_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(255) NOT NULL UNIQUE,
    module_version VARCHAR(50),
    module_path VARCHAR(500),
    is_enabled BOOLEAN DEFAULT TRUE,
    is_core BOOLEAN DEFAULT FALSE,
    dependencies JSON,
    configuration JSON,
    install_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_module_name (module_name),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default WebQX modules
INSERT INTO webqx_modules (module_name, module_version, module_path, is_core, configuration) VALUES
('webqx_dashboard', '1.0.0', '/modules/webqx_dashboard', TRUE, '{"widgets": ["patient_stats", "appointments", "billing"]}'),
('webqx_api', '1.0.0', '/api', TRUE, '{"version": "v2", "rate_limit": 1000}'),
('webqx_fhir', '1.0.0', '/api/fhir', TRUE, '{"version": "R4"}'),
('webqx_hl7', '1.0.0', '/api/hl7', TRUE, '{"version": "2.5.1"}'),
('webqx_reports', '1.0.0', '/modules/webqx_reports', FALSE, '{"formats": ["pdf", "csv", "xlsx"]}'),
('webqx_telehealth', '1.0.0', '/modules/webqx_telehealth', FALSE, '{"provider": "webrtc"}');

-- WebQX File Uploads Table
CREATE TABLE IF NOT EXISTS webqx_file_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(500) NOT NULL,
    stored_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255),
    file_hash VARCHAR(255),
    uploaded_by INT,
    related_type VARCHAR(100),
    related_id INT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_related (related_type, related_id),
    INDEX idx_file_hash (file_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WebQX Notification System
CREATE TABLE IF NOT EXISTS webqx_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    sender_id INT,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    notification_type VARCHAR(100) DEFAULT 'general',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(1000),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient_id),
    INDEX idx_unread (recipient_id, is_read),
    INDEX idx_type (notification_type),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WebQX System Health Monitoring
CREATE TABLE IF NOT EXISTS webqx_system_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    check_name VARCHAR(255) NOT NULL,
    status ENUM('healthy', 'warning', 'critical') NOT NULL,
    message TEXT,
    response_time DECIMAL(10,3),
    memory_usage BIGINT,
    cpu_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_check_name (check_name),
    INDEX idx_status (status),
    INDEX idx_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
ALTER TABLE webqx_config ADD INDEX idx_updated_at (updated_at);
ALTER TABLE webqx_audit_log ADD INDEX idx_ip_address (ip_address);
ALTER TABLE webqx_sessions ADD INDEX idx_ip_address (ip_address);

-- Update table statistics
ANALYZE TABLE webqx_config;
ANALYZE TABLE webqx_sessions;
ANALYZE TABLE webqx_audit_log;
ANALYZE TABLE webqx_api_keys;
ANALYZE TABLE webqx_modules;
ANALYZE TABLE webqx_file_uploads;
ANALYZE TABLE webqx_notifications;
ANALYZE TABLE webqx_system_health;

-- Flush privileges to ensure all changes take effect
FLUSH PRIVILEGES;

-- Display completion message
SELECT 'WebQX™ EMR Database initialized successfully!' as message;
