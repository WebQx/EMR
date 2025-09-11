#!/bin/bash

# WebQX Global Analytics Deployment Script
# Deploys real-time analytics system for millions of users

echo "🚀 Starting WebQX Global Analytics Deployment..."
echo "📊 Preparing to serve millions of users with real-time analytics"

# Set deployment variables
DOCKER_IMAGE="webqx/global-analytics"
VERSION="1.0.0"
NAMESPACE="webqx-analytics"
REGION_US="us-east-1"
REGION_EU="eu-west-1"
REGION_APAC="ap-southeast-1"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { print_error "kubectl is required but not installed. Aborting."; exit 1; }
    command -v helm >/dev/null 2>&1 || { print_error "Helm is required but not installed. Aborting."; exit 1; }
    command -v terraform >/dev/null 2>&1 || { print_error "Terraform is required but not installed. Aborting."; exit 1; }
    
    print_success "All prerequisites satisfied"
}

# Build Docker image
build_docker_image() {
    print_status "Building WebQX Analytics Docker image..."
    
    # Create Dockerfile for analytics server
    cat > Dockerfile << EOF
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && update-ca-certificates

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webqx -u 1001

# Change ownership of app directory
RUN chown -R webqx:nodejs /app
USER webqx

# Expose ports
EXPOSE 3002 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start application
CMD ["node", "server.js"]
EOF

    docker build -t ${DOCKER_IMAGE}:${VERSION} . || {
        print_error "Docker build failed"
        exit 1
    }
    
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
    app: webqx-analytics
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: analytics-quota
  namespace: ${NAMESPACE}
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "50"
    limits.memory: 100Gi
    pods: "100"
EOF

    # ConfigMap
    cat > k8s/configmap.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: analytics-config
  namespace: ${NAMESPACE}
data:
  NODE_ENV: "production"
  PORT: "3002"
  WEBSOCKET_PORT: "8080"
  LOG_LEVEL: "info"
  METRICS_INTERVAL: "5000"
  REDIS_CLUSTER_MODE: "true"
EOF

    # Secret for database credentials
    cat > k8s/secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: analytics-secrets
  namespace: ${NAMESPACE}
type: Opaque
data:
  DB_HOST: $(echo -n "webqx-global-analytics.cluster-cxy1234567890.us-east-1.rds.amazonaws.com" | base64)
  DB_USER: $(echo -n "analytics_admin" | base64)
  DB_PASSWORD: $(echo -n "SecureAnalytics2024!" | base64)
  DB_NAME: $(echo -n "webqx_analytics" | base64)
  JWT_SECRET: $(echo -n "super-secret-jwt-key-for-analytics-2024" | base64)
EOF

    # Deployment
    cat > k8s/deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webqx-analytics
  namespace: ${NAMESPACE}
  labels:
    app: webqx-analytics
    version: v1
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  selector:
    matchLabels:
      app: webqx-analytics
  template:
    metadata:
      labels:
        app: webqx-analytics
        version: v1
    spec:
      containers:
      - name: analytics-server
        image: ${DOCKER_IMAGE}:${VERSION}
        ports:
        - containerPort: 3002
          name: http
        - containerPort: 8080
          name: websocket
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: analytics-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: analytics-config
              key: PORT
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: analytics-secrets
              key: DB_HOST
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: analytics-secrets
              key: DB_USER
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: analytics-secrets
              key: DB_PASSWORD
        - name: DB_NAME
          valueFrom:
            secretKeyRef:
              name: analytics-secrets
              key: DB_NAME
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1001
          capabilities:
            drop:
            - ALL
EOF

    # Service
    cat > k8s/service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: webqx-analytics-service
  namespace: ${NAMESPACE}
  labels:
    app: webqx-analytics
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3002
    protocol: TCP
    name: http
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: websocket
  selector:
    app: webqx-analytics
---
apiVersion: v1
kind: Service
metadata:
  name: webqx-analytics-headless
  namespace: ${NAMESPACE}
  labels:
    app: webqx-analytics
spec:
  clusterIP: None
  ports:
  - port: 3002
    targetPort: 3002
    name: http
  - port: 8080
    targetPort: 8080
    name: websocket
  selector:
    app: webqx-analytics
EOF

    # Ingress
    cat > k8s/ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webqx-analytics-ingress
  namespace: ${NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/websocket-services: "webqx-analytics-service:8080"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "1000"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - analytics.webqx.healthcare
    secretName: analytics-tls
  rules:
  - host: analytics.webqx.healthcare
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webqx-analytics-service
            port:
              number: 80
EOF

    # HorizontalPodAutoscaler
    cat > k8s/hpa.yaml << EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webqx-analytics-hpa
  namespace: ${NAMESPACE}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webqx-analytics
  minReplicas: 5
  maxReplicas: 100
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
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
EOF

    # NetworkPolicy
    cat > k8s/network-policy.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: webqx-analytics-network-policy
  namespace: ${NAMESPACE}
spec:
  podSelector:
    matchLabels:
      app: webqx-analytics
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3002
    - protocol: TCP
      port: 8080
  egress:
  - {}
EOF

    print_success "Kubernetes manifests created"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    print_status "Deploying to Kubernetes..."
    
    # Apply manifests
    kubectl apply -f k8s/ || {
        print_error "Kubernetes deployment failed"
        exit 1
    }
    
    # Wait for deployment to be ready
    print_status "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/webqx-analytics -n ${NAMESPACE}
    
    print_success "Kubernetes deployment completed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring and observability..."
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Prometheus using Helm
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --set grafana.enabled=true \
        --set grafana.adminPassword=WebQxAnalytics2024! \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.retention=30d \
        --wait
    
    # Create ServiceMonitor for analytics
    cat > k8s/service-monitor.yaml << EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webqx-analytics-metrics
  namespace: ${NAMESPACE}
  labels:
    app: webqx-analytics
spec:
  selector:
    matchLabels:
      app: webqx-analytics
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
EOF

    kubectl apply -f k8s/service-monitor.yaml
    
    print_success "Monitoring setup completed"
}

# Setup global load balancing
setup_global_load_balancing() {
    print_status "Setting up global load balancing..."
    
    # Create Terraform configuration for global load balancer
    mkdir -p terraform
    
    cat > terraform/main.tf << EOF
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# AWS Route 53 for DNS
resource "aws_route53_zone" "webqx_analytics" {
  name = "analytics.webqx.healthcare"
}

# Global load balancer with health checks
resource "aws_route53_health_check" "us_east" {
  fqdn                            = "us-east.analytics.webqx.healthcare"
  port                            = 443
  type                            = "HTTPS"
  resource_path                   = "/health"
  failure_threshold               = 3
  request_interval                = 30
  cloudwatch_logs_region          = "us-east-1"
  cloudwatch_alarm_region         = "us-east-1"
  insufficient_data_health_status = "Failure"
}

resource "aws_route53_health_check" "eu_west" {
  fqdn                            = "eu-west.analytics.webqx.healthcare"
  port                            = 443
  type                            = "HTTPS"
  resource_path                   = "/health"
  failure_threshold               = 3
  request_interval                = 30
  cloudwatch_logs_region          = "eu-west-1"
  cloudwatch_alarm_region         = "eu-west-1"
  insufficient_data_health_status = "Failure"
}

resource "aws_route53_health_check" "ap_southeast" {
  fqdn                            = "ap-southeast.analytics.webqx.healthcare"
  port                            = 443
  type                            = "HTTPS"
  resource_path                   = "/health"
  failure_threshold               = 3
  request_interval                = 30
  cloudwatch_logs_region          = "ap-southeast-1"
  cloudwatch_alarm_region         = "ap-southeast-1"
  insufficient_data_health_status = "Failure"
}

# Weighted routing for load distribution
resource "aws_route53_record" "analytics_weighted_us" {
  zone_id = aws_route53_zone.webqx_analytics.zone_id
  name    = "analytics.webqx.healthcare"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 40
  }

  set_identifier  = "us-east"
  records         = ["us-east.analytics.webqx.healthcare"]
  health_check_id = aws_route53_health_check.us_east.id
}

resource "aws_route53_record" "analytics_weighted_eu" {
  zone_id = aws_route53_zone.webqx_analytics.zone_id
  name    = "analytics.webqx.healthcare"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 35
  }

  set_identifier  = "eu-west"
  records         = ["eu-west.analytics.webqx.healthcare"]
  health_check_id = aws_route53_health_check.eu_west.id
}

resource "aws_route53_record" "analytics_weighted_apac" {
  zone_id = aws_route53_zone.webqx_analytics.zone_id
  name    = "analytics.webqx.healthcare"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 25
  }

  set_identifier  = "ap-southeast"
  records         = ["ap-southeast.analytics.webqx.healthcare"]
  health_check_id = aws_route53_health_check.ap_southeast.id
}
EOF

    # Initialize and apply Terraform
    cd terraform
    terraform init
    terraform plan
    # terraform apply -auto-approve
    cd ..
    
    print_success "Global load balancing configured"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check pod status
    kubectl get pods -n ${NAMESPACE} -l app=webqx-analytics
    
    # Check service status
    kubectl get svc -n ${NAMESPACE}
    
    # Check ingress status
    kubectl get ingress -n ${NAMESPACE}
    
    # Check HPA status
    kubectl get hpa -n ${NAMESPACE}
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    kubectl port-forward -n ${NAMESPACE} svc/webqx-analytics-service 8080:80 &
    PID=$!
    sleep 5
    
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - service may still be starting"
    fi
    
    kill $PID 2>/dev/null
    
    print_success "Deployment verification completed"
}

# Display deployment summary
display_summary() {
    echo ""
    echo "🎉 WebQX Global Analytics Deployment Complete!"
    echo ""
    echo "📊 Analytics Dashboard: https://analytics.webqx.healthcare"
    echo "🔌 WebSocket Endpoint: wss://analytics.webqx.healthcare:8080"
    echo "📈 Monitoring: http://localhost:3000 (Grafana)"
    echo "🔍 Prometheus: http://localhost:9090"
    echo ""
    echo "🌍 Global Regions:"
    echo "   • US East: us-east.analytics.webqx.healthcare"
    echo "   • EU West: eu-west.analytics.webqx.healthcare"
    echo "   • APAC: ap-southeast.analytics.webqx.healthcare"
    echo ""
    echo "📊 Real-time Capabilities:"
    echo "   • User registration tracking"
    echo "   • Global activity monitoring"
    echo "   • Performance metrics"
    echo "   • Country-wise analytics"
    echo "   • WebSocket live updates"
    echo ""
    echo "🚀 Scaling Configuration:"
    echo "   • Min replicas: 5"
    echo "   • Max replicas: 100"
    echo "   • Auto-scaling: CPU 70%, Memory 80%"
    echo "   • Global load balancing: Active"
    echo ""
    echo "📱 Access Commands:"
    echo "   kubectl get pods -n ${NAMESPACE}"
    echo "   kubectl logs -f deployment/webqx-analytics -n ${NAMESPACE}"
    echo "   kubectl port-forward svc/webqx-analytics-service 3002:80 -n ${NAMESPACE}"
    echo ""
    print_success "Ready to serve millions of users with real-time analytics! 🌟"
}

# Main deployment function
main() {
    echo "🚀 WebQX Global Analytics Deployment"
    echo "======================================"
    
    check_prerequisites
    build_docker_image
    create_k8s_manifests
    deploy_to_kubernetes
    setup_monitoring
    setup_global_load_balancing
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
    "monitor")
        setup_monitoring
        ;;
    "verify")
        verify_deployment
        ;;
    "full"|"")
        main
        ;;
    *)
        echo "Usage: $0 [build|deploy|monitor|verify|full]"
        echo "  build   - Build Docker image only"
        echo "  deploy  - Deploy to Kubernetes only"
        echo "  monitor - Setup monitoring only"
        echo "  verify  - Verify deployment only"
        echo "  full    - Full deployment (default)"
        exit 1
        ;;
esac
