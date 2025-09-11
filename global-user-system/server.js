const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://webqx.github.io', 'https://*.webqx.healthcare'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000']
}));

// Rate limiting for registration
const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 registration requests per windowMs
    message: {
        error: 'Too many registration attempts',
        message: 'Please wait 15 minutes before trying again'
    }
});

// Rate limiting for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: {
        error: 'Too many login attempts',
        message: 'Please wait 15 minutes before trying again'
    }
});

app.use(express.json({ limit: '10mb' }));

// Database configuration for global scale
const dbConfig = {
    host: process.env.DB_HOST || 'webqx-global-production.cluster-xyz.us-east-1.rds.amazonaws.com',
    user: process.env.DB_USER || 'webqx_admin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'webqx_global_production',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionLimit: 100,
    acquireTimeout: 60000,
    timeout: 60000
};

// Create connection pool for high performance
const pool = mysql.createPool(dbConfig);

// Email configuration for real user verification
const emailTransporter = nodemailer.createTransporter({
    service: 'SendGrid', // Or AWS SES for production
    auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD
    }
});

// Utility functions
const generateGlobalPatientId = (countryCode) => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `WXQ-${countryCode}-${timestamp}-${random}`;
};

const validateUserData = (userData) => {
    const errors = [];
    
    if (!userData.email || !validator.isEmail(userData.email)) {
        errors.push('Valid email address is required');
    }
    
    if (!userData.firstName || userData.firstName.length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    
    if (!userData.lastName || userData.lastName.length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    
    if (!userData.dateOfBirth || !validator.isDate(userData.dateOfBirth)) {
        errors.push('Valid date of birth is required');
    }
    
    if (!userData.gender || !['M', 'F', 'O', 'U'].includes(userData.gender)) {
        errors.push('Valid gender is required (M, F, O, U)');
    }
    
    if (!userData.countryCode || userData.countryCode.length !== 2) {
        errors.push('Valid 2-letter country code is required');
    }
    
    if (!userData.phone || !validator.isMobilePhone(userData.phone)) {
        errors.push('Valid phone number is required');
    }
    
    if (!userData.password || userData.password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    
    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (userData.password && !passwordRegex.test(userData.password)) {
        errors.push('Password must contain uppercase, lowercase, number, and special character');
    }
    
    return errors;
};

const sendVerificationEmail = async (email, globalPatientId, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&id=${globalPatientId}`;
    
    const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@webqx.healthcare',
        to: email,
        subject: 'Welcome to WebQX Global Healthcare Platform - Verify Your Account',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Welcome to WebQX Healthcare</h1>
                        <p>The World's Largest Free Healthcare Platform</p>
                    </div>
                    <div class="content">
                        <h2>Hello! Welcome to the Future of Healthcare</h2>
                        <p>Thank you for joining our global healthcare community! You're now part of a revolutionary platform serving millions of users worldwide.</p>
                        
                        <p><strong>Your Global Patient ID:</strong> <code>${globalPatientId}</code></p>
                        
                        <p>To complete your registration and start accessing free healthcare services, please verify your email address:</p>
                        
                        <div style="text-align: center;">
                            <a href="${verificationUrl}" class="button">Verify Email Address</a>
                        </div>
                        
                        <h3>What's Next?</h3>
                        <ul>
                            <li>✅ Complete your health profile</li>
                            <li>🔍 Find healthcare providers in your area</li>
                            <li>📅 Schedule your first appointment</li>
                            <li>💊 Manage your medications</li>
                            <li>📊 Track your health metrics</li>
                        </ul>
                        
                        <p><strong>Security Note:</strong> This verification link expires in 24 hours for your security.</p>
                    </div>
                    <div class="footer">
                        <p>WebQX Global Healthcare Platform | Serving Millions Worldwide</p>
                        <p>If you didn't create this account, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    return await emailTransporter.sendMail(mailOptions);
};

const logAnalytics = async (metricName, metricValue, countryCode, region = null) => {
    try {
        await pool.execute(`
            INSERT INTO platform_analytics (metric_name, metric_value, country_code, region)
            VALUES (?, ?, ?, ?)
        `, [metricName, metricValue, countryCode, region]);
    } catch (error) {
        console.error('Analytics logging error:', error);
    }
};

// =============================================================================
// REAL USER REGISTRATION ENDPOINT
// =============================================================================
app.post('/api/v1/register', registrationLimiter, async (req, res) => {
    let connection;
    
    try {
        const userData = req.body;
        
        // Validate input data
        const validationErrors = validateUserData(userData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors
            });
        }
        
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT user_id FROM global_users WHERE email = ? OR phone = ?',
            [userData.email, userData.phone]
        );
        
        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'An account with this email or phone already exists. Please login or reset your password.'
            });
        }
        
        // Generate unique identifiers
        const globalPatientId = generateGlobalPatientId(userData.countryCode);
        const verificationToken = uuidv4();
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Insert new user
        const [insertResult] = await connection.execute(`
            INSERT INTO global_users (
                global_patient_id, email, phone, first_name, last_name,
                date_of_birth, gender, country_code, timezone, preferred_language,
                emergency_contact_name, emergency_contact_phone, password_hash,
                email_verification_token, gdpr_consent, hipaa_consent, data_sharing_consent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            globalPatientId,
            userData.email.toLowerCase(),
            userData.phone,
            userData.firstName,
            userData.lastName,
            userData.dateOfBirth,
            userData.gender,
            userData.countryCode.toUpperCase(),
            userData.timezone || 'UTC',
            userData.preferredLanguage || 'en',
            userData.emergencyContactName || null,
            userData.emergencyContactPhone || null,
            hashedPassword,
            verificationToken,
            userData.gdprConsent || false,
            userData.hipaaConsent || false,
            userData.dataSharing || false
        ]);
        
        const userId = insertResult.insertId;
        
        // Send verification email
        await sendVerificationEmail(userData.email, globalPatientId, verificationToken);
        
        // Log analytics
        await logAnalytics('user_registration', 1, userData.countryCode);
        await logAnalytics('new_patient_signup', 1, userData.countryCode);
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                globalPatientId,
                userId,
                email: userData.email,
                nextSteps: [
                    'Check your email for verification link',
                    'Complete your health profile after verification',
                    'Explore healthcare providers in your area',
                    'Schedule your first appointment'
                ]
            }
        });
        
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        
        console.error('Registration error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: 'An internal error occurred. Please try again later.',
            requestId: uuidv4() // For support tracking
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// =============================================================================
// EMAIL VERIFICATION ENDPOINT
// =============================================================================
app.post('/api/v1/verify-email', async (req, res) => {
    try {
        const { token, globalPatientId } = req.body;
        
        if (!token || !globalPatientId) {
            return res.status(400).json({
                success: false,
                error: 'Token and Patient ID are required'
            });
        }
        
        const [users] = await pool.execute(`
            SELECT user_id, email, is_email_verified, email_verification_token
            FROM global_users 
            WHERE global_patient_id = ? AND email_verification_token = ?
        `, [globalPatientId, token]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Invalid verification token or patient ID'
            });
        }
        
        const user = users[0];
        
        if (user.is_email_verified) {
            return res.status(200).json({
                success: true,
                message: 'Email already verified',
                alreadyVerified: true
            });
        }
        
        // Update user as verified
        await pool.execute(`
            UPDATE global_users 
            SET is_email_verified = TRUE, 
                email_verification_token = NULL,
                email_verified_at = NOW(),
                updated_at = NOW()
            WHERE user_id = ?
        `, [user.user_id]);
        
        // Log analytics
        await logAnalytics('email_verification', 1, null);
        
        res.json({
            success: true,
            message: 'Email verified successfully! You can now access all platform features.',
            data: {
                globalPatientId,
                email: user.email,
                nextSteps: [
                    'Complete your health profile',
                    'Find healthcare providers',
                    'Schedule your first appointment'
                ]
            }
        });
        
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: 'Please try again later'
        });
    }
});

// =============================================================================
// USER LOGIN ENDPOINT
// =============================================================================
app.post('/api/v1/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        
        // Get user from database
        const [users] = await pool.execute(`
            SELECT user_id, global_patient_id, email, password_hash, 
                   first_name, last_name, is_email_verified, is_active,
                   country_code, preferred_language, last_login_at
            FROM global_users 
            WHERE email = ?
        `, [email.toLowerCase()]);
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        const user = users[0];
        
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'Account deactivated',
                message: 'Please contact support for assistance'
            });
        }
        
        if (!user.is_email_verified) {
            return res.status(403).json({
                success: false,
                error: 'Email not verified',
                message: 'Please verify your email address before logging in'
            });
        }
        
        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                globalPatientId: user.global_patient_id,
                email: user.email
            },
            process.env.JWT_SECRET || 'webqx-global-healthcare-secret',
            { expiresIn: '24h' }
        );
        
        // Update last login
        await pool.execute(`
            UPDATE global_users 
            SET last_login_at = NOW(), updated_at = NOW()
            WHERE user_id = ?
        `, [user.user_id]);
        
        // Log analytics
        await logAnalytics('user_login', 1, user.country_code);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    globalPatientId: user.global_patient_id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    countryCode: user.country_code,
                    preferredLanguage: user.preferred_language
                }
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: 'Please try again later'
        });
    }
});

// =============================================================================
// GLOBAL PLATFORM ANALYTICS ENDPOINT
// =============================================================================
app.get('/api/v1/analytics/global', async (req, res) => {
    try {
        // Get total users
        const [totalUsers] = await pool.execute(`
            SELECT COUNT(*) as total_users 
            FROM global_users 
            WHERE is_active = TRUE
        `);
        
        // Get users by country
        const [usersByCountry] = await pool.execute(`
            SELECT country_code, COUNT(*) as user_count
            FROM global_users 
            WHERE is_active = TRUE
            GROUP BY country_code
            ORDER BY user_count DESC
            LIMIT 10
        `);
        
        // Get recent registrations (last 7 days)
        const [recentRegistrations] = await pool.execute(`
            SELECT DATE(created_at) as date, COUNT(*) as registrations
            FROM global_users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        
        // Get platform metrics
        const [platformMetrics] = await pool.execute(`
            SELECT metric_name, SUM(metric_value) as total_value
            FROM platform_analytics
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY metric_name
        `);
        
        res.json({
            success: true,
            data: {
                totalUsers: totalUsers[0].total_users,
                usersByCountry,
                recentRegistrations,
                platformMetrics,
                lastUpdated: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Analytics data unavailable'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'WebQX Global User Registration',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🌍 WebQX Global User Registration Server
========================================
🚀 Server running on port ${PORT}
🔗 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${dbConfig.host}
🌐 Ready to serve millions of users globally!
========================================
    `);
});

module.exports = app;
