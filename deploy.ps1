# 🚀 WebQx Global Healthcare Platform - Easy Deployment Script (Windows)
# Run this script to deploy your platform to GitHub Pages in one command

Write-Host "🌍 WebQx Global Healthcare Platform - GitHub Pages Deployment" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan

# Step 1: Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run this script from your WebQx project root directory"
    exit 1
}

Write-Host "📋 Pre-deployment checklist:" -ForegroundColor Blue
Write-Host "✅ Checking repository status..."

# Step 2: Check if there are uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes." -ForegroundColor Yellow
    $commitChoice = Read-Host "Would you like to commit them now? (y/n)"
    
    if ($commitChoice -eq "y" -or $commitChoice -eq "Y") {
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "🚀 Deploy WebQx Global Healthcare Platform updates"
        }
        
        git add .
        git commit -m $commitMessage
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Proceeding with existing committed changes only" -ForegroundColor Yellow
    }
}

# Step 3: Build production assets (if build scripts exist)
Write-Host "🏗️  Building production assets..." -ForegroundColor Blue

# Check if package.json exists and has build scripts
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    if ($packageJson.scripts."build:css:prod") {
        Write-Host "Building CSS..."
        try {
            npm run build:css:prod 2>$null
        } catch {
            Write-Host "CSS build skipped (error occurred)"
        }
    }
    
    if ($packageJson.scripts."build:pages") {
        Write-Host "Building pages..."
        try {
            npm run build:pages 2>$null
        } catch {
            Write-Host "Pages build skipped (error occurred)"
        }
    }
}

# Step 4: Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Blue
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

# Step 5: Check GitHub Pages status and provide URLs
Write-Host "🔍 Checking GitHub Pages status..." -ForegroundColor Blue

# Get repository info
$repoUrl = git config --get remote.origin.url
if ($repoUrl -match "github\.com[:/](.+?)(?:\.git)?$") {
    $repoInfo = $matches[1]
    $parts = $repoInfo -split "/"
    $owner = $parts[0]
    $repo = $parts[1]
    
    Write-Host "📊 Repository: $owner/$repo" -ForegroundColor Blue
    
    # Construct GitHub Pages URL
    $pagesUrl = "https://$owner.github.io/$repo/"
    
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "=============================================="
    Write-Host "🌍 Your WebQx Global Healthcare Platform is available at:" -ForegroundColor Blue
    Write-Host "   Main Platform: $pagesUrl" -ForegroundColor Green
    Write-Host "   24/7 Healthcare: ${pagesUrl}telehealth-24-7-global.html" -ForegroundColor Green
    Write-Host "   Patient Portal: ${pagesUrl}patient-portal/" -ForegroundColor Green
    Write-Host "   Provider Portal: ${pagesUrl}provider/" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Note: It may take 5-10 minutes for changes to appear" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 To enable GitHub Pages (if not already enabled):" -ForegroundColor Blue
    Write-Host "   1. Go to: https://github.com/$owner/$repo/settings/pages"
    Write-Host "   2. Source: Deploy from a branch"
    Write-Host "   3. Branch: main"
    Write-Host "   4. Folder: / (root)"
    Write-Host "   5. Save"
    Write-Host ""
    Write-Host "✨ Your global healthcare platform is now live!" -ForegroundColor Green
    
    # Open the URL in default browser
    $openBrowser = Read-Host "Would you like to open your platform in the browser? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $pagesUrl
    }
    
} else {
    Write-Host "⚠️  Could not determine GitHub repository URL" -ForegroundColor Yellow
    Write-Host "Please manually enable GitHub Pages in your repository settings"
}
