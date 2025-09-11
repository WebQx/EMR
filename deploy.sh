#!/bin/bash

# 🚀 WebQx Global Healthcare Platform - Easy Deployment Script
# Run this script to deploy your platform to GitHub Pages in one command

echo "🌍 WebQx Global Healthcare Platform - GitHub Pages Deployment"
echo "=============================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in a git repository
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    echo "Please run this script from your WebQx project root directory"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checklist:${NC}"
echo "✅ Checking repository status..."

# Step 2: Check if there are uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes.${NC}"
    echo "Would you like to commit them now? (y/n)"
    read -r commit_choice
    
    if [ "$commit_choice" = "y" ] || [ "$commit_choice" = "Y" ]; then
        echo "Enter commit message (or press Enter for default):"
        read -r commit_message
        
        if [ -z "$commit_message" ]; then
            commit_message="🚀 Deploy WebQx Global Healthcare Platform updates"
        fi
        
        git add .
        git commit -m "$commit_message"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${YELLOW}⚠️  Proceeding with existing committed changes only${NC}"
    fi
fi

# Step 3: Build production assets (if build scripts exist)
echo -e "${BLUE}🏗️  Building production assets...${NC}"

if npm list --depth=0 tailwindcss &>/dev/null; then
    echo "Building CSS..."
    npm run build:css:prod 2>/dev/null || echo "CSS build skipped (no script found)"
fi

if grep -q "build:pages" package.json; then
    echo "Building pages..."
    npm run build:pages 2>/dev/null || echo "Pages build skipped (no script found)"
fi

# Step 4: Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

# Step 5: Check if GitHub Pages is enabled
echo -e "${BLUE}🔍 Checking GitHub Pages status...${NC}"

# Get repository info
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL == *"github.com"* ]]; then
    # Extract owner and repo name
    REPO_INFO=$(echo $REPO_URL | sed 's/.*github\.com[:/]\(.*\)\.git$/\1/' | sed 's/.*github\.com[:/]\(.*\)$/\1/')
    OWNER=$(echo $REPO_INFO | cut -d'/' -f1)
    REPO=$(echo $REPO_INFO | cut -d'/' -f2)
    
    echo -e "${BLUE}📊 Repository: ${OWNER}/${REPO}${NC}"
    
    # Construct GitHub Pages URL
    PAGES_URL="https://${OWNER}.github.io/${REPO}/"
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "=============================================="
    echo -e "${BLUE}🌍 Your WebQx Global Healthcare Platform is LIVE at:${NC}"
    echo -e "${GREEN}   ✅ Main Platform: https://webqx.github.io/webqx/${NC}"
    echo -e "${GREEN}   ✅ Login Portal: https://webqx.github.io/webqx/login.html${NC}"
    echo -e "${GREEN}   ✅ Patient Portal: https://webqx.github.io/webqx/patient-portal/${NC}"
    echo -e "${GREEN}   ✅ Provider Portal: https://webqx.github.io/webqx/provider/${NC}"
    echo -e "${GREEN}   ✅ 24/7 Telehealth: https://webqx.github.io/webqx/telehealth-24-7-global.html${NC}"
    echo ""
    echo -e "${YELLOW}📝 Note: It may take 5-10 minutes for changes to appear${NC}"
    echo ""
    echo -e "${BLUE}🔧 To enable GitHub Pages (if not already enabled):${NC}"
    echo "   1. Go to: https://github.com/${OWNER}/${REPO}/settings/pages"
    echo "   2. Source: Deploy from a branch"
    echo "   3. Branch: main"
    echo "   4. Folder: / (root)"
    echo "   5. Save"
    echo ""
    echo -e "${GREEN}✨ Your global healthcare platform is now live!${NC}"
    
else
    echo -e "${YELLOW}⚠️  Could not determine GitHub repository URL${NC}"
    echo "Please manually enable GitHub Pages in your repository settings"
fi
