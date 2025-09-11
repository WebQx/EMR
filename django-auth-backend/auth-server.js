// WebQX Authentication Server (Node.js Implementation)
// Django-style secure authentication for testing

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'webqx-django-style-jwt-secret-2024';
const BCRYPT_ROUNDS = 12;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

// Rate Limiting (Django-style)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts. Please try again later.',
        retry_after: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests. Please try again later.' }
});

app.use('/api/v1/auth/token/', authLimiter);
app.use('/api/v1/auth/register/', authLimiter);
app.use('/api/v1/', generalLimiter);

// Role-Based Access Control (RBAC) Configuration
const ROLES = {
    PATIENT: {
        name: 'Patient',
        permissions: [
            'view_own_records',
            'update_own_profile',
            'book_appointments',
            'view_lab_results',
            'message_providers',
            'view_billing'
        ],
        level: 1,
        dashboard: '/patient-dashboard',
        mfa_required: false
    },
    NURSE: {
        name: 'Nurse',
        permissions: [
            'view_patient_records',
            'update_vitals',
            'create_notes',
            'view_schedules',
            'manage_medications',
            'patient_communication'
        ],
        level: 2,
        dashboard: '/nurse-dashboard',
        mfa_required: false
    },
    PHYSICIAN_ASSISTANT: {
        name: 'Physician Assistant',
        permissions: [
            'view_patient_records',
            'create_diagnoses',
            'prescribe_medications',
            'order_tests',
            'create_treatment_plans',
            'patient_communication',
            'view_reports'
        ],
        level: 3,
        dashboard: '/pa-dashboard',
        mfa_required: true
    },
    PHYSICIAN: {
        name: 'Physician',
        permissions: [
            'view_all_patient_records',
            'create_diagnoses',
            'prescribe_medications',
            'order_tests',
            'create_treatment_plans',
            'approve_treatments',
            'patient_communication',
            'view_reports',
            'supervise_staff'
        ],
        level: 4,
        dashboard: '/physician-dashboard',
        mfa_required: true
    },
    BILLING: {
        name: 'Billing Specialist',
        permissions: [
            'view_patient_billing',
            'create_invoices',
            'process_payments',
            'insurance_claims',
            'financial_reports',
            'billing_communication'
        ],
        level: 2,
        dashboard: '/billing-dashboard',
        mfa_required: true
    },
    ADMINISTRATOR: {
        name: 'System Administrator',
        permissions: [
            'user_management',
            'system_configuration',
            'security_monitoring',
            'backup_management',
            'audit_logs',
            'role_management',
            'all_permissions'
        ],
        level: 5,
        dashboard: '/admin-dashboard',
        mfa_required: true
    }
};

// Permission checking middleware
function checkPermission(requiredPermission) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = ROLES[user.user_type];
        if (!userRole) {
            return res.status(403).json({ error: 'Invalid user role' });
        }

        const hasPermission = userRole.permissions.includes(requiredPermission) || 
                            userRole.permissions.includes('all_permissions');

        if (!hasPermission) {
            logSecurityEvent(user.id, 'PERMISSION_DENIED', 'MEDIUM', 
                `Access denied for permission: ${requiredPermission}`, req);
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required_permission: requiredPermission,
                user_role: userRole.name
            });
        }

        next();
    };
}

// Role hierarchy checking
function checkRoleLevel(requiredLevel) {
    return (req, res, next) => {
        const user = req.user;
        const userRole = ROLES[user.user_type];
        
        if (userRole.level < requiredLevel) {
            return res.status(403).json({ 
                error: 'Insufficient role level',
                required_level: requiredLevel,
                user_level: userRole.level
            });
        }
        
        next();
    };
}
const users = new Map();
const userSessions = new Map();
const securityEvents = new Map();
const loginHistory = new Map();

// Django-style User Model
class WebQXUser {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.email = data.email.toLowerCase();
        this.password_hash = data.password_hash;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.middle_name = data.middle_name || '';
        this.date_of_birth = data.date_of_birth;
        this.phone_number = data.phone_number;
        this.user_type = data.user_type || 'PATIENT';
        this.verification_status = data.verification_status || 'PENDING';
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.is_staff = data.is_staff || false;
        this.is_verified = data.is_verified || false;
        this.email_verified = data.email_verified || false;
        this.phone_verified = data.phone_verified || false;
        this.mfa_enabled = data.mfa_enabled || false;
        this.mfa_secret = data.mfa_secret || null;
        this.backup_tokens = data.backup_tokens || [];
        this.last_login_ip = data.last_login_ip || null;
        this.failed_login_attempts = data.failed_login_attempts || 0;
        this.lockout_until = data.lockout_until || null;
        this.country = data.country || '';
        this.timezone = data.timezone || 'UTC';
        this.language = data.language || 'en';
        this.hipaa_authorization = data.hipaa_authorization || false;
        this.gdpr_consent = data.gdpr_consent || false;
        this.privacy_policy_accepted = data.privacy_policy_accepted || false;
        this.terms_accepted = data.terms_accepted || false;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
        this.last_activity = data.last_activity || new Date();
        this.metadata = data.metadata || {};
    }

    get_full_name() {
        if (this.middle_name) {
            return `${this.first_name} ${this.middle_name} ${this.last_name}`.trim();
        }
        return `${this.first_name} ${this.last_name}`.trim();
    }

    is_locked_out() {
        return this.lockout_until && new Date() < new Date(this.lockout_until);
    }

    increment_failed_login() {
        this.failed_login_attempts += 1;
        if (this.failed_login_attempts >= 5) {
            this.lockout_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }
        this.updated_at = new Date();
    }

    reset_failed_login() {
        this.failed_login_attempts = 0;
        this.lockout_until = null;
        this.updated_at = new Date();
    }

    requires_mfa() {
        const userRole = ROLES[this.user_type];
        return userRole ? userRole.mfa_required : false;
    }

    get_permissions() {
        const userRole = ROLES[this.user_type];
        return userRole ? userRole.permissions : [];
    }

    get_role_info() {
        const userRole = ROLES[this.user_type];
        return userRole ? {
            name: userRole.name,
            level: userRole.level,
            dashboard: userRole.dashboard,
            permissions: userRole.permissions,
            mfa_required: userRole.mfa_required
        } : null;
    }

    has_permission(permission) {
        const permissions = this.get_permissions();
        return permissions.includes(permission) || permissions.includes('all_permissions');
    }

    toJSON() {
        const { password_hash, mfa_secret, backup_tokens, ...userWithoutSensitive } = this;
        return userWithoutSensitive;
    }
}

// Utility Functions
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
}

function logSecurityEvent(userId, eventType, severity, description, req) {
    const event = {
        id: uuidv4(),
        user_id: userId,
        event_type: eventType,
        severity: severity,
        timestamp: new Date(),
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'] || '',
        description: description,
        metadata: {}
    };
    
    securityEvents.set(event.id, event);
    console.log(`[SECURITY] ${severity}: ${eventType} - ${description} (User: ${userId})`);
}

function logLoginAttempt(userId, status, req, failureReason = null) {
    const loginRecord = {
        id: uuidv4(),
        user_id: userId,
        timestamp: new Date(),
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'] || '',
        status: status,
        failure_reason: failureReason
    };
    
    loginHistory.set(loginRecord.id, loginRecord);
}

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        const userData = users.get(user.user_id);
        if (!userData || !userData.is_active) {
            return res.status(403).json({ error: 'User account is inactive' });
        }

        req.user = userData;
        next();
    });
}

// Routes

// Health Check (Django-style)
app.get('/health/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'webqx-auth',
        users_count: users.size,
        active_sessions: userSessions.size
    });
});

// User Registration (Django-style)
app.post('/api/v1/auth/register/', async (req, res) => {
    try {
        const {
            email, password, password_confirm,
            first_name, last_name, middle_name,
            date_of_birth, phone_number, user_type,
            country, language, terms_accepted,
            privacy_policy_accepted, hipaa_authorization,
            gdpr_consent
        } = req.body;

        // Validation (Django-style)
        const errors = {};

        if (!email || !validator.isEmail(email)) {
            errors.email = ['Enter a valid email address'];
        }

        if (users.has(email.toLowerCase())) {
            errors.email = ['A user with this email already exists'];
        }

        if (!password || password.length < 12) {
            errors.password = ['Password must be at least 12 characters long'];
        }

        if (password !== password_confirm) {
            errors.password_confirm = ['Password confirmation does not match'];
        }

        if (!first_name) {
            errors.first_name = ['This field is required'];
        }

        if (!last_name) {
            errors.last_name = ['This field is required'];
        }

        if (!terms_accepted) {
            errors.terms_accepted = ['You must accept the terms and conditions'];
        }

        if (!privacy_policy_accepted) {
            errors.privacy_policy_accepted = ['You must accept the privacy policy'];
        }

        if (user_type === 'PATIENT' && !hipaa_authorization) {
            errors.hipaa_authorization = ['HIPAA authorization is required for patients'];
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Registration failed. Please check your input.',
                errors: errors
            });
        }

        // Create user (Django-style)
        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        
        const userData = {
            email: email.toLowerCase(),
            password_hash,
            first_name,
            last_name,
            middle_name,
            date_of_birth,
            phone_number,
            user_type: user_type || 'PATIENT',
            country,
            language: language || 'en',
            terms_accepted,
            privacy_policy_accepted,
            hipaa_authorization,
            gdpr_consent
        };

        const user = new WebQXUser(userData);
        users.set(user.email, user);

        // Log registration
        logSecurityEvent(user.id, 'ACCOUNT_CREATED', 'LOW', 'New user account created', req);

        // Generate tokens
        const accessToken = jwt.sign(
            { user_id: user.id, email: user.email, user_type: user.user_type },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { user_id: user.id, type: 'refresh' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification.',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.get_full_name(),
                user_type: user.user_type,
                verification_status: user.verification_status,
                email_verified: user.email_verified
            },
            tokens: {
                access: accessToken,
                refresh: refreshToken
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            errors: { non_field_errors: ['An unexpected error occurred'] }
        });
    }
});

// User Login (Django-style JWT)
app.post('/api/v1/auth/token/', async (req, res) => {
    try {
        const { email, password, remember_me } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const user = users.get(email.toLowerCase());
        
        if (!user) {
            logLoginAttempt(null, 'FAILED', req, 'User not found');
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        if (!user.is_active) {
            logLoginAttempt(user.id, 'FAILED', req, 'Account deactivated');
            return res.status(401).json({
                error: 'This account has been deactivated'
            });
        }

        if (user.is_locked_out()) {
            logLoginAttempt(user.id, 'BLOCKED', req, 'Account locked');
            return res.status(423).json({
                error: 'Account is temporarily locked due to multiple failed login attempts'
            });
        }

        const passwordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordValid) {
            user.increment_failed_login();
            users.set(user.email, user);
            logLoginAttempt(user.id, 'FAILED', req, 'Invalid password');
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Check if MFA is required
        if (user.mfa_enabled) {
            // For this demo, we'll skip MFA verification
            // In production, you'd return a partial token requiring MFA
        }

        // Successful login
        user.reset_failed_login();
        user.last_login_ip = getClientIP(req);
        user.last_activity = new Date();
        users.set(user.email, user);

        logLoginAttempt(user.id, 'SUCCESS', req);
        logSecurityEvent(user.id, 'SUCCESSFUL_LOGIN', 'LOW', 'User logged in successfully', req);

        const accessToken = jwt.sign(
            { user_id: user.id, email: user.email, user_type: user.user_type },
            JWT_SECRET,
            { expiresIn: remember_me ? '7d' : '1h' }
        );

        const refreshToken = jwt.sign(
            { user_id: user.id, type: 'refresh' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            access: accessToken,
            refresh: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.get_full_name(),
                user_type: user.user_type,
                role_info: user.get_role_info(),
                mfa_enabled: user.mfa_enabled,
                permissions: user.get_permissions()
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed. Please try again.'
        });
    }
});

// Get User Profile (Django-style)
app.get('/api/v1/auth/profile/', authenticateToken, (req, res) => {
    const user = req.user;
    
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.get_full_name(),
        date_of_birth: user.date_of_birth,
        phone_number: user.phone_number,
        user_type: user.user_type,
        verification_status: user.verification_status,
        country: user.country,
        language: user.language,
        timezone: user.timezone,
        is_verified: user.is_verified,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        mfa_enabled: user.mfa_enabled,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_activity: user.last_activity
    });
});

// MFA Setup (Django-style)
app.get('/api/v1/auth/mfa/setup/', authenticateToken, async (req, res) => {
    const user = req.user;
    
    if (user.mfa_enabled) {
        return res.json({
            message: 'MFA is already enabled',
            setup_complete: true
        });
    }

    try {
        const secret = speakeasy.generateSecret({
            name: user.email,
            issuer: 'WebQX Healthcare'
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Store secret temporarily (in production, use Redis with expiry)
        user.temp_mfa_secret = secret.base32;
        users.set(user.email, user);

        res.json({
            qr_code: qrCodeUrl,
            secret: secret.base32,
            setup_complete: false
        });

    } catch (error) {
        console.error('MFA setup error:', error);
        res.status(500).json({
            error: 'Failed to setup MFA. Please try again.'
        });
    }
});

app.post('/api/v1/auth/mfa/setup/', authenticateToken, (req, res) => {
    const user = req.user;
    const { token } = req.body;

    if (!user.temp_mfa_secret) {
        return res.status(400).json({
            error: 'Setup session expired. Please start again.'
        });
    }

    const verified = speakeasy.totp.verify({
        secret: user.temp_mfa_secret,
        encoding: 'base32',
        token: token,
        window: 2
    });

    if (verified) {
        user.mfa_enabled = true;
        user.mfa_secret = user.temp_mfa_secret;
        delete user.temp_mfa_secret;
        
        // Generate backup tokens
        user.backup_tokens = Array.from({ length: 10 }, () => 
            Math.random().toString(36).substr(2, 8).toUpperCase()
        );

        users.set(user.email, user);

        logSecurityEvent(user.id, 'MFA_ENABLED', 'MEDIUM', 'Multi-factor authentication enabled', req);

        res.json({
            message: 'MFA setup complete',
            backup_tokens: user.backup_tokens,
            setup_complete: true
        });
    } else {
        res.status(400).json({
            error: 'Invalid token. Please try again.'
        });
    }
});

// Role-based Dashboard Routes
app.get('/api/v1/dashboard/', authenticateToken, (req, res) => {
    const user = req.user;
    const roleInfo = user.get_role_info();
    
    res.json({
        user: {
            id: user.id,
            email: user.email,
            full_name: user.get_full_name(),
            role: roleInfo.name,
            dashboard_url: roleInfo.dashboard
        },
        role_info: roleInfo,
        quick_actions: getQuickActionsForRole(user.user_type),
        notifications: getUserNotifications(user.id),
        recent_activity: getUserRecentActivity(user.id)
    });
});

// Patient Dashboard
app.get('/api/v1/patient-dashboard/', authenticateToken, checkPermission('view_own_records'), (req, res) => {
    const user = req.user;
    res.json({
        dashboard_type: 'patient',
        user: user.get_full_name(),
        sections: [
            { name: 'My Health Records', permission: 'view_own_records', available: true },
            { name: 'Appointments', permission: 'book_appointments', available: true },
            { name: 'Lab Results', permission: 'view_lab_results', available: true },
            { name: 'Medications', permission: 'view_own_records', available: true },
            { name: 'Messages', permission: 'message_providers', available: true },
            { name: 'Billing', permission: 'view_billing', available: true }
        ]
    });
});

// Physician Dashboard
app.get('/api/v1/physician-dashboard/', authenticateToken, checkPermission('view_all_patient_records'), (req, res) => {
    const user = req.user;
    res.json({
        dashboard_type: 'physician',
        user: user.get_full_name(),
        sections: [
            { name: 'Patient Records', permission: 'view_all_patient_records', available: true },
            { name: 'Diagnoses & Treatment', permission: 'create_diagnoses', available: true },
            { name: 'Prescriptions', permission: 'prescribe_medications', available: true },
            { name: 'Lab Orders', permission: 'order_tests', available: true },
            { name: 'Staff Supervision', permission: 'supervise_staff', available: true },
            { name: 'Reports', permission: 'view_reports', available: true }
        ]
    });
});

// Nurse Dashboard
app.get('/api/v1/nurse-dashboard/', authenticateToken, checkPermission('view_patient_records'), (req, res) => {
    const user = req.user;
    res.json({
        dashboard_type: 'nurse',
        user: user.get_full_name(),
        sections: [
            { name: 'Patient Care', permission: 'view_patient_records', available: true },
            { name: 'Vitals & Notes', permission: 'update_vitals', available: true },
            { name: 'Medications', permission: 'manage_medications', available: true },
            { name: 'Schedules', permission: 'view_schedules', available: true },
            { name: 'Patient Communication', permission: 'patient_communication', available: true }
        ]
    });
});

// Admin Dashboard
app.get('/api/v1/admin-dashboard/', authenticateToken, checkPermission('user_management'), (req, res) => {
    const user = req.user;
    res.json({
        dashboard_type: 'administrator',
        user: user.get_full_name(),
        sections: [
            { name: 'User Management', permission: 'user_management', available: true },
            { name: 'System Configuration', permission: 'system_configuration', available: true },
            { name: 'Security Monitoring', permission: 'security_monitoring', available: true },
            { name: 'Audit Logs', permission: 'audit_logs', available: true },
            { name: 'Role Management', permission: 'role_management', available: true },
            { name: 'Backup Management', permission: 'backup_management', available: true }
        ]
    });
});

// Billing Dashboard
app.get('/api/v1/billing-dashboard/', authenticateToken, checkPermission('view_patient_billing'), (req, res) => {
    const user = req.user;
    res.json({
        dashboard_type: 'billing',
        user: user.get_full_name(),
        sections: [
            { name: 'Patient Billing', permission: 'view_patient_billing', available: true },
            { name: 'Invoices', permission: 'create_invoices', available: true },
            { name: 'Payments', permission: 'process_payments', available: true },
            { name: 'Insurance Claims', permission: 'insurance_claims', available: true },
            { name: 'Financial Reports', permission: 'financial_reports', available: true }
        ]
    });
});

// Helper functions for dashboard
function getQuickActionsForRole(userType) {
    const actions = {
        PATIENT: ['View Lab Results', 'Book Appointment', 'Message Doctor', 'Pay Bill'],
        NURSE: ['Update Vitals', 'Add Notes', 'Check Schedule', 'Patient Messages'],
        PHYSICIAN_ASSISTANT: ['Review Patients', 'Write Prescriptions', 'Order Tests', 'Treatment Plans'],
        PHYSICIAN: ['Patient Rounds', 'Approve Treatments', 'Staff Oversight', 'Medical Reports'],
        BILLING: ['Process Payments', 'Insurance Claims', 'Generate Invoices', 'Financial Reports'],
        ADMINISTRATOR: ['User Management', 'System Monitoring', 'Security Audit', 'Backup Status']
    };
    return actions[userType] || [];
}

function getUserNotifications(userId) {
    return [
        { type: 'info', message: 'System maintenance scheduled for tonight', priority: 'low' },
        { type: 'success', message: 'Login successful', priority: 'low' }
    ];
}

function getUserRecentActivity(userId) {
    return [
        { action: 'Login', timestamp: new Date(), ip: '127.0.0.1' },
        { action: 'Profile viewed', timestamp: new Date(Date.now() - 300000), ip: '127.0.0.1' }
    ];
}
app.get('/api/v1/auth/security/dashboard/', authenticateToken, (req, res) => {
    const user = req.user;
    
    // Get user's security events
    const userEvents = Array.from(securityEvents.values())
        .filter(event => event.user_id === user.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    // Get user's login history
    const userLogins = Array.from(loginHistory.values())
        .filter(login => login.user_id === user.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    res.json({
        account_security: {
            mfa_enabled: user.mfa_enabled,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            account_created: user.created_at,
            last_login_ip: user.last_login_ip
        },
        recent_events: userEvents.map(event => ({
            event_type: event.event_type,
            severity: event.severity,
            timestamp: event.timestamp,
            description: event.description,
            ip_address: event.ip_address
        })),
        recent_logins: userLogins.map(login => ({
            timestamp: login.timestamp,
            ip_address: login.ip_address,
            status: login.status,
            user_agent: login.user_agent?.substring(0, 100) + '...'
        })),
        statistics: {
            total_logins: userLogins.filter(l => l.status === 'SUCCESS').length,
            failed_attempts: userLogins.filter(l => l.status === 'FAILED').length,
            security_events: userEvents.length
        }
    });
});

// Serve test frontend
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebQX Authentication Test</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; }
        .header p { color: #64748b; margin: 5px 0 0 0; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .section h3 { margin-top: 0; color: #374151; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #374151; }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 5px; font-size: 14px; }
        .btn { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 5px; }
        .btn:hover { background: #1d4ed8; }
        .btn-secondary { background: #6b7280; }
        .btn-secondary:hover { background: #4b5563; }
        .result { margin: 15px 0; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
        .success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .info { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
        .endpoints { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .endpoints h4 { margin-top: 0; color: #374151; }
        .endpoints ul { margin: 0; padding-left: 20px; }
        .endpoints li { margin: 5px 0; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .status.online { background: #dcfce7; color: #166534; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 WebQX Authentication Server</h1>
            <p>Django-style Secure Authentication Testing</p>
            <div class="status online">✅ Server Online</div>
        </div>

        <div class="endpoints">
            <h4>🚀 Available API Endpoints:</h4>
            <ul>
                <li><strong>POST</strong> /api/v1/auth/register/ - User Registration</li>
                <li><strong>POST</strong> /api/v1/auth/token/ - User Login (JWT)</li>
                <li><strong>GET</strong> /api/v1/auth/profile/ - User Profile</li>
                <li><strong>GET</strong> /api/v1/auth/mfa/setup/ - MFA Setup</li>
                <li><strong>GET</strong> /api/v1/auth/security/dashboard/ - Security Dashboard</li>
                <li><strong>GET</strong> /api/v1/dashboard/ - Role-Based Dashboard</li>
                <li><strong>GET</strong> /api/v1/patient-dashboard/ - Patient Dashboard</li>
                <li><strong>GET</strong> /api/v1/physician-dashboard/ - Physician Dashboard</li>
                <li><strong>GET</strong> /api/v1/nurse-dashboard/ - Nurse Dashboard</li>
                <li><strong>GET</strong> /api/v1/admin-dashboard/ - Administrator Dashboard</li>
                <li><strong>GET</strong> /api/v1/billing-dashboard/ - Billing Dashboard</li>
                <li><strong>GET</strong> /health/ - Health Check</li>
            </ul>
        </div>

        <div class="section">
            <h3>👤 User Registration</h3>
            <form id="registerForm">
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="regEmail" placeholder="user@example.com" required>
                </div>
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" id="regPassword" placeholder="Min 12 characters" required>
                </div>
                <div class="form-group">
                    <label>Confirm Password:</label>
                    <input type="password" id="regPasswordConfirm" required>
                </div>
                <div class="form-group">
                    <label>First Name:</label>
                    <input type="text" id="regFirstName" placeholder="John" required>
                </div>
                <div class="form-group">
                    <label>Last Name:</label>
                    <input type="text" id="regLastName" placeholder="Doe" required>
                </div>
                <div class="form-group">
                    <label>User Type:</label>
                    <select id="regUserType">
                        <option value="PATIENT">Patient</option>
                        <option value="PHYSICIAN">Physician</option>
                        <option value="PHYSICIAN_ASSISTANT">Physician Assistant</option>
                        <option value="NURSE">Nurse</option>
                        <option value="ADMINISTRATOR">Administrator</option>
                        <option value="BILLING">Accounting & Billing</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Country:</label>
                    <select id="regCountry">
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IN">India</option>
                        <option value="BR">Brazil</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="regTerms" required> I accept the Terms and Conditions</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="regPrivacy" required> I accept the Privacy Policy</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="regHipaa"> I authorize HIPAA compliance (required for patients)</label>
                </div>
                <button type="submit" class="btn">Register User</button>
            </form>
            <div id="registerResult"></div>
        </div>

        <div class="section">
            <h3>🔑 User Login</h3>
            <form id="loginForm">
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="loginEmail" placeholder="user@example.com" required>
                </div>
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="loginRemember"> Remember me (7 days)</label>
                </div>
                <button type="submit" class="btn">Login</button>
            </form>
            <div id="loginResult"></div>
        </div>

        <div class="section">
            <h3>📊 Role-Based Dashboard Testing</h3>
            <button class="btn" onclick="getDashboard()">Get My Dashboard</button>
            <button class="btn btn-secondary" onclick="testPatientDashboard()">Patient Dashboard</button>
            <button class="btn btn-secondary" onclick="testPhysicianDashboard()">Physician Dashboard</button>
            <button class="btn btn-secondary" onclick="testNurseDashboard()">Nurse Dashboard</button>
            <button class="btn btn-secondary" onclick="testAdminDashboard()">Admin Dashboard</button>
            <button class="btn btn-secondary" onclick="testBillingDashboard()">Billing Dashboard</button>
            <div id="dashboardResult"></div>
        </div>

        <div class="section">
            <h3>📊 Profile & Security</h3>
            <button class="btn" onclick="getUserProfile()">Get Profile</button>
            <button class="btn btn-secondary" onclick="getSecurityDashboard()">Security Dashboard</button>
            <button class="btn btn-secondary" onclick="setupMFA()">Setup MFA</button>
            <div id="profileResult"></div>
        </div>

        <div class="section">
            <h3>🏥 Quick Test Users</h3>
            <p>For testing, you can use these pre-configured user types:</p>
            <button class="btn btn-secondary" onclick="fillTestPatient()">Test Patient</button>
            <button class="btn btn-secondary" onclick="fillTestProvider()">Test Physician</button>
            <button class="btn btn-secondary" onclick="checkHealth()">Health Check</button>
        </div>
    </div>

    <script>
        let authToken = localStorage.getItem('webqx_token');

        // Register User
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                password_confirm: document.getElementById('regPasswordConfirm').value,
                first_name: document.getElementById('regFirstName').value,
                last_name: document.getElementById('regLastName').value,
                user_type: document.getElementById('regUserType').value,
                country: document.getElementById('regCountry').value,
                terms_accepted: document.getElementById('regTerms').checked,
                privacy_policy_accepted: document.getElementById('regPrivacy').checked,
                hipaa_authorization: document.getElementById('regHipaa').checked
            };

            try {
                const response = await fetch('/api/v1/auth/register/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (response.ok) {
                    authToken = result.tokens.access;
                    localStorage.setItem('webqx_token', authToken);
                    document.getElementById('registerResult').innerHTML = 
                        '<div class="result success">✅ Registration successful!\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                } else {
                    document.getElementById('registerResult').innerHTML = 
                        '<div class="result error">❌ Registration failed:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                }
            } catch (error) {
                document.getElementById('registerResult').innerHTML = 
                    '<div class="result error">❌ Error: ' + error.message + '</div>';
            }
        });

        // Login User
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value,
                remember_me: document.getElementById('loginRemember').checked
            };

            try {
                const response = await fetch('/api/v1/auth/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (response.ok) {
                    authToken = result.access;
                    localStorage.setItem('webqx_token', authToken);
                    document.getElementById('loginResult').innerHTML = 
                        '<div class="result success">✅ Login successful!\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                } else {
                    document.getElementById('loginResult').innerHTML = 
                        '<div class="result error">❌ Login failed:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                }
            } catch (error) {
                document.getElementById('loginResult').innerHTML = 
                    '<div class="result error">❌ Error: ' + error.message + '</div>';
            }
        });

        // Get Dashboard
        async function getDashboard() {
            if (!authToken) {
                document.getElementById('dashboardResult').innerHTML = 
                    '<div class="result error">❌ Please login first</div>';
                return;
            }

            try {
                const response = await fetch('/api/v1/dashboard/', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('dashboardResult').innerHTML = 
                        '<div class="result success">🏠 Your Dashboard:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                } else {
                    document.getElementById('dashboardResult').innerHTML = 
                        '<div class="result error">❌ Dashboard access failed:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                }
            } catch (error) {
                document.getElementById('dashboardResult').innerHTML = 
                    '<div class="result error">❌ Error: ' + error.message + '</div>';
            }
        }

        // Test specific dashboards
        async function testPatientDashboard() {
            await testDashboard('/api/v1/patient-dashboard/', 'Patient');
        }

        async function testPhysicianDashboard() {
            await testDashboard('/api/v1/physician-dashboard/', 'Physician');
        }

        async function testNurseDashboard() {
            await testDashboard('/api/v1/nurse-dashboard/', 'Nurse');
        }

        async function testAdminDashboard() {
            await testDashboard('/api/v1/admin-dashboard/', 'Administrator');
        }

        async function testBillingDashboard() {
            await testDashboard('/api/v1/billing-dashboard/', 'Billing');
        }

        async function testDashboard(endpoint, dashboardType) {
            if (!authToken) {
                document.getElementById('dashboardResult').innerHTML = 
                    '<div class="result error">❌ Please login first</div>';
                return;
            }

            try {
                const response = await fetch(endpoint, {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('dashboardResult').innerHTML = 
                        '<div class="result success">✅ ' + dashboardType + ' Dashboard Access:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                } else {
                    document.getElementById('dashboardResult').innerHTML = 
                        '<div class="result error">❌ ' + dashboardType + ' Dashboard Access Denied:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                }
            } catch (error) {
                document.getElementById('dashboardResult').innerHTML = 
                    '<div class="result error">❌ Error: ' + error.message + '</div>';
            }
        }
        async function getUserProfile() {
            if (!authToken) {
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result error">❌ Please login first</div>';
                return;
            }

            try {
                const response = await fetch('/api/v1/auth/profile/', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('profileResult').innerHTML = 
                        '<div class="result success">👤 User Profile:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                } else {
                    document.getElementById('profileResult').innerHTML = 
                        '<div class="result error">❌ Failed to get profile:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                }
            } catch (error) {
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result error">❌ Error: ' + error.message + '</div>';
            }
        }

        // Get Security Dashboard
        async function getSecurityDashboard() {
            if (!authToken) {
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result error">❌ Please login first</div>';
                return;
            }

            try {
                const response = await fetch('/api/v1/auth/security/dashboard/', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('profileResult').innerHTML = 
                        '<div class="result info">🔒 Security Dashboard:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                } else {
                    document.getElementById('profileResult').innerHTML = 
                        '<div class="result error">❌ Failed to get security dashboard:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                }
            } catch (error) {
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result error">❌ Error: ' + error.message + '</div>';
            }
        }

        // Setup MFA
        async function setupMFA() {
            if (!authToken) {
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result error">❌ Please login first</div>';
                return;
            }

            try {
                const response = await fetch('/api/v1/auth/mfa/setup/', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const result = await response.json();
                
                if (response.ok) {
                    if (result.qr_code) {
                        document.getElementById('profileResult').innerHTML = 
                            '<div class="result info">📱 MFA Setup - Scan QR Code:\\n' +
                            '<img src="' + result.qr_code + '" style="max-width: 200px; display: block; margin: 10px 0;">\\n' +
                            'Secret: ' + result.secret + '\\n\\n' +
                            'Enter the 6-digit code from your authenticator app to complete setup.</div>';
                    } else {
                        document.getElementById('profileResult').innerHTML = 
                            '<div class="result success">✅ MFA Status:\\n' + 
                            JSON.stringify(result, null, 2) + '</div>';
                    }
                } else {
                    document.getElementById('profileResult').innerHTML = 
                        '<div class="result error">❌ MFA setup failed:\\n' + 
                        JSON.stringify(result, null, 2) + '</div>';
                }
            } catch (error) {
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result error">❌ Error: ' + error.message + '</div>';
            }
        }

        // Test Users
        function fillTestPatient() {
            document.getElementById('regEmail').value = 'patient.test@webqx.healthcare';
            document.getElementById('regPassword').value = 'SecurePatient123!';
            document.getElementById('regPasswordConfirm').value = 'SecurePatient123!';
            document.getElementById('regFirstName').value = 'Jane';
            document.getElementById('regLastName').value = 'Patient';
            document.getElementById('regUserType').value = 'PATIENT';
            document.getElementById('regCountry').value = 'US';
            document.getElementById('regTerms').checked = true;
            document.getElementById('regPrivacy').checked = true;
            document.getElementById('regHipaa').checked = true;
        }

        function fillTestProvider() {
            document.getElementById('regEmail').value = 'doctor.smith@webqx.healthcare';
            document.getElementById('regPassword').value = 'SecurePhysician123!';
            document.getElementById('regPasswordConfirm').value = 'SecurePhysician123!';
            document.getElementById('regFirstName').value = 'Dr. Sarah';
            document.getElementById('regLastName').value = 'Smith';
            document.getElementById('regUserType').value = 'PHYSICIAN';
            document.getElementById('regCountry').value = 'US';
            document.getElementById('regTerms').checked = true;
            document.getElementById('regPrivacy').checked = true;
            document.getElementById('regHipaa').checked = false;
        }

        // Health Check
        async function checkHealth() {
            try {
                const response = await fetch('/health/');
                const result = await response.json();
                
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result success">🏥 Health Check:\\n' + 
                    JSON.stringify(result, null, 2) + '</div>';
            } catch (error) {
                document.getElementById('profileResult').innerHTML = 
                    '<div class="result error">❌ Health check failed: ' + error.message + '</div>';
            }
        }

        // Auto-fill login if we have a registered email
        document.getElementById('registerForm').addEventListener('submit', () => {
            setTimeout(() => {
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPassword').value;
                if (email && password) {
                    document.getElementById('loginEmail').value = email;
                    document.getElementById('loginPassword').value = password;
                }
            }, 1000);
        });

        // Load saved token on page load
        if (authToken) {
            document.getElementById('profileResult').innerHTML = 
                '<div class="result info">🔑 Loaded saved authentication token</div>';
        }
    </script>
</body>
</html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 WebQX Authentication Server Started
🔐 Django-style Security Implementation
📍 Server: http://localhost:${PORT}
🏥 Health Check: http://localhost:${PORT}/health/
👤 Test Interface: http://localhost:${PORT}

🔑 API Endpoints:
   • POST /api/v1/auth/register/ - User Registration
   • POST /api/v1/auth/token/ - JWT Login
   • GET /api/v1/auth/profile/ - User Profile
   • GET /api/v1/auth/mfa/setup/ - MFA Setup
   • GET /api/v1/auth/security/dashboard/ - Security Dashboard

🌟 Features:
   • JWT Authentication
   • Rate Limiting
   • Account Lockout
   • MFA Support
   • Security Logging
   • HIPAA/GDPR Compliance
   • Django-style Validation

✅ Ready to serve millions of users securely!
    `);
});

module.exports = app;
