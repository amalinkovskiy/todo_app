@echo off
echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo Installing dependencies...
npm install

echo Starting the server...
npm start
