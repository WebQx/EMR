# GitHub Pages Deployment Guide - WebQx Global Healthcare Platform

## **3 User-Friendly Deployment Methods**

### **Method 1: Super Quick (1 Command)**
```bash
# One command to deploy everything
npm run deploy:full
```

### **Method 2: PowerShell Script (Windows)**
```powershell
# Run the automated deployment script
.\deploy.ps1
```

### **Method 3: Manual Steps (5 Minutes)**

#### **Step 1: Enable GitHub Pages (One-time setup)**
1. Go to your repository on GitHub: `https://github.com/WebQx/webqx`
2. Click **Settings** tab
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**: Select "Deploy from a branch"
5. **Branch**: Choose `main`
6. **Folder**: Choose `/ (root)`
7. Click **Save**

#### **Step 2: Deploy Your Updates**
```bash
# Add your changes
git add .

# Commit with a message
git commit -m "Deploy WebQx Global Healthcare Platform"

# Push to GitHub (auto-deploys to Pages)
git push origin main
```

#### **Step 3: Access Your Platform**
Your platform will be live at:
- **Main Hub**: `https://webqx.github.io/webqx/`
- **24/7 Healthcare**: `https://webqx.github.io/webqx/telehealth-24-7-global.html`

---

## **Automatic Deployment (BEST Method)**

### **GitHub Actions (Zero Configuration)**

Your repository now includes `.github/workflows/deploy.yml` which:
- Automatically deploys on every push to `main`
- Builds production CSS
- Optimizes pages
- Deploys to GitHub Pages
- Shows deployment status

**How it works:**
1. You push code: `git push origin main`
2. GitHub automatically builds and deploys
3. Your platform is live in ~2 minutes

---

## **Deployment URLs (Your Live Platform)**

Once deployed, your **WebQx Global Healthcare Platform** will be accessible at:

```
Main Platform Hub:
https://webqx.github.io/webqx/

24/7 Emergency Healthcare:
https://webqx.github.io/webqx/telehealth-24-7-global.html

Patient Portal:
https://webqx.github.io/webqx/patient-portal/

Provider Portal:
https://webqx.github.io/webqx/provider/

Telehealth Suite:
https://webqx.github.io/webqx/telehealth-demo.html

AI Services:
https://webqx.github.io/webqx/whisper-demo.html

FHIR Appointments:
https://webqx.github.io/webqx/demo-fhir-r4-appointment-booking.html

Lab Results:
https://webqx.github.io/webqx/demo-lab-results-viewer.html

Pharmacy Locator:
https://webqx.github.io/webqx/demo/PharmacyLocator-demo.html
```

---

## **Troubleshooting**

### **Common Issues & Solutions:**

#### **"404 Page Not Found"**
- Wait 5-10 minutes after first deployment
- Check that GitHub Pages is enabled in repository settings
- Ensure you're using the correct URL format

#### **"Changes Not Showing"**
- GitHub Pages has a cache - wait 5-10 minutes
- Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
- Check the Actions tab for deployment status

#### **"Build Failed"**
- Check the Actions tab for error details
- Ensure package.json scripts are valid
- Push again to retry deployment

#### **"CSS Not Loading"**
- Run `npm run build:css:prod` before deploying
- Check that CSS files are committed to git
- Verify CSS paths in HTML files

---

## **Mobile & PWA Features**

Your platform automatically includes:
- **Progressive Web App** (PWA) capabilities
- **Offline functionality** via Service Worker
- **Mobile-responsive** design
- **Push notifications** (when user grants permission)
- **Install prompt** (Add to Home Screen)

---

## **Global Performance**

GitHub Pages provides:
- **Global CDN** (fast worldwide access)
- **99.9% uptime** SLA
- **HTTPS by default**
- **DDoS protection**
- **Automatic compression**

Your **24/7 global healthcare platform** will be fast and accessible from anywhere in the world!

---

## **Quick Commands Reference**

```bash
# Quick deploy (with build)
npm run deploy:full

# Quick deploy (no build)
npm run deploy:quick

# Build CSS only
npm run build:css:prod

# Build pages only
npm run build:pages

# Check deployment status
git status

# View deployment logs
# Go to: https://github.com/WebQx/webqx/actions
```

---

## **Success! Your Platform is Live**

Once deployed, you'll have:
- **Global 24/7 healthcare platform**
- **Mobile PWA experience**
- **Emergency consultation system**
- **Complete patient/provider portals**
- **AI-powered services**
- **Enterprise-grade security**
- **Real-time analytics**

**Your healthcare platform can now serve millions of users worldwide!**
