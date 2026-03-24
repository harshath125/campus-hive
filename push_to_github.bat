@echo off
echo.
echo  =========================================
echo   CAMPUS HIVE - Push to GitHub
echo  =========================================
echo.

cd /d "%~dp0"

:: Check if git is installed
where git >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Git is not installed! Download from https://git-scm.com
    pause
    exit /b 1
)

:: Initialize git if not already
if not exist ".git" (
    echo  [INIT] Initializing Git repository...
    git init
    echo.
)

:: Set user config
git config user.email "harshath.raghava125@gmail.com"
git config user.name "harshath125"

:: Create the GitHub repo URL
set REPO_NAME=campus-hive
set GITHUB_URL=https://github.com/harshath125/%REPO_NAME%.git

:: Check if remote exists
git remote get-url origin >nul 2>nul
if errorlevel 1 (
    echo  [REMOTE] Adding GitHub remote...
    git remote add origin %GITHUB_URL%
) else (
    echo  [REMOTE] Updating GitHub remote...
    git remote set-url origin %GITHUB_URL%
)

:: Stage all files
echo.
echo  [ADD] Staging all files...
git add .

:: Commit
echo  [COMMIT] Creating commit...
git commit -m "Campus Hive - Production Ready (React + Django + Supabase + Docker)"

:: Set main branch
git branch -M main

:: Push
echo.
echo  [PUSH] Pushing to GitHub...
echo  NOTE: If this is your first push, GitHub will ask for login.
echo        Use your GitHub username: harshath125
echo        Use a Personal Access Token as password (NOT your email password)
echo        Generate token at: https://github.com/settings/tokens
echo.
git push -u origin main

echo.
echo  =========================================
echo   DONE! Your code is now on GitHub.
echo   Repo: https://github.com/harshath125/%REPO_NAME%
echo  =========================================
echo.
echo  IMPORTANT: Make the repo PUBLIC!
echo  Go to: https://github.com/harshath125/%REPO_NAME%/settings
echo  Scroll to "Danger Zone" and click "Change visibility" to Public
echo.
pause
