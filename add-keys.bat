@echo off
REM ============================================================
REM  EBE ORB - Key Setup. Double-click this. It writes apps\api\.env
REM  for you so you never have to find the folder or make the file.
REM  Just paste each key when asked, or press ENTER to skip.
REM ============================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "ENVDIR=apps\api"
set "ENVFILE=%ENVDIR%\.env"

if not exist "%ENVDIR%" (
  echo.
  echo  Could not find the "apps\api" folder next to this script.
  echo  Make sure add-keys.bat is inside your EBE ORB project folder.
  echo.
  pause
  exit /b 1
)

echo.
echo  ================== EBE ORB KEY SETUP ==================
echo  Paste each key and press ENTER. To skip one, just press ENTER.
echo  (Your typing may look invisible when you paste - that's fine.)
echo  ======================================================
echo.

set "OPENAI="
set "ANTHROPIC="
set "GEMINI="

set /p "GEMINI=Google AI Studio (Gemini) key: "
set /p "OPENAI=OpenAI (ChatGPT) key  [optional]: "
set /p "ANTHROPIC=Anthropic (Claude) key [optional]: "

echo.
if exist "%ENVFILE%" (
  copy /y "%ENVFILE%" "%ENVFILE%.backup" >nul
  echo  ^(Saved your old settings to .env.backup just in case.^)
)
echo  Writing keys to %ENVFILE% ...

> "%ENVFILE%" echo PORT=8080
>> "%ENVFILE%" echo.
>> "%ENVFILE%" echo # ORB Multi-Model Council keys
if not "!OPENAI!"=="" (>> "%ENVFILE%" echo OPENAI_API_KEY=!OPENAI!)
if not "!ANTHROPIC!"=="" (>> "%ENVFILE%" echo ANTHROPIC_API_KEY=!ANTHROPIC!)
if not "!GEMINI!"=="" (>> "%ENVFILE%" echo GEMINI_API_KEY=!GEMINI!)
>> "%ENVFILE%" echo.
>> "%ENVFILE%" echo # Google sign-in (Gmail + Calendar) - add later if you want
>> "%ENVFILE%" echo GOOGLE_REDIRECT_URI=http://localhost:8080/api/orb/oauth/google/callback

echo.
echo  Done!  Your keys are saved.
echo.
echo  Next: close any running ORB window, then double-click start.bat
echo  to launch ORB with your new keys.
echo.
echo  To check it worked, open this in your browser after starting:
echo     http://localhost:8080/api/orb/status
echo  You should see  "gemini": true
echo.
pause
