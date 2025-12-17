@echo off
echo ========================================
echo EduFlow/OnTheGo - Project Setup
echo ========================================
echo.

cd /d "%~dp0"

:: Check Python
echo [1/8] Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)
echo.

:: Create virtual environment
echo [2/8] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)
echo.

:: Activate virtual environment
echo [3/8] Activating virtual environment...
call venv\Scripts\activate.bat
echo.

:: Install backend dependencies
echo [4/8] Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..
echo.

:: Create .env file
echo [5/8] Creating .env file...
cd backend
if not exist ".env" (
    copy .env.example .env
    echo .env file created. Please configure it!
) else (
    echo .env file already exists.
)
cd ..
echo.

:: Check PostgreSQL
echo [6/8] Checking PostgreSQL...
psql --version
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL not found or not in PATH!
    echo Please install PostgreSQL and create database manually.
) else (
    echo PostgreSQL found.
)
echo.

:: Create database (optional)
echo [7/8] Do you want to create database? (y/n)
set /p create_db=
if /i "%create_db%"=="y" (
    echo Creating database...
    createdb -U postgres eduflow_db
    if %errorlevel% neq 0 (
        echo WARNING: Could not create database. Please create manually.
    ) else (
        echo Database created successfully!
    )
)
echo.

:: Run migrations
echo [8/8] Running Django migrations...
cd backend
python manage.py makemigrations
python manage.py migrate
cd ..
echo.

echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure backend/.env file
echo 2. Create database if not created: createdb -U postgres eduflow_db
echo 3. Run: python backend/manage.py createsuperuser
echo 4. Start server: python backend/manage.py runserver
echo.
pause