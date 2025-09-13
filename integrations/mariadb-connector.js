/**
 * WebQX MariaDB Connector
 * Handles database connections and queries for all modules
 */

class MariaDBConnector {
    constructor() {
        this.connectionPool = null;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'webqx_user',
            password: process.env.DB_PASSWORD || 'webqx_secure_2024',
            database: process.env.DB_NAME || 'openemr',
            connectionLimit: 10,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
        
        this.schemas = {
            webqx_sessions: `
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
                    KEY expires_at (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `,
            webqx_module_access: `
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
                    KEY module_name (module_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `,
            webqx_placement_cards: `
                CREATE TABLE IF NOT EXISTS webqx_placement_cards (
                    id int(11) NOT NULL AUTO_INCREMENT,
                    card_id varchar(100) NOT NULL,
                    user_id int(11) DEFAULT NULL,
                    module_name varchar(100) NOT NULL,
                    title varchar(255) NOT NULL,
                    icon varchar(50) DEFAULT NULL,
                    position_x int(5) DEFAULT 0,
                    position_y int(5) DEFAULT 0,
                    width int(5) DEFAULT 1,
                    height int(5) DEFAULT 1,
                    visible tinyint(1) DEFAULT 1,
                    data_source varchar(255) DEFAULT NULL,
                    refresh_interval int(10) DEFAULT 300,
                    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
                    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY card_user (card_id, user_id),
                    KEY module_name (module_name),
                    KEY user_id (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `,
            webqx_module_data: `
                CREATE TABLE IF NOT EXISTS webqx_module_data (
                    id bigint(20) NOT NULL AUTO_INCREMENT,
                    module_name varchar(100) NOT NULL,
                    data_type varchar(100) NOT NULL,
                    data_key varchar(255) NOT NULL,
                    data_value longtext,
                    user_id int(11) DEFAULT NULL,
                    metadata json DEFAULT NULL,
                    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
                    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    expires_at timestamp NULL DEFAULT NULL,
                    PRIMARY KEY (id),
                    KEY module_data_key (module_name, data_type, data_key),
                    KEY user_id (user_id),
                    KEY expires_at (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `
        };
        
        this.init();
    }

    async init() {
        try {
            await this.createConnection();
            await this.initializeTables();
            await this.seedDefaultData();
            console.log('✅ MariaDB Connector initialized successfully');
        } catch (error) {
            console.error('❌ MariaDB Connector initialization failed:', error);
        }
    }

    async createConnection() {
        if (typeof window !== 'undefined') {
            // Browser environment - use fetch API
            this.apiMode = true;
            return;
        }

        // Node.js environment - use direct connection
        const mysql = require('mysql2/promise');
        this.connectionPool = mysql.createPool(this.config);
        
        // Test connection
        const connection = await this.connectionPool.getConnection();
        await connection.ping();
        connection.release();
        
        console.log('✅ MariaDB connection pool created');
    }

    async initializeTables() {
        for (const [tableName, schema] of Object.entries(this.schemas)) {
            try {
                await this.query(schema);
                console.log(`✅ Table ${tableName} initialized`);
            } catch (error) {
                console.error(`❌ Failed to initialize table ${tableName}:`, error);
            }
        }
    }

    async seedDefaultData() {
        // Seed default placement cards
        const defaultCards = [
            {
                card_id: 'patient-appointments',
                module_name: 'patient-portal',
                title: 'Appointments',
                icon: '📅',
                position_x: 0,
                position_y: 0,
                data_source: 'appointments_summary'
            },
            {
                card_id: 'patient-records',
                module_name: 'patient-portal',
                title: 'Medical Records',
                icon: '📋',
                position_x: 1,
                position_y: 0,
                data_source: 'medical_records_summary'
            },
            {
                card_id: 'patient-prescriptions',
                module_name: 'patient-portal',
                title: 'Prescriptions',
                icon: '💊',
                position_x: 2,
                position_y: 0,
                data_source: 'prescriptions_summary'
            },
            {
                card_id: 'telehealth-sessions',
                module_name: 'telehealth',
                title: 'Video Sessions',
                icon: '📹',
                position_x: 0,
                position_y: 1,
                data_source: 'telehealth_sessions_summary'
            },
            {
                card_id: 'provider-patients',
                module_name: 'provider-portal',
                title: 'Patient Management',
                icon: '👥',
                position_x: 0,
                position_y: 0,
                data_source: 'provider_patients_summary'
            },
            {
                card_id: 'admin-system',
                module_name: 'admin-console',
                title: 'System Status',
                icon: '⚙️',
                position_x: 0,
                position_y: 0,
                data_source: 'system_status_summary'
            }
        ];

        for (const card of defaultCards) {
            try {
                await this.query(`
                    INSERT IGNORE INTO webqx_placement_cards 
                    (card_id, module_name, title, icon, position_x, position_y, data_source)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    card.card_id,
                    card.module_name,
                    card.title,
                    card.icon,
                    card.position_x,
                    card.position_y,
                    card.data_source
                ]);
            } catch (error) {
                console.warn(`Could not seed card ${card.card_id}:`, error);
            }
        }
    }

    async query(sql, params = []) {
        if (this.apiMode) {
            // Browser mode - use API
            return await this.apiQuery(sql, params);
        }

        // Direct database mode
        const connection = await this.connectionPool.getConnection();
        try {
            const [results] = await connection.execute(sql, params);
            return results;
        } finally {
            connection.release();
        }
    }

    async apiQuery(sql, params = []) {
        const response = await fetch('/api/database/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('webqx_token') || ''}`
            },
            body: JSON.stringify({ sql, params })
        });

        if (!response.ok) {
            throw new Error(`API query failed: ${response.status}`);
        }

        return await response.json();
    }

    // Module-specific query methods
    async getPlacementCards(userId = null, moduleId = null) {
        let sql = `
            SELECT card_id, module_name, title, icon, position_x, position_y, 
                   width, height, visible, data_source, refresh_interval
            FROM webqx_placement_cards 
            WHERE 1=1
        `;
        const params = [];

        if (userId) {
            sql += ' AND (user_id = ? OR user_id IS NULL)';
            params.push(userId);
        }

        if (moduleId) {
            sql += ' AND module_name = ?';
            params.push(moduleId);
        }

        sql += ' ORDER BY position_y, position_x';

        return await this.query(sql, params);
    }

    async updatePlacementCard(cardId, userId, updates) {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(cardId, userId);

        const sql = `
            UPDATE webqx_placement_cards 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE card_id = ? AND (user_id = ? OR user_id IS NULL)
        `;

        return await this.query(sql, values);
    }

    async getModuleData(moduleName, dataType, userId = null) {
        let sql = `
            SELECT data_key, data_value, metadata, created_at, updated_at
            FROM webqx_module_data 
            WHERE module_name = ? AND data_type = ?
            AND (expires_at IS NULL OR expires_at > NOW())
        `;
        const params = [moduleName, dataType];

        if (userId) {
            sql += ' AND (user_id = ? OR user_id IS NULL)';
            params.push(userId);
        }

        sql += ' ORDER BY created_at DESC';

        return await this.query(sql, params);
    }

    async setModuleData(moduleName, dataType, dataKey, dataValue, userId = null, metadata = null, expiresAt = null) {
        const sql = `
            INSERT INTO webqx_module_data 
            (module_name, data_type, data_key, data_value, user_id, metadata, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            data_value = VALUES(data_value),
            metadata = VALUES(metadata),
            updated_at = CURRENT_TIMESTAMP,
            expires_at = VALUES(expires_at)
        `;

        return await this.query(sql, [
            moduleName,
            dataType,
            dataKey,
            JSON.stringify(dataValue),
            userId,
            metadata ? JSON.stringify(metadata) : null,
            expiresAt
        ]);
    }

    async getUserSessions(userId) {
        const sql = `
            SELECT session_id, username, role, login_time, last_activity, 
                   ip_address, active, expires_at
            FROM webqx_sessions 
            WHERE user_id = ? AND active = 1 AND expires_at > NOW()
            ORDER BY last_activity DESC
        `;

        return await this.query(sql, [userId]);
    }

    async createSession(sessionData) {
        const sql = `
            INSERT INTO webqx_sessions 
            (session_id, user_id, username, role, ip_address, user_agent, expires_at, uuid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return await this.query(sql, [
            sessionData.session_id,
            sessionData.user_id,
            sessionData.username,
            sessionData.role,
            sessionData.ip_address,
            sessionData.user_agent,
            sessionData.expires_at,
            sessionData.uuid
        ]);
    }

    async updateSessionActivity(sessionId) {
        const sql = `
            UPDATE webqx_sessions 
            SET last_activity = CURRENT_TIMESTAMP 
            WHERE session_id = ? AND active = 1
        `;

        return await this.query(sql, [sessionId]);
    }

    async getModuleAccess(userId, moduleName) {
        const sql = `
            SELECT access_level, expires_at
            FROM webqx_module_access 
            WHERE user_id = ? AND module_name = ? AND active = 1
            AND (expires_at IS NULL OR expires_at > NOW())
        `;

        const results = await this.query(sql, [userId, moduleName]);
        return results.length > 0 ? results[0] : null;
    }

    async setModuleAccess(userId, moduleName, accessLevel, grantedBy = null, expiresAt = null) {
        const sql = `
            INSERT INTO webqx_module_access 
            (user_id, module_name, access_level, granted_by, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            access_level = VALUES(access_level),
            granted_by = VALUES(granted_by),
            granted_at = CURRENT_TIMESTAMP,
            expires_at = VALUES(expires_at),
            active = 1
        `;

        return await this.query(sql, [userId, moduleName, accessLevel, grantedBy, expiresAt]);
    }

    // Analytics and reporting methods
    async getModuleUsageStats(startDate = null, endDate = null) {
        let sql = `
            SELECT module_name, COUNT(*) as access_count,
                   COUNT(DISTINCT user_id) as unique_users,
                   DATE(created_at) as access_date
            FROM webqx_module_data 
            WHERE data_type = 'access_log'
        `;
        const params = [];

        if (startDate) {
            sql += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND created_at <= ?';
            params.push(endDate);
        }

        sql += ' GROUP BY module_name, DATE(created_at) ORDER BY access_date DESC, access_count DESC';

        return await this.query(sql, params);
    }

    async getPlacementCardMetrics() {
        const sql = `
            SELECT module_name, COUNT(*) as card_count,
                   AVG(refresh_interval) as avg_refresh_interval,
                   SUM(CASE WHEN visible = 1 THEN 1 ELSE 0 END) as visible_cards
            FROM webqx_placement_cards 
            GROUP BY module_name
        `;

        return await this.query(sql);
    }

    // Cleanup methods
    async cleanupExpiredSessions() {
        const sql = `
            UPDATE webqx_sessions 
            SET active = 0 
            WHERE expires_at < NOW() AND active = 1
        `;

        return await this.query(sql);
    }

    async cleanupExpiredData() {
        const sql = `
            DELETE FROM webqx_module_data 
            WHERE expires_at IS NOT NULL AND expires_at < NOW()
        `;

        return await this.query(sql);
    }

    async close() {
        if (this.connectionPool) {
            await this.connectionPool.end();
            console.log('✅ MariaDB connection pool closed');
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MariaDBConnector;
} else {
    window.MariaDBConnector = MariaDBConnector;
}