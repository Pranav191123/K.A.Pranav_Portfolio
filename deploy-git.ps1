# ==============================================================================
# Git Deployment Script for Karampudi Acharya Pranav Portfolio
# Email: pran.acharya.eng@gmail.com
# ==============================================================================

param(
    [string]$RepoUrl = ""
)

$gitExe = "git"
$commonPaths = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        $gitExe = $path
        break
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Karampudi Acharya Pranav - Git Portfolio Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Configuring Git author identity..." -ForegroundColor Yellow

& $gitExe config --global user.name "Karampudi Acharya Pranav"
& $gitExe config --global user.email "pran.acharya.eng@gmail.com"

Write-Host "Initializing Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    & $gitExe init
}

Write-Host "Staging all files..." -ForegroundColor Yellow
& $gitExe add .

Write-Host "Creating initial commit..." -ForegroundColor Yellow
& $gitExe commit -m "Deploy Karampudi Acharya Pranav Mechanical CAD & Turnkey Portfolio" -q

& $gitExe branch -M main

Write-Host "`n[SUCCESS] Local Git repository initialized and committed with:" -ForegroundColor Green
Write-Host "  Author: Karampudi Acharya Pranav <pran.acharya.eng@gmail.com>" -ForegroundColor Green
Write-Host "  Branch: main" -ForegroundColor Green

if ($RepoUrl -ne "") {
    Write-Host "`nConnecting to remote repository: $RepoUrl" -ForegroundColor Yellow
    & $gitExe remote remove origin 2>$null
    & $gitExe remote add origin $RepoUrl
    Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow
    & $gitExe push -u origin main
    Write-Host "`n[DONE] Code pushed successfully to $RepoUrl!" -ForegroundColor Green
} else {
    Write-Host "`n----------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "Next Step to Push to your GitHub account:" -ForegroundColor White
    Write-Host "1. Create a repository on https://github.com/new (e.g. 'portfolio')" -ForegroundColor White
    Write-Host "2. Run this command with your GitHub repo URL:" -ForegroundColor White
    Write-Host "   .\deploy-git.ps1 -RepoUrl https://github.com/<your-username>/<repo-name>.git" -ForegroundColor Green
    Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
}
