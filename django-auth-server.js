/**
 * WebQX™ Django-Style Authentication Server
 * 
 * Django-inspired authentication server with JWT tokens, user management,
 * security features, and HIPAA compliance for healthcare applications
 * 
 * Features:
 * - JWT authentication
 * - User registration and management
 * - Role-based access control
 * - Account security (lockout, rate limiting)
 * - Multi-factor authentication (MFA)
 * - HIPAA audit logging
 * - Session management
 * 
 * @author WebQX Health
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class DjangoAuthServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        
        // Configuration
        this.config = {
            jwt: {
                secret: process.env.JWT_SECRET || 'webqx-demo-secret-change-in-production',
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
            },
            security: {
                maxLoginAttempts: 5,
                lockoutTime: 15 * 60 * 1000, // 15 minutes
                passwordMinLength: 8,
                requireMFA: process.env.REQUIRE_MFA === 'true',
                sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
            },
            bcrypt: {
                saltRounds: 12
            }
        };

        // In-memory storage (use database in production)
        this.users = new Map();
        this.refreshTokens = new Map();
        this.loginAttempts = new Map();
        this.auditLogs = [];
        this.activeSessions = new Map();
        
        this.initializeServer();
        this.seedDemoUsers();
    }

    /**
     * Initialize the Express server with middleware and routes
     */
    initializeServer() {
        // Security middleware
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    connectSrc: ["'self'", "http://localhost:*"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            credentials: true
        }));

        // Global rate limiting
        const globalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Limit each IP to 1000 requests per windowMs
            message: {
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED'
            }
        });

        // Authentication rate limiting (stricter)
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // Limit each IP to 10 auth requests per windowMs
            message: {
                error: 'Too many authentication attempts',
                code: 'AUTH_RATE_LIMIT_EXCEEDED'
            }
        });

        this.app.use(globalLimiter);
        this.app.use('/api/v1/auth/login', authLimiter);
        this.app.use('/api/v1/auth/register', authLimiter);

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Setup routes
        this.setupRoutes();
        
        console.log('✅ Django Authentication Server initialized');
    }

    /**
     * Setup all API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'WebQX Django Authentication Server',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                features: {
                    jwtAuth: true,
                    userManagement: true,
                    mfaSupported: true,
                    auditLogging: true,
                    sessionManagement: true
                },
                stats: {
                    totalUsers: this.users.size,
                    activeSessions: this.activeSessions.size,
                    auditLogs: this.auditLogs.length
                }
            });
        });

        // Authentication routes
        this.setupAuthRoutes();
        
        // User management routes
        this.setupUserRoutes();
        
        // Security routes
        this.setupSecurityRoutes();
    }

    /**
     * Setup authentication routes
     */
    setupAuthRoutes() {
        // User registration
        this.app.post('/api/v1/auth/register', async (req, res) => {
            try {
                const { username, email, password, firstName, lastName, role = 'patient' } = req.body;

                // Validation
                if (!username || !email || !password) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Username, email, and password are required',
                        code: 'MISSING_FIELDS'
                    });
                }

                if (password.length < this.config.security.passwordMinLength) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: `Password must be at least ${this.config.security.passwordMinLength} characters`,
                        code: 'PASSWORD_TOO_SHORT'
                    });
                }

                // Check if user already exists
                const existingUser = Array.from(this.users.values()).find(
                    u => u.username === username || u.email === email
                );

                if (existingUser) {
                    return res.status(400).json({
                        error: 'Registration Error',
                        message: 'User with this username or email already exists',
                        code: 'USER_EXISTS'
                    });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, this.config.bcrypt.saltRounds);

                // Create user
                const userId = uuidv4();
                const user = {
                    id: userId,
                    username,
                    email,
                    password: hashedPassword,
                    firstName: firstName || '',
                    lastName: lastName || '',
                    role,
                    isActive: true,
                    isVerified: false,
                    mfaEnabled: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastLogin: null,
                    loginAttempts: 0,
                    lockedUntil: null
                };

                this.users.set(userId, user);

                // Generate tokens
                const { accessToken, refreshToken } = this.generateTokens(user);

                // Store refresh token
                this.refreshTokens.set(refreshToken, {
                    userId,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });

                // Create session
                const sessionId = uuidv4();
                this.activeSessions.set(sessionId, {
                    userId,
                    createdAt: new Date().toISOString(),
                    lastActivity: new Date().toISOString(),
                    ipAddress: req.ip
                });

                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    data: {
                        user: this.sanitizeUser(user),
                        accessToken,
                        refreshToken,
                        sessionId
                    }
                });

                this.logAuditEvent('USER_REGISTERED', {
                    userId,
                    username,
                    email,
                    role
                });

            } catch (error) {
                console.error('❌ Registration error:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to register user'
                });
            }
        });

        // User login
        this.app.post('/api/v1/auth/login', async (req, res) => {
            try {
                const { username, password, mfaCode } = req.body;

                if (!username || !password) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Username and password are required',
                        code: 'MISSING_CREDENTIALS'
                    });
                }

                // Find user
                const user = Array.from(this.users.values()).find(
                    u => u.username === username || u.email === username
                );

                if (!user) {
                    return res.status(401).json({
                        error: 'Authentication Failed',
                        message: 'Invalid credentials',
                        code: 'INVALID_CREDENTIALS'
                    });
                }

                // Check if account is locked
                if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
                    return res.status(423).json({
                        error: 'Account Locked',
                        message: 'Account is temporarily locked due to multiple failed login attempts',
                        code: 'ACCOUNT_LOCKED'
                    });
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password);

                if (!isValidPassword) {
                    // Increment login attempts
                    user.loginAttempts = (user.loginAttempts || 0) + 1;

                    if (user.loginAttempts >= this.config.security.maxLoginAttempts) {
                        user.lockedUntil = new Date(Date.now() + this.config.security.lockoutTime).toISOString();
                        this.logAuditEvent('ACCOUNT_LOCKED', { userId: user.id, username });
                    }

                    this.users.set(user.id, user);

                    return res.status(401).json({
                        error: 'Authentication Failed',
                        message: 'Invalid credentials',
                        code: 'INVALID_CREDENTIALS'
                    });
                }

                // Check MFA if enabled
                if (user.mfaEnabled && !mfaCode) {
                    return res.status(200).json({
                        success: false,
                        message: 'MFA code required',
                        requiresMFA: true,
                        code: 'MFA_REQUIRED'
                    });
                }

                if (user.mfaEnabled && mfaCode) {
                    const isValidMFA = this.verifyMFACode(user.id, mfaCode);
                    if (!isValidMFA) {
                        return res.status(401).json({
                            error: 'Authentication Failed',
                            message: 'Invalid MFA code',
                            code: 'INVALID_MFA'
                        });
                    }
                }

                // Reset login attempts
                user.loginAttempts = 0;
                user.lockedUntil = null;
                user.lastLogin = new Date().toISOString();
                this.users.set(user.id, user);

                // Generate tokens
                const { accessToken, refreshToken } = this.generateTokens(user);

                // Store refresh token
                this.refreshTokens.set(refreshToken, {
                    userId: user.id,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });

                // Create session
                const sessionId = uuidv4();
                this.activeSessions.set(sessionId, {
                    userId: user.id,
                    createdAt: new Date().toISOString(),
                    lastActivity: new Date().toISOString(),
                    ipAddress: req.ip
                });

                res.json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: this.sanitizeUser(user),
                        accessToken,
                        refreshToken,
                        sessionId,
                        expiresIn: this.config.jwt.expiresIn
                    }
                });

                this.logAuditEvent('USER_LOGIN', {
                    userId: user.id,
                    username: user.username,
                    ipAddress: req.ip
                });

            } catch (error) {
                console.error('❌ Login error:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to authenticate user'
                });
            }
        });

        // Token refresh
        this.app.post('/api/v1/auth/refresh', (req, res) => {
            try {
                const { refreshToken } = req.body;

                if (!refreshToken) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Refresh token is required'
                    });
                }

                const tokenData = this.refreshTokens.get(refreshToken);

                if (!tokenData || new Date() > new Date(tokenData.expiresAt)) {
                    return res.status(401).json({
                        error: 'Token Error',
                        message: 'Invalid or expired refresh token'
                    });
                }

                const user = this.users.get(tokenData.userId);

                if (!user || !user.isActive) {
                    return res.status(401).json({
                        error: 'User Error',
                        message: 'User not found or inactive'
                    });
                }

                // Generate new tokens
                const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

                // Remove old refresh token and store new one
                this.refreshTokens.delete(refreshToken);
                this.refreshTokens.set(newRefreshToken, {
                    userId: user.id,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });

                res.json({
                    success: true,
                    data: {
                        accessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: this.config.jwt.expiresIn
                    }
                });

            } catch (error) {
                console.error('❌ Token refresh error:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to refresh token'
                });
            }
        });

        // Logout
        this.app.post('/api/v1/auth/logout', this.authenticateToken.bind(this), (req, res) => {
            try {
                const { refreshToken, sessionId } = req.body;

                // Remove refresh token
                if (refreshToken) {
                    this.refreshTokens.delete(refreshToken);
                }

                // Remove session
                if (sessionId) {
                    this.activeSessions.delete(sessionId);
                }

                res.json({
                    success: true,
                    message: 'Logout successful'
                });

                this.logAuditEvent('USER_LOGOUT', {
                    userId: req.user.id,
                    username: req.user.username
                });

            } catch (error) {
                console.error('❌ Logout error:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to logout'
                });
            }
        });
    }

    /**
     * Setup user management routes
     */
    setupUserRoutes() {
        // Get user profile
        this.app.get('/api/v1/auth/profile', this.authenticateToken.bind(this), (req, res) => {
            res.json({
                success: true,
                data: { user: this.sanitizeUser(req.user) }
            });
        });

        // Update user profile
        this.app.put('/api/v1/auth/profile', this.authenticateToken.bind(this), async (req, res) => {
            try {
                const { firstName, lastName, email } = req.body;
                const user = req.user;

                if (firstName) user.firstName = firstName;
                if (lastName) user.lastName = lastName;
                if (email) user.email = email;
                user.updatedAt = new Date().toISOString();

                this.users.set(user.id, user);

                res.json({
                    success: true,
                    message: 'Profile updated successfully',
                    data: { user: this.sanitizeUser(user) }
                });

                this.logAuditEvent('PROFILE_UPDATED', {
                    userId: user.id,
                    changes: { firstName, lastName, email }
                });

            } catch (error) {
                console.error('❌ Profile update error:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to update profile'
                });
            }
        });

        // Change password
        this.app.post('/api/v1/auth/change-password', this.authenticateToken.bind(this), async (req, res) => {
            try {
                const { currentPassword, newPassword } = req.body;

                if (!currentPassword || !newPassword) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Current password and new password are required'
                    });
                }

                const user = req.user;

                // Verify current password
                const isValidPassword = await bcrypt.compare(currentPassword, user.password);

                if (!isValidPassword) {
                    return res.status(401).json({
                        error: 'Authentication Failed',
                        message: 'Current password is incorrect'
                    });
                }

                // Hash new password
                const hashedPassword = await bcrypt.hash(newPassword, this.config.bcrypt.saltRounds);
                user.password = hashedPassword;
                user.updatedAt = new Date().toISOString();

                this.users.set(user.id, user);

                res.json({
                    success: true,
                    message: 'Password changed successfully'
                });

                this.logAuditEvent('PASSWORD_CHANGED', {
                    userId: user.id,
                    username: user.username
                });

            } catch (error) {
                console.error('❌ Password change error:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to change password'
                });
            }
        });
    }

    /**
     * Setup security routes
     */
    setupSecurityRoutes() {
        // Get security dashboard
        this.app.get('/api/v1/auth/security/dashboard', this.authenticateToken.bind(this), (req, res) => {
            const user = req.user;
            const userSessions = Array.from(this.activeSessions.entries())
                .filter(([id, session]) => session.userId === user.id)
                .map(([id, session]) => ({
                    id,
                    createdAt: session.createdAt,
                    lastActivity: session.lastActivity,
                    ipAddress: session.ipAddress
                }));

            res.json({
                success: true,
                data: {
                    user: {
                        mfaEnabled: user.mfaEnabled,
                        lastLogin: user.lastLogin,
                        loginAttempts: user.loginAttempts || 0,
                        accountLocked: user.lockedUntil && new Date() < new Date(user.lockedUntil)
                    },
                    sessions: userSessions,
                    recentActivity: this.auditLogs
                        .filter(log => log.userId === user.id)
                        .slice(-10)
                        .map(log => ({
                            action: log.action,
                            timestamp: log.timestamp,
                            details: log.details
                        }))
                }
            });
        });

        // MFA setup
        this.app.get('/api/v1/auth/mfa/setup', this.authenticateToken.bind(this), (req, res) => {
            const user = req.user;
            
            // Generate MFA secret (simplified for demo)
            const secret = `WEBQX${Math.random().toString(36).substr(2, 16).toUpperCase()}`;
            
            res.json({
                success: true,
                data: {
                    secret,
                    qrCode: `otpauth://totp/WebQX:${user.email}?secret=${secret}&issuer=WebQX`,
                    backupCodes: this.generateBackupCodes()
                }
            });
        });

        // Enable MFA
        this.app.post('/api/v1/auth/mfa/enable', this.authenticateToken.bind(this), (req, res) => {
            try {
                const { code } = req.body;
                const user = req.user;

                // Verify MFA code (simplified for demo)
                if (!code || code.length !== 6) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Valid 6-digit MFA code is required'
                    });
                }

                user.mfaEnabled = true;
                user.updatedAt = new Date().toISOString();
                this.users.set(user.id, user);

                res.json({
                    success: true,
                    message: 'MFA enabled successfully'
                });

                this.logAuditEvent('MFA_ENABLED', {
                    userId: user.id,
                    username: user.username
                });

            } catch (error) {
                console.error('❌ MFA enable error:', error);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Failed to enable MFA'
                });
            }
        });
    }

    /**
     * Authentication middleware
     */
    authenticateToken(req, res, next) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication Required',
                message: 'Valid access token required'
            });
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, this.config.jwt.secret);
            const user = this.users.get(decoded.userId);

            if (!user || !user.isActive) {
                return res.status(401).json({
                    error: 'User Error',
                    message: 'User not found or inactive'
                });
            }

            req.user = user;
            next();

        } catch (error) {
            return res.status(401).json({
                error: 'Token Error',
                message: 'Invalid or expired token'
            });
        }
    }

    /**
     * Generate JWT tokens
     */
    generateTokens(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role
        };

        const accessToken = jwt.sign(payload, this.config.jwt.secret, {
            expiresIn: this.config.jwt.expiresIn
        });

        const refreshToken = jwt.sign(payload, this.config.jwt.secret, {
            expiresIn: this.config.jwt.refreshExpiresIn
        });

        return { accessToken, refreshToken };
    }

    /**
     * Verify MFA code (simplified for demo)
     */
    verifyMFACode(userId, code) {
        // In production, use proper TOTP verification
        return code === '123456'; // Demo code
    }

    /**
     * Generate backup codes
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 8; i++) {
            codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
        }
        return codes;
    }

    /**
     * Sanitize user object for API responses
     */
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    /**
     * Log audit events for HIPAA compliance
     */
    logAuditEvent(action, details) {
        const auditLog = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            action,
            details,
            service: 'authentication',
            userId: details.userId || null
        };
        
        this.auditLogs.push(auditLog);
        console.log('📋 Audit:', JSON.stringify(auditLog));
        
        // Keep only last 1000 audit logs in memory
        if (this.auditLogs.length > 1000) {
            this.auditLogs = this.auditLogs.slice(-1000);
        }
    }

    /**
     * Seed demo users for testing
     */
    async seedDemoUsers() {
        try {
            const demoUsers = [
                {
                    username: 'admin',
                    email: 'admin@webqx.health',
                    password: 'admin123',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin'
                },
                {
                    username: 'provider',
                    email: 'provider@webqx.health',
                    password: 'provider123',
                    firstName: 'Dr. Sarah',
                    lastName: 'Wilson',
                    role: 'provider'
                },
                {
                    username: 'patient',
                    email: 'patient@webqx.health',
                    password: 'patient123',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'patient'
                }
            ];

            for (const userData of demoUsers) {
                const userId = uuidv4();
                const hashedPassword = await bcrypt.hash(userData.password, this.config.bcrypt.saltRounds);
                
                const user = {
                    id: userId,
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    isActive: true,
                    isVerified: true,
                    mfaEnabled: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastLogin: null,
                    loginAttempts: 0,
                    lockedUntil: null
                };

                this.users.set(userId, user);
            }

            console.log('✅ Demo users seeded successfully');

        } catch (error) {
            console.error('❌ Failed to seed demo users:', error);
        }
    }

    /**
     * Start the server
     */
    start() {
        return new Promise((resolve, reject) => {
            const server = this.app.listen(this.port, '0.0.0.0', () => {
                console.log(`🔐 Django Authentication Server started on port ${this.port}`);
                console.log(`   • Health Check: http://localhost:${this.port}/health`);
                console.log(`   • Auth API: http://localhost:${this.port}/api/v1/auth/*`);
                console.log(`   • Demo Users: admin/admin123, provider/provider123, patient/patient123`);
                resolve(server);
            });

            server.on('error', (error) => {
                console.error('❌ Failed to start Django Auth server:', error);
                reject(error);
            });
        });
    }
}

// Start server if called directly
if (require.main === module) {
    const server = new DjangoAuthServer();
    server.start().catch(console.error);
}

module.exports = DjangoAuthServer;