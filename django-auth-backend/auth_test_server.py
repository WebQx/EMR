# WebQX Authentication Test Server
# Simple Flask-based authentication API for testing

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import secrets
import pyotp
import qrcode
import io
import base64
import re
import json
import logging

app = Flask(__name__)
app.secret_key = 'test-secret-key-change-in-production'
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory storage for demo (use database in production)
users_db = {}
sessions_db = {}
mfa_secrets = {}
login_attempts = {}

# JWT Configuration
JWT_SECRET = 'webqx-jwt-secret-key'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Security settings
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 900  # 15 minutes

def generate_jwt_token(user_data):
    """Generate JWT token for authenticated user"""
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'user_type': user_data['user_type'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.utcnow(),
        'iss': 'webqx.healthcare'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"

def check_rate_limit(ip_address, action):
    """Check if IP is rate limited for specific action"""
    key = f"{ip_address}:{action}"
    current_time = datetime.datetime.utcnow()
    
    if key not in login_attempts:
        login_attempts[key] = []
    
    # Remove attempts older than lockout duration
    login_attempts[key] = [
        attempt for attempt in login_attempts[key]
        if (current_time - attempt).seconds < LOCKOUT_DURATION
    ]
    
    if len(login_attempts[key]) >= MAX_LOGIN_ATTEMPTS:
        return False, f"Too many attempts. Try again in {LOCKOUT_DURATION // 60} minutes."
    
    return True, "OK"

def log_security_event(user_id, event_type, ip_address, description):
    """Log security events"""
    logger.warning(f"SECURITY EVENT - User: {user_id}, Type: {event_type}, IP: {ip_address}, Description: {description}")

@app.route('/health/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'service': 'WebQX Authentication API'
    })

@app.route('/api/v1/auth/register/', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        ip_address = request.remote_addr
        
        # Rate limiting check
        rate_ok, rate_msg = check_rate_limit(ip_address, 'register')
        if not rate_ok:
            return jsonify({'error': rate_msg}), 429
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'user_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if email in users_db:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        # Validate password
        password_valid, password_msg = validate_password(password)
        if not password_valid:
            return jsonify({'error': password_msg}), 400
        
        # Validate user type
        allowed_types = ['PATIENT', 'PROVIDER', 'PHARMACY', 'ADMIN']
        if data['user_type'] not in allowed_types:
            return jsonify({'error': 'Invalid user type'}), 400
        
        # Create user
        user_id = secrets.token_urlsafe(16)
        user_data = {
            'id': user_id,
            'email': email,
            'password_hash': generate_password_hash(password),
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'user_type': data['user_type'],
            'phone_number': data.get('phone_number', ''),
            'country': data.get('country', ''),
            'is_active': True,
            'email_verified': False,
            'mfa_enabled': False,
            'created_at': datetime.datetime.utcnow().isoformat(),
            'last_login': None,
            'failed_login_attempts': 0
        }
        
        users_db[email] = user_data
        
        # Generate JWT token
        token = generate_jwt_token(user_data)
        
        # Log registration
        logger.info(f"New user registered: {email} from {ip_address}")
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': {
                'id': user_id,
                'email': email,
                'full_name': f"{data['first_name']} {data['last_name']}",
                'user_type': data['user_type'],
                'email_verified': False,
                'mfa_enabled': False
            },
            'token': token
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/v1/auth/login/', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        ip_address = request.remote_addr
        
        # Rate limiting check
        rate_ok, rate_msg = check_rate_limit(ip_address, 'login')
        if not rate_ok:
            return jsonify({'error': rate_msg}), 429
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Check if user exists
        if email not in users_db:
            # Log failed attempt
            login_attempts.setdefault(f"{ip_address}:login", []).append(datetime.datetime.utcnow())
            log_security_event(None, 'FAILED_LOGIN', ip_address, f'Login attempt for non-existent user: {email}')
            return jsonify({'error': 'Invalid credentials'}), 401
        
        user_data = users_db[email]
        
        # Check if account is active
        if not user_data['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Verify password
        if not check_password_hash(user_data['password_hash'], password):
            # Increment failed attempts
            user_data['failed_login_attempts'] += 1
            login_attempts.setdefault(f"{ip_address}:login", []).append(datetime.datetime.utcnow())
            
            log_security_event(user_data['id'], 'FAILED_LOGIN', ip_address, 'Invalid password')
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Reset failed attempts on successful login
        user_data['failed_login_attempts'] = 0
        user_data['last_login'] = datetime.datetime.utcnow().isoformat()
        
        # Generate JWT token
        token = generate_jwt_token(user_data)
        
        # Create session
        session_id = secrets.token_urlsafe(32)
        sessions_db[session_id] = {
            'user_id': user_data['id'],
            'ip_address': ip_address,
            'created_at': datetime.datetime.utcnow().isoformat(),
            'last_activity': datetime.datetime.utcnow().isoformat()
        }
        
        logger.info(f"Successful login: {email} from {ip_address}")
        
        response_data = {
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user_data['id'],
                'email': user_data['email'],
                'full_name': f"{user_data['first_name']} {user_data['last_name']}",
                'user_type': user_data['user_type'],
                'email_verified': user_data['email_verified'],
                'mfa_enabled': user_data['mfa_enabled']
            },
            'token': token,
            'session_id': session_id
        }
        
        # Check if MFA is required
        if user_data['mfa_enabled']:
            response_data['mfa_required'] = True
            response_data['message'] = 'MFA verification required'
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/v1/auth/profile/', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        user_email = payload['email']
        if user_email not in users_db:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = users_db[user_email]
        
        return jsonify({
            'user': {
                'id': user_data['id'],
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'full_name': f"{user_data['first_name']} {user_data['last_name']}",
                'user_type': user_data['user_type'],
                'phone_number': user_data['phone_number'],
                'country': user_data['country'],
                'email_verified': user_data['email_verified'],
                'mfa_enabled': user_data['mfa_enabled'],
                'created_at': user_data['created_at'],
                'last_login': user_data['last_login']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@app.route('/api/v1/auth/mfa/setup/', methods=['GET', 'POST'])
def mfa_setup():
    """Setup MFA for user"""
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        user_email = payload['email']
        if user_email not in users_db:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = users_db[user_email]
        
        if request.method == 'GET':
            # Generate QR code for TOTP setup
            if not user_data['mfa_enabled']:
                secret = pyotp.random_base32()
                totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                    name=user_email,
                    issuer_name="WebQX Healthcare"
                )
                
                # Generate QR code
                qr = qrcode.QRCode(version=1, box_size=10, border=5)
                qr.add_data(totp_uri)
                qr.make(fit=True)
                
                img = qr.make_image(fill_color="black", back_color="white")
                buffer = io.BytesIO()
                img.save(buffer, format='PNG')
                qr_code_image = base64.b64encode(buffer.getvalue()).decode()
                
                # Store secret temporarily
                mfa_secrets[user_data['id']] = secret
                
                return jsonify({
                    'qr_code': f'data:image/png;base64,{qr_code_image}',
                    'secret': secret,
                    'setup_complete': False
                }), 200
            else:
                return jsonify({
                    'message': 'MFA is already enabled',
                    'setup_complete': True
                }), 200
        
        elif request.method == 'POST':
            # Verify TOTP token and enable MFA
            data = request.get_json()
            token_code = data.get('token')
            secret = mfa_secrets.get(user_data['id'])
            
            if not secret:
                return jsonify({'error': 'MFA setup session expired'}), 400
            
            totp = pyotp.TOTP(secret)
            if totp.verify(token_code, valid_window=2):
                # Enable MFA
                user_data['mfa_enabled'] = True
                user_data['mfa_secret'] = secret
                
                # Generate backup codes
                backup_codes = [secrets.token_hex(4) for _ in range(8)]
                user_data['backup_codes'] = backup_codes
                
                # Clean up temporary secret
                del mfa_secrets[user_data['id']]
                
                logger.info(f"MFA enabled for user: {user_email}")
                
                return jsonify({
                    'message': 'MFA setup complete',
                    'backup_codes': backup_codes,
                    'setup_complete': True
                }), 200
            else:
                return jsonify({'error': 'Invalid token'}), 400
                
    except Exception as e:
        logger.error(f"MFA setup error: {str(e)}")
        return jsonify({'error': 'MFA setup failed'}), 500

@app.route('/api/v1/auth/sessions/', methods=['GET'])
def get_sessions():
    """Get user active sessions"""
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        user_id = payload['user_id']
        user_sessions = []
        
        for session_id, session_data in sessions_db.items():
            if session_data['user_id'] == user_id:
                user_sessions.append({
                    'session_id': session_id[:8] + '...',
                    'ip_address': session_data['ip_address'],
                    'created_at': session_data['created_at'],
                    'last_activity': session_data['last_activity']
                })
        
        return jsonify({'sessions': user_sessions}), 200
        
    except Exception as e:
        logger.error(f"Sessions error: {str(e)}")
        return jsonify({'error': 'Failed to get sessions'}), 500

@app.route('/api/v1/auth/dashboard/', methods=['GET'])
def dashboard():
    """Get authentication dashboard stats"""
    try:
        total_users = len(users_db)
        active_sessions = len(sessions_db)
        mfa_enabled_users = sum(1 for user in users_db.values() if user['mfa_enabled'])
        
        # Recent registrations (last 24 hours)
        recent_registrations = 0
        cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
        
        for user in users_db.values():
            user_created = datetime.datetime.fromisoformat(user['created_at'])
            if user_created > cutoff_time:
                recent_registrations += 1
        
        return jsonify({
            'stats': {
                'total_users': total_users,
                'active_sessions': active_sessions,
                'mfa_enabled_users': mfa_enabled_users,
                'recent_registrations': recent_registrations,
                'mfa_adoption_rate': f"{(mfa_enabled_users / max(total_users, 1)) * 100:.1f}%"
            },
            'recent_users': [
                {
                    'email': user['email'],
                    'user_type': user['user_type'],
                    'created_at': user['created_at'],
                    'mfa_enabled': user['mfa_enabled']
                }
                for user in sorted(users_db.values(), 
                                 key=lambda x: x['created_at'], 
                                 reverse=True)[:5]
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({'error': 'Failed to get dashboard data'}), 500

if __name__ == '__main__':
    # Create some demo users
    demo_users = [
        {
            'email': 'admin@webqx.healthcare',
            'password': 'WebQxAdmin2024!',
            'first_name': 'WebQX',
            'last_name': 'Administrator',
            'user_type': 'ADMIN'
        },
        {
            'email': 'doctor@webqx.healthcare',
            'password': 'DoctorDemo2024!',
            'first_name': 'Dr. Sarah',
            'last_name': 'Johnson',
            'user_type': 'PROVIDER'
        },
        {
            'email': 'patient@webqx.healthcare',
            'password': 'PatientDemo2024!',
            'first_name': 'John',
            'last_name': 'Smith',
            'user_type': 'PATIENT'
        }
    ]
    
    for demo_user in demo_users:
        email = demo_user['email']
        if email not in users_db:
            user_id = secrets.token_urlsafe(16)
            users_db[email] = {
                'id': user_id,
                'email': email,
                'password_hash': generate_password_hash(demo_user['password']),
                'first_name': demo_user['first_name'],
                'last_name': demo_user['last_name'],
                'user_type': demo_user['user_type'],
                'phone_number': '',
                'country': 'US',
                'is_active': True,
                'email_verified': True,
                'mfa_enabled': False,
                'created_at': datetime.datetime.utcnow().isoformat(),
                'last_login': None,
                'failed_login_attempts': 0
            }
    
    print("🚀 WebQX Authentication API Server Starting...")
    print("🔐 Demo users created:")
    for user in demo_users:
        print(f"   • {user['email']} ({user['user_type']}) - Password: {user['password']}")
    print("")
    print("📱 API Endpoints:")
    print("   • POST /api/v1/auth/register/ - User registration")
    print("   • POST /api/v1/auth/login/ - User login")
    print("   • GET /api/v1/auth/profile/ - User profile")
    print("   • GET/POST /api/v1/auth/mfa/setup/ - MFA setup")
    print("   • GET /api/v1/auth/sessions/ - Active sessions")
    print("   • GET /api/v1/auth/dashboard/ - Dashboard stats")
    print("   • GET /health/ - Health check")
    print("")
    print("🌐 Server running at: http://localhost:8001")
    print("🔑 Ready to authenticate millions of users securely!")
    
    app.run(host='0.0.0.0', port=8001, debug=True)
