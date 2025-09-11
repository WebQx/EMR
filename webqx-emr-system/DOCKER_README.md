# WebQX™ EMR System - Development Quick Start
# Complete Docker environment setup and deployment guide

## 🚀 Quick Start Commands

### Development Environment
```bash
# Start WebQX EMR with development tools
docker-compose --profile development up -d

# Access points:
# - WebQX EMR: http://localhost:8080
# - phpMyAdmin: http://localhost:8081
# - Redis Commander: http://localhost:8082
# - Email Testing: http://localhost:8025
```

### Production Environment
```bash
# Start WebQX EMR production setup
docker-compose up -d

# Access point:
# - WebQX EMR: http://localhost:8080
```

## 📋 Prerequisites

- Docker Engine 20.0+
- Docker Compose 2.0+
- 4GB+ RAM available
- 10GB+ disk space

## 🏗️ Architecture Overview

### Core Services
- **webqx-emr**: Main PHP/Apache application with OpenEMR integration
- **mysql**: MySQL 8.0 database with WebQX customizations
- **redis**: Redis cache for sessions and performance
- **mailhog**: Email testing (development only)

### Development Services
- **phpmyadmin**: Database management interface
- **redis-commander**: Redis monitoring and management

### Network Configuration
- **Network**: `webqx-network` (172.20.0.0/16)
- **Volumes**: Persistent storage for data, uploads, and logs

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=mysql
DB_NAME=webqx_emr
DB_USER=webqx_user
DB_PASSWORD=webqx_pass_2024!

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=webqx_redis_2024!

# WebQX
WEBQX_ENV=development
WEBQX_VERSION=1.0.0
WEBQX_DEBUG=true
```

### Security Settings
- **MySQL Root Password**: `webqx_root_2024!`
- **WebQX Database Password**: `webqx_pass_2024!`
- **Redis Password**: `webqx_redis_2024!`
- **JWT Secret**: `webqx_jwt_secret_change_in_production_2024!`

⚠️ **IMPORTANT**: Change all default passwords in production!

## 📁 Directory Structure

```
webqx-emr-system/
├── core/                    # OpenEMR source code
├── customizations/          # WebQX customizations
├── themes/                  # WebQX themes and styling
├── modules/                 # Custom WebQX modules
├── api/                     # Enhanced API endpoints
├── config/                  # Configuration files
├── docker/                  # Docker configuration
│   ├── php/                 # PHP configuration
│   ├── apache/              # Apache configuration
│   └── mysql/               # MySQL configuration
├── uploads/                 # File uploads (volume)
├── logs/                    # Application logs (volume)
├── Dockerfile               # WebQX EMR container
└── docker-compose.yml       # Complete infrastructure
```

## 🚀 Initial Setup

### 1. Clone and Prepare
```bash
cd webqx-emr-system
chmod +x setup.sh
```

### 2. Start Development Environment
```bash
docker-compose --profile development up -d
```

### 3. Wait for Health Checks
```bash
# Monitor startup
docker-compose logs -f webqx-emr

# Check health status
docker-compose ps
```

### 4. Access WebQX EMR
- Open: http://localhost:8080
- Default credentials will be set during first run

## 🔍 Monitoring and Debugging

### View Logs
```bash
# Application logs
docker-compose logs webqx-emr

# Database logs
docker-compose logs mysql

# All services
docker-compose logs -f
```

### Health Checks
```bash
# Check service status
docker-compose ps

# Test API endpoint
curl http://localhost:8080/api/v2/status

# Database connection test
docker-compose exec webqx-emr php -r "echo 'DB: ' . (new PDO('mysql:host=mysql;dbname=webqx_emr', 'webqx_user', 'webqx_pass_2024!') ? 'Connected' : 'Failed') . PHP_EOL;"
```

### Performance Monitoring
- **System Health**: http://localhost:8080/api/v2/health
- **Redis Stats**: http://localhost:8082 (development)
- **Database Stats**: http://localhost:8081 (development)

## 🔧 Customization

### Adding Custom Modules
1. Create module in `modules/your_module/`
2. Register in WebQX module registry
3. Restart container: `docker-compose restart webqx-emr`

### Theme Customization
1. Edit `themes/webqx-theme.css`
2. Changes auto-reload in development mode

### API Extensions
1. Add endpoints in `api/webqx-api.php`
2. Follow RESTful conventions
3. Test with: `curl http://localhost:8080/api/v2/your-endpoint`

## 🛠️ Maintenance

### Database Backup
```bash
# Manual backup
docker-compose exec mysql mysqldump -u webqx_user -pwebqx_pass_2024! webqx_emr > backup.sql

# Restore backup
docker-compose exec -T mysql mysql -u webqx_user -pwebqx_pass_2024! webqx_emr < backup.sql
```

### Update WebQX EMR
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Restart services
docker-compose down && docker-compose up -d
```

### Clean Up
```bash
# Stop all services
docker-compose down

# Remove volumes (⚠️ Data loss!)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🔐 Security Checklist

### Production Deployment
- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable audit logging
- [ ] Configure proper file permissions
- [ ] Set up monitoring alerts

### HIPAA Compliance
- [ ] Encrypt data at rest
- [ ] Encrypt data in transit
- [ ] Implement access controls
- [ ] Enable audit trails
- [ ] Set up user authentication
- [ ] Configure session management
- [ ] Implement data backup procedures

## 📞 Support

### Troubleshooting
1. **Port conflicts**: Change port mappings in docker-compose.yml
2. **Memory issues**: Increase Docker memory allocation
3. **Database connection**: Check MySQL container health
4. **File permissions**: Run `docker-compose exec webqx-emr chown -R www-data:www-data /var/www/html`

### Common Issues
- **502 Bad Gateway**: Wait for health checks to pass
- **Database connection failed**: Ensure MySQL is fully started
- **Upload failures**: Check volume mounts and permissions
- **Session issues**: Verify Redis connection

## 🎯 Next Steps

1. **Configure OpenEMR Integration**: Complete setup wizard
2. **Import Sample Data**: Use test patient data
3. **Customize Branding**: Update themes and logos
4. **Set Up Users**: Create admin and provider accounts
5. **Test Workflows**: Verify patient management features
6. **API Integration**: Test FHIR and HL7 endpoints
7. **Backup Strategy**: Implement automated backups
8. **Monitoring**: Set up log aggregation and alerts

## 📚 Additional Resources

- OpenEMR Documentation: https://open-emr.org/wiki/
- FHIR Specification: https://hl7.org/fhir/
- HL7 Standards: https://www.hl7.org/
- Docker Documentation: https://docs.docker.com/
- WebQX EMR API Documentation: http://localhost:8080/api/docs

---

**WebQX™ EMR System v1.0.0** | Built on OpenEMR 7.0.3 | Docker Infrastructure Ready
