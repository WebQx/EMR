#!/bin/bash

# =============================================================================
# WebQX Global Healthcare Platform - Production Deployment Script
# Designed to handle MILLIONS of users globally
# =============================================================================

set -e  # Exit on any error

echo "🌍 WebQX Global Healthcare Platform"
echo "===================================="
echo "🚀 Deploying production infrastructure for millions of users..."
echo ""

# Configuration
PROJECT_NAME="webqx-global-healthcare"
DOCKER_REGISTRY="webqx"
ENVIRONMENT="production"
REGION_PRIMARY="us-east-1"
REGION_SECONDARY="eu-west-1"
REGION_APAC="ap-southeast-1"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Kubernetes
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi
    
    # Check Helm
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Build production Docker images
build_production_images() {
    log_info "Building production Docker images..."
    
    # Build EMR system image
    log_info "Building WebQX EMR image..."
    docker build -t ${DOCKER_REGISTRY}/webqx-emr:${ENVIRONMENT} \
        -f docker/Dockerfile.production \
        --build-arg NODE_ENV=production \
        --build-arg DATABASE_POOL_SIZE=100 \
        --build-arg REDIS_POOL_SIZE=50 \
        .
    
    # Build user registration service
    log_info "Building User Registration Service image..."
    docker build -t ${DOCKER_REGISTRY}/webqx-user-service:${ENVIRONMENT} \
        -f docker/Dockerfile.user-service \
        --build-arg NODE_ENV=production \
        ./global-user-system/
    
    # Build API Gateway
    log_info "Building API Gateway image..."
    docker build -t ${DOCKER_REGISTRY}/webqx-api-gateway:${ENVIRONMENT} \
        -f docker/Dockerfile.api-gateway \
        --build-arg NODE_ENV=production \
        ./api-gateway/
    
    log_success "Docker images built successfully"
}

# Push images to registry
push_images() {
    log_info "Pushing images to registry..."
    
    docker push ${DOCKER_REGISTRY}/webqx-emr:${ENVIRONMENT}
    docker push ${DOCKER_REGISTRY}/webqx-user-service:${ENVIRONMENT}
    docker push ${DOCKER_REGISTRY}/webqx-api-gateway:${ENVIRONMENT}
    
    log_success "Images pushed to registry"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log_info "Deploying global infrastructure with Terraform..."
    
    cd terraform/
    
    # Initialize Terraform
    terraform init -backend-config="bucket=webqx-terraform-state" \
                   -backend-config="key=production/terraform.tfstate" \
                   -backend-config="region=${REGION_PRIMARY}"
    
    # Plan deployment
    terraform plan -var="environment=${ENVIRONMENT}" \
                   -var="primary_region=${REGION_PRIMARY}" \
                   -var="secondary_region=${REGION_SECONDARY}" \
                   -var="apac_region=${REGION_APAC}" \
                   -out=production.tfplan
    
    # Apply infrastructure
    terraform apply production.tfplan
    
    cd ..
    log_success "Infrastructure deployed"
}

# Deploy Kubernetes applications
deploy_kubernetes() {
    log_info "Deploying Kubernetes applications..."
    
    # Create namespace
    kubectl create namespace webqx-production --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy secrets
    log_info "Creating secrets..."
    kubectl create secret generic webqx-secrets \
        --from-env-file=.env.production \
        --namespace=webqx-production \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy with Helm charts
    log_info "Deploying EMR system..."
    helm upgrade --install webqx-emr ./helm/webqx-emr \
        --namespace webqx-production \
        --values helm/values/production.yaml \
        --set image.tag=${ENVIRONMENT} \
        --set replicaCount=50 \
        --set autoscaling.minReplicas=50 \
        --set autoscaling.maxReplicas=1000
    
    log_info "Deploying User Registration Service..."
    helm upgrade --install webqx-user-service ./helm/webqx-user-service \
        --namespace webqx-production \
        --values helm/values/production.yaml \
        --set image.tag=${ENVIRONMENT} \
        --set replicaCount=20 \
        --set autoscaling.maxReplicas=500
    
    log_info "Deploying API Gateway..."
    helm upgrade --install webqx-api-gateway ./helm/webqx-api-gateway \
        --namespace webqx-production \
        --values helm/values/production.yaml \
        --set image.tag=${ENVIRONMENT} \
        --set replicaCount=30 \
        --set autoscaling.maxReplicas=200
    
    log_success "Kubernetes applications deployed"
}

# Setup monitoring and alerting
setup_monitoring() {
    log_info "Setting up monitoring and alerting..."
    
    # Deploy Prometheus stack
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values monitoring/prometheus-values.yaml \
        --set grafana.adminPassword="$(openssl rand -base64 32)"
    
    # Deploy custom dashboards
    kubectl apply -f monitoring/dashboards/ -n monitoring
    
    # Setup alerts for high traffic
    kubectl apply -f monitoring/alerts/ -n monitoring
    
    log_success "Monitoring setup complete"
}

# Configure global load balancing
setup_global_load_balancing() {
    log_info "Setting up global load balancing..."
    
    # Deploy NGINX Ingress with global load balancing
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm upgrade --install nginx-ingress ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --values ingress/production-values.yaml
    
    # Apply ingress rules
    kubectl apply -f ingress/global-ingress.yaml
    
    log_success "Global load balancing configured"
}

# Setup CDN and edge caching
setup_cdn() {
    log_info "Setting up CDN and edge caching..."
    
    # This would typically involve:
    # - Configuring CloudFlare or AWS CloudFront
    # - Setting up edge locations globally
    # - Configuring cache rules for static assets
    
    log_warning "CDN setup requires manual configuration in cloud provider console"
    echo "CDN Endpoints to configure:"
    echo "- Static assets: *.webqx.healthcare"
    echo "- API endpoints: api.webqx.healthcare"
    echo "- Patient portal: portal.webqx.healthcare"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pod status
    echo "Checking pod status..."
    kubectl get pods -n webqx-production
    
    # Check services
    echo "Checking services..."
    kubectl get services -n webqx-production
    
    # Check ingress
    echo "Checking ingress..."
    kubectl get ingress -n webqx-production
    
    # Test health endpoints
    echo "Testing health endpoints..."
    kubectl port-forward -n webqx-production svc/webqx-emr 8080:80 &
    sleep 5
    
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
    fi
    
    # Kill port-forward
    pkill -f "kubectl port-forward"
    
    log_success "Deployment verification complete"
}

# Main deployment flow
main() {
    echo "🌍 Starting WebQX Global Healthcare Platform Deployment"
    echo "======================================================"
    echo "Target: Production environment for millions of users"
    echo "Regions: ${REGION_PRIMARY}, ${REGION_SECONDARY}, ${REGION_APAC}"
    echo ""
    
    read -p "Are you sure you want to deploy to production? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        log_warning "Deployment cancelled by user"
        exit 0
    fi
    
    check_prerequisites
    
    echo ""
    echo "🚀 Phase 1: Building and pushing Docker images"
    echo "=============================================="
    build_production_images
    push_images
    
    echo ""
    echo "🏗️ Phase 2: Deploying global infrastructure"
    echo "=========================================="
    deploy_infrastructure
    
    echo ""
    echo "☸️ Phase 3: Deploying Kubernetes applications"
    echo "============================================"
    deploy_kubernetes
    
    echo ""
    echo "📊 Phase 4: Setting up monitoring"
    echo "================================"
    setup_monitoring
    
    echo ""
    echo "🌐 Phase 5: Configuring global load balancing"
    echo "============================================"
    setup_global_load_balancing
    
    echo ""
    echo "📡 Phase 6: Setting up CDN"
    echo "========================="
    setup_cdn
    
    echo ""
    echo "✅ Phase 7: Verifying deployment"
    echo "==============================="
    verify_deployment
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "======================="
    echo ""
    log_success "WebQX Global Healthcare Platform is now live!"
    echo ""
    echo "📊 Platform Endpoints:"
    echo "   🏠 Main Portal: https://webqx.healthcare"
    echo "   🔌 API Gateway: https://api.webqx.healthcare"
    echo "   👤 Patient Portal: https://portal.webqx.healthcare"
    echo "   📝 Registration: https://register.webqx.healthcare"
    echo ""
    echo "📈 Monitoring:"
    echo "   📊 Grafana: https://monitoring.webqx.healthcare"
    echo "   🔍 Prometheus: https://prometheus.webqx.healthcare"
    echo ""
    echo "🚀 Ready to serve millions of users worldwide!"
    echo ""
    echo "Next steps:"
    echo "1. Configure DNS records"
    echo "2. Setup SSL certificates"
    echo "3. Test user registration flow"
    echo "4. Monitor system performance"
    echo "5. Scale as needed"
}

# Run deployment
main "$@"
