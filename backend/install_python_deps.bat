@echo off
echo Installing Python dependencies for face verification...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://python.org
    pause
    exit /b 1
)

echo Python found. Installing required packages...
pip install -r requirements.txt

if %errorlevel% equ 0 (
    echo.
    echo ✅ Python dependencies installed successfully!
    echo You can now use the Python-based face verification system.
) else (
    echo.
    echo ❌ Failed to install Python dependencies.
    echo Please check your internet connection and try again.
)

pause
