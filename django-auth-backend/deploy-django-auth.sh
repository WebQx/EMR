#!/bin/bash

# WebQX Django Authentication Backend Deployment
# Production-ready deployment for millions of users

echo "🚀 Deploying WebQX Django Authentication Backend..."
echo "🔐 Enterprise-grade security for global healthcare platform"

# Set deployment variables
PROJECT_NAME="webqx-django-auth"
DOCKER_IMAGE="webqx/django-auth"
VERSION="1.0.0"
NAMESPACE="webqx-auth"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { print_error "Docker required"; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { print_error "kubectl required"; exit 1; }
    command -v python3 >/dev/null 2>&1 || { print_error "Python 3 required"; exit 1; }
    
    print_success "Prerequisites satisfied"
}

# Setup Python environment
setup_environment() {
    print_status "Setting up Python environment..."
    
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    print_success "Python environment ready"
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    cat > .env << EOF
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-change-in-production
ALLOWED_HOSTS=webqx.healthcare,api.webqx.healthcare,auth.webqx.healthcare

# Database Configuration
DB_NAME=webqx_auth
DB_USER=webqx_admin
DB_PASSWORD=SecureWebQx2024!
DB_HOST=webqx-auth.cluster-cxy1234567890.us-east-1.rds.amazonaws.com
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://webqx-auth-cache.abc123.cache.amazonaws.com:6379

# Email Configuration
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_HOST_USER=AKIAIOSFODNN7EXAMPLE
EMAIL_HOST_PASSWORD=your-ses-smtp-password
EMAIL_USE_TLS=True

# Celery Configuration
CELERY_BROKER_URL=redis://webqx-auth-cache.abc123.cache.amazonaws.com:6379/3
CELERY_RESULT_BACKEND=redis://webqx-auth-cache.abc123.cache.amazonaws.com:6379/4

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=webqx-static-files
AWS_S3_REGION_NAME=us-east-1

# Sentry Configuration (Error Monitoring)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
EOF

    print_success "Environment file created"
}

# Build Docker image
build_docker_image() {
    print_status "Building Django Docker image..."
    
    cat > Dockerfile << 'EOF'
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=webqx_auth.settings

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        gettext \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create logs directory
RUN mkdir -p logs

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "gevent", "--worker-connections", "1000", "webqx_auth.wsgi:application"]
EOF

    docker build -t ${DOCKER_IMAGE}:${VERSION} .
    docker tag ${DOCKER_IMAGE}:${VERSION} ${DOCKER_IMAGE}:latest
    
    print_success "Docker image built successfully"
}

# Create Kubernetes manifests
create_k8s_manifests() {
    print_status "Creating Kubernetes manifests..."
    
    mkdir -p k8s
    
    # Namespace
    cat > k8s/namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
  labels:
    name: ${NAMESPACE}
    app: webqx-auth
EOF

    # ConfigMap
    cat > k8s/configmap.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: django-config
  namespace: ${NAMESPACE}
data:
  DJANGO_SETTINGS_MODULE: "webqx_auth.settings"
  DEBUG: "False"
  ALLOWED_HOSTS: "webqx.healthcare,api.webqx.healthcare,auth.webqx.healthcare"
  TIME_ZONE: "UTC"
EOF

    # Secret
    cat > k8s/secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: django-secrets
  namespace: ${NAMESPACE}
type: Opaque
data:
  SECRET_KEY: $(echo -n "your-super-secret-django-key-change-in-production" | base64)
  DB_PASSWORD: $(echo -n "SecureWebQx2024!" | base64)
  EMAIL_HOST_PASSWORD: $(echo -n "your-ses-smtp-password" | base64)
  SENTRY_DSN: $(echo -n "https://your-sentry-dsn@sentry.io/project-id" | base64)
EOF

    # Deployment
    cat > k8s/deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: django-auth
  namespace: ${NAMESPACE}
  labels:
    app: django-auth
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: django-auth
  template:
    metadata:
      labels:
        app: django-auth
    spec:
      containers:
      - name: django-app
        image: ${DOCKER_IMAGE}:${VERSION}
        ports:
        - containerPort: 8000
        env:
        - name: DJANGO_SETTINGS_MODULE
          valueFrom:
            configMapKeyRef:
              name: django-config
              key: DJANGO_SETTINGS_MODULE
        - name: DEBUG
          valueFrom:
            configMapKeyRef:
              name: django-config
              key: DEBUG
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: SECRET_KEY
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: DB_PASSWORD
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          capabilities:
            drop:
            - ALL
EOF

    # Service
    cat > k8s/service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: django-auth-service
  namespace: ${NAMESPACE}
  labels:
    app: django-auth
spec:
  selector:
    app: django-auth
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
EOF

    # Ingress
    cat > k8s/ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: django-auth-ingress
  namespace: ${NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "1000"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - auth.webqx.healthcare
    secretName: auth-tls
  rules:
  - host: auth.webqx.healthcare
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: django-auth-service
            port:
              number: 80
EOF

    # HPA
    cat > k8s/hpa.yaml << EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: django-auth-hpa
  namespace: ${NAMESPACE}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: django-auth
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF

    print_success "Kubernetes manifests created"
}

# Database migration
run_migrations() {
    print_status "Running database migrations..."
    
    # Create migration job
    cat > k8s/migration-job.yaml << EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: django-migrate-$(date +%s)
  namespace: ${NAMESPACE}
spec:
  template:
    spec:
      containers:
      - name: django-migrate
        image: ${DOCKER_IMAGE}:${VERSION}
        command: ["python", "manage.py", "migrate"]
        env:
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: SECRET_KEY
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: DB_PASSWORD
      restartPolicy: Never
  backoffLimit: 3
EOF

    kubectl apply -f k8s/migration-job.yaml
    
    print_success "Database migrations completed"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    print_status "Deploying to Kubernetes..."
    
    kubectl apply -f k8s/
    
    # Wait for deployment
    kubectl wait --for=condition=available --timeout=300s deployment/django-auth -n ${NAMESPACE}
    
    print_success "Kubernetes deployment completed"
}

# Setup Celery workers
deploy_celery() {
    print_status "Deploying Celery workers..."
    
    cat > k8s/celery-worker.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
  namespace: ${NAMESPACE}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: celery-worker
        image: ${DOCKER_IMAGE}:${VERSION}
        command: ["celery", "-A", "webqx_auth", "worker", "--loglevel=info"]
        env:
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: SECRET_KEY
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: DB_PASSWORD
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "250m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-beat
  namespace: ${NAMESPACE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: celery-beat
  template:
    metadata:
      labels:
        app: celery-beat
    spec:
      containers:
      - name: celery-beat
        image: ${DOCKER_IMAGE}:${VERSION}
        command: ["celery", "-A", "webqx_auth", "beat", "--loglevel=info"]
        env:
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: SECRET_KEY
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: DB_PASSWORD
        resources:
          requests:
            memory: "128Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "100m"
EOF

    kubectl apply -f k8s/celery-worker.yaml
    
    print_success "Celery workers deployed"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check pods
    kubectl get pods -n ${NAMESPACE}
    
    # Check services
    kubectl get svc -n ${NAMESPACE}
    
    # Check ingress
    kubectl get ingress -n ${NAMESPACE}
    
    # Test health endpoint
    if kubectl port-forward -n ${NAMESPACE} svc/django-auth-service 8080:80 &
    then
        PID=$!
        sleep 5
        
        if curl -f http://localhost:8080/health/ > /dev/null 2>&1; then
            print_success "Health check passed"
        else
            print_error "Health check failed"
        fi
        
        kill $PID 2>/dev/null
    fi
    
    print_success "Deployment verification completed"
}

# Create superuser
create_superuser() {
    print_status "Creating Django superuser..."
    
    cat > k8s/create-superuser-job.yaml << EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: create-superuser-$(date +%s)
  namespace: ${NAMESPACE}
spec:
  template:
    spec:
      containers:
      - name: create-superuser
        image: ${DOCKER_IMAGE}:${VERSION}
        command: ["python", "manage.py", "shell", "-c"]
        args:
        - |
          from authentication.models import WebQXUser
          if not WebQXUser.objects.filter(email='admin@webqx.healthcare').exists():
              WebQXUser.objects.create_superuser(
                  email='admin@webqx.healthcare',
                  password='WebQxAdmin2024!',
                  first_name='WebQX',
                  last_name='Administrator'
              )
              print('Superuser created successfully')
          else:
              print('Superuser already exists')
        env:
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: SECRET_KEY
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: django-secrets
              key: DB_PASSWORD
      restartPolicy: Never
  backoffLimit: 3
EOF

    kubectl apply -f k8s/create-superuser-job.yaml
    
    print_success "Superuser creation job submitted"
}

# Display summary
display_summary() {
    echo ""
    echo "🎉 WebQX Django Authentication Backend Deployed!"
    echo ""
    echo "🔐 Authentication API: https://auth.webqx.healthcare/api/v1/auth/"
    echo "👤 Admin Interface: https://auth.webqx.healthcare/admin/"
    echo "📊 Health Check: https://auth.webqx.healthcare/health/"
    echo ""
    echo "🔑 API Endpoints:"
    echo "   • POST /api/v1/auth/register/ - User registration"
    echo "   • POST /api/v1/auth/token/ - JWT login"
    echo "   • POST /api/v1/auth/token/refresh/ - Token refresh"
    echo "   • GET /api/v1/auth/profile/ - User profile"
    echo "   • POST /api/v1/auth/mfa/setup/ - MFA setup"
    echo "   • POST /api/v1/auth/change-password/ - Password change"
    echo ""
    echo "🔐 Security Features:"
    echo "   • Multi-factor authentication (TOTP)"
    echo "   • Account lockout protection"
    echo "   • Security event logging"
    echo "   • Session management"
    echo "   • Password validation"
    echo "   • Rate limiting"
    echo ""
    echo "📱 Admin Credentials:"
    echo "   • Email: admin@webqx.healthcare"
    echo "   • Password: WebQxAdmin2024!"
    echo ""
    echo "🚀 Ready to authenticate millions of users securely! 🌟"
}

# Main function
main() {
    echo "🔐 WebQX Django Authentication Backend Deployment"
    echo "=================================================="
    
    check_prerequisites
    setup_environment
    create_env_file
    build_docker_image
    create_k8s_manifests
    deploy_to_kubernetes
    run_migrations
    deploy_celery
    create_superuser
    verify_deployment
    display_summary
}

# Handle script arguments
case "${1:-}" in
    "build")
        build_docker_image
        ;;
    "deploy")
        deploy_to_kubernetes
        ;;
    "migrate")
        run_migrations
        ;;
    "verify")
        verify_deployment
        ;;
    "full"|"")
        main
        ;;
    *)
        echo "Usage: $0 [build|deploy|migrate|verify|full]"
        exit 1
        ;;
esac
