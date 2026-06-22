@echo off
REM One-click start for ORB's voice engine on your Alienware GPU.
echo ============================================
echo   ORB Voice Engine - starting on your GPU
echo ============================================
echo.
echo [1/2] Building and starting the engine...
docker compose up -d --build
if %errorlevel% neq 0 (
  echo.
  echo Could not start Docker. Make sure Docker Desktop is open and running, then try again.
  pause
  exit /b 1
)
echo.
echo Engine is up. Health check: http://localhost:8000/health
echo.
echo [2/2] Opening a public tunnel. COPY the https://...trycloudflare.com URL below
echo        and paste it into Render as ORB_VOICE_ENGINE_URL.
echo.
cloudflared tunnel --url http://localhost:8000
pause
