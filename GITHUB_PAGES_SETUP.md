# WebQx Global - GitHub Pages Frontend + Local Backend Setup

## Overview
This setup provides a complete GitHub Pages frontend with local PC backend authentication server for WebQx Global healthcare platform.

## Architecture
- **Frontend**: Hosted on GitHub Pages (public URL)
- **Backend**: Local authentication server on your PC (localhost:3001)
- **Authentication**: OAuth2 (Google, Microsoft) + Email/Password
- **RBAC**: 6 healthcare roles with proper permissions

## Setup Instructions

### 1. Start Local Authentication Server
```bash
cd django-auth-backend
node auth-server-social.js
```
Server will run on `http://localhost:3001`

### 2. Configure OAuth Providers

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add these redirect URIs:
   - `http://localhost:3001/auth/google/callback`
6. Update environment variables:
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Microsoft OAuth Setup
1. Go to [Azure App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Create a new registration
3. Add these redirect URIs:
   - `http://localhost:3001/auth/microsoft/callback`
4. Update environment variables:
```bash
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### 3. Deploy Frontend to GitHub Pages
1. Push the `frontend-github-pages` folder to your GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to the folder containing `index.html`

### 4. Update Frontend Configuration
Update the `API_BASE_URL` in `index.html` if needed:
```javascript
const API_BASE_URL = 'http://localhost:3001';
```

## Features

### Authentication Methods
- **Google OAuth**: One-click login with Google account
- **Microsoft OAuth**: One-click login with Microsoft account  
- **Email/Password**: Traditional registration and login

### Healthcare Roles (RBAC)
1. **Patient**: Basic access to personal health records
2. **Nurse**: Patient care and documentation access
3. **Physician Assistant**: Extended patient care permissions
4. **Physician**: Full clinical access and prescriptions
5. **Billing & Accounting**: Financial and billing permissions
6. **Administrator**: Full system access and user management

### Security Features
- JWT tokens with 1-hour expiration
- Refresh tokens for seamless experience
- Rate limiting to prevent abuse
- CORS configured for GitHub Pages
- Enterprise-grade security logging
- MFA support for high-privilege roles

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Email/password login
- `GET /auth/google` - Google OAuth login
- `GET /auth/microsoft` - Microsoft OAuth login
- `GET /api/user/profile/` - Get user profile

### Health Check
- `GET /health/` - Server health status

## User Experience Flow

1. **Visit GitHub Pages Frontend**: User accesses the public website
2. **Choose Login Method**: Google, Microsoft, or Email/Password
3. **OAuth Redirect**: Social logins redirect to local backend
4. **Authentication**: Backend processes OAuth or credentials
5. **Token Generation**: JWT tokens created and returned
6. **Frontend Redirect**: User redirected back to frontend with tokens
7. **Dashboard Access**: User sees personalized dashboard with role-based permissions

## Development Notes

### CORS Configuration
The backend is configured to accept requests from GitHub Pages:
```javascript
const corsOptions = {
    origin: [
        'https://yourusername.github.io',  // Update with your GitHub Pages URL
        'http://localhost:3000',           // Local development
        'http://localhost:3001'            // Backend server
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
```

### Environment Variables
Create a `.env` file in the `django-auth-backend` directory:
```bash
# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# GitHub Pages URL (update with your actual URL)
GITHUB_PAGES_URL=https://yourusername.github.io/webqx
```

## Production Considerations

1. **HTTPS**: Enable HTTPS for GitHub Pages (automatic with custom domain)
2. **Domain**: Consider using a custom domain for GitHub Pages
3. **Security**: Keep OAuth credentials secure and rotate regularly
4. **Monitoring**: Set up logging and monitoring for the backend server
5. **Backup**: Regular database backups (currently using in-memory storage)

## Troubleshooting

### Common Issues
1. **CORS Errors**: Update the GitHub Pages URL in CORS configuration
2. **OAuth Failures**: Check redirect URIs match exactly
3. **Token Issues**: Verify JWT secret is set correctly
4. **Server Not Starting**: Check port 3001 is available

### Debug Commands
```bash
# Check server status
curl http://localhost:3001/health/

# Test CORS
curl -H "Origin: https://yourusername.github.io" http://localhost:3001/health/
```

## Next Steps

1. **Database**: Replace in-memory storage with persistent database (PostgreSQL/MongoDB)
2. **SSL**: Set up SSL certificate for local backend (optional)
3. **Load Balancing**: Configure multiple backend instances for high availability
4. **Monitoring**: Implement comprehensive logging and analytics
5. **Testing**: Add automated tests for authentication flows
