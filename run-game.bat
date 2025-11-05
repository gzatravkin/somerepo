@echo off
echo Stopping any existing development server...

REM Kill any existing Node.js processes running on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Kill any npm/node processes that might be running the dev server
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo Starting development server...

REM Start the development server
start /b npm run dev

REM Wait a moment for the server to start
timeout /t 3 /nobreak >nul

echo Opening game in browser...

REM Open the game in default browser
start http://localhost:3000

echo Game should be opening in your browser!
pause