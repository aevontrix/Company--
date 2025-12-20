@echo off
echo ================================================
echo Starting OnTheGo Backend with WebSocket Support
echo ================================================
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

echo [1/3] Checking Redis...
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ Redis is running
) else (
    echo ❌ Redis is NOT running! Please start Redis first.
    echo Run: cd ..\Redis && start redis-server.exe
    pause
    exit /b 1
)

echo.
echo [2/3] Running migrations...
python manage.py migrate

echo.
echo [3/3] Starting Daphne ASGI server...
echo.
echo 🚀 Server will start on http://127.0.0.1:8000
echo 🔌 WebSocket available on ws://127.0.0.1:8000/ws/
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

daphne -b 127.0.0.1 -p 8000 onthego.asgi:application
