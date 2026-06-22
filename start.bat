@echo off
REM Double-click to start EBE. Keep this window open — it IS the server.
cd /d "%~dp0"
echo Starting EBE ORB...  (keep this window open; open http://localhost:8080 in your browser)
call npm run dev:api
pause
