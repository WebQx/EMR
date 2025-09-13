# WebQX Integration Tables for MariaDB/OpenEMR
# Creates additional tables for WebQX features

mysql -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    USE openemr;
    
    -- WebQX Session Management
    CREATE TABLE IF NOT EXISTS webqx_sessions (
        session_id varchar(128) NOT NULL,
        user_id int(11) NOT NULL,
        username varchar(255) NOT NULL,
        role varchar(50) NOT NULL DEFAULT 'user',
        login_time timestamp DEFAULT CURRENT_TIMESTAMP,
        last_activity timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ip_address varchar(45) DEFAULT NULL,
        user_agent text,
        active tinyint(1) NOT NULL DEFAULT 1,
        expires_at timestamp NOT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (session_id),
        KEY user_id (user_id),
        KEY username (username),
        KEY active (active),
        KEY expires_at (expires_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- WebQX Module Access Control
    CREATE TABLE IF NOT EXISTS webqx_module_access (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        module_name varchar(100) NOT NULL,
        access_level enum('none','read','write','admin') NOT NULL DEFAULT 'read',
        granted_by int(11) DEFAULT NULL,
        granted_at timestamp DEFAULT CURRENT_TIMESTAMP,
        expires_at timestamp NULL DEFAULT NULL,
        active tinyint(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id),
        UNIQUE KEY user_module (user_id, module_name),
        KEY module_name (module_name),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- WebQX Server Status Monitoring
    CREATE TABLE IF NOT EXISTS webqx_server_status (
        id int(11) NOT NULL AUTO_INCREMENT,
        server_name varchar(100) NOT NULL,
        server_type enum('emr','telehealth','proxy','analytics') NOT NULL,
        port int(5) NOT NULL,
        status enum('online','offline','error','starting','stopping') NOT NULL DEFAULT 'offline',
        last_check timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        response_time_ms int(6) DEFAULT NULL,
        error_message text,
        started_by int(11) DEFAULT NULL,
        started_at timestamp NULL DEFAULT NULL,
        version varchar(50) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY server_name (server_name),
        KEY server_type (server_type),
        KEY status (status),
        FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Insert default server configurations
    INSERT IGNORE INTO webqx_server_status (server_name, server_type, port, status) VALUES
    ('Local EMR Server', 'emr', 3000, 'offline'),
    ('Telehealth Server', 'telehealth', 3003, 'offline'),
    ('API Proxy Server', 'proxy', 3001, 'offline'),
    ('Analytics Server', 'analytics', 3004, 'offline');
    
    -- WebQX User Preferences
    CREATE TABLE IF NOT EXISTS webqx_user_preferences (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        preference_key varchar(100) NOT NULL,
        preference_value text,
        category varchar(50) DEFAULT 'general',
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY user_preference (user_id, preference_key),
        KEY category (category),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- WebQX Activity Log
    CREATE TABLE IF NOT EXISTS webqx_activity_log (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id int(11) DEFAULT NULL,
        session_id varchar(128) DEFAULT NULL,
        activity_type varchar(50) NOT NULL,
        module_name varchar(100) DEFAULT NULL,
        action varchar(100) NOT NULL,
        target_id varchar(100) DEFAULT NULL,
        details json DEFAULT NULL,
        ip_address varchar(45) DEFAULT NULL,
        user_agent text,
        timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
        severity enum('info','warning','error','critical') DEFAULT 'info',
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY session_id (session_id),
        KEY activity_type (activity_type),
        KEY timestamp (timestamp),
        KEY severity (severity),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- WebQX Remote Control Settings
    CREATE TABLE IF NOT EXISTS webqx_remote_settings (
        id int(11) NOT NULL AUTO_INCREMENT,
        setting_key varchar(100) NOT NULL,
        setting_value text,
        setting_type enum('string','number','boolean','json') DEFAULT 'string',
        category varchar(50) DEFAULT 'general',
        description text,
        is_secure tinyint(1) DEFAULT 0,
        updated_by int(11) DEFAULT NULL,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY setting_key (setting_key),
        KEY category (category),
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Insert default remote settings
    INSERT IGNORE INTO webqx_remote_settings (setting_key, setting_value, setting_type, category, description) VALUES
    ('remote_control_enabled', 'true', 'boolean', 'security', 'Enable remote server control'),
    ('auto_start_servers', 'false', 'boolean', 'startup', 'Automatically start all servers on boot'),
    ('server_monitor_interval', '30', 'number', 'monitoring', 'Server status check interval in seconds'),
    ('session_timeout', '3600', 'number', 'security', 'User session timeout in seconds'),
    ('max_concurrent_sessions', '100', 'number', 'performance', 'Maximum concurrent user sessions'),
    ('enable_activity_logging', 'true', 'boolean', 'logging', 'Enable user activity logging'),
    ('log_retention_days', '90', 'number', 'logging', 'Days to retain activity logs');
    
EOSQL