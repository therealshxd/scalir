@echo off
setlocal
title Bulk Image Optimiser (v0.1)

REM ============================================================
REM  Launches the Bulk Image Optimiser dev server inside WSL and
REM  opens it in your default Windows browser.
REM
REM  Project location in WSL:
REM     /home/shad/projects/bulk-image-optimiser-0.1
REM  (\\wsl.localhost\Ubuntu\home\shad\projects\bulk-image-optimiser-0.1)
REM
REM  Requires Node.js installed inside WSL (see the project README).
REM ============================================================

set "WSLDIR=/home/shad/projects/bulk-image-optimiser-0.1"
set "URL=http://localhost:5173"

echo Starting Bulk Image Optimiser in WSL...
echo Folder: %WSLDIR%
echo.

REM Start the dev server in its own WSL window. A login+interactive shell
REM (-lic) ensures nvm / Node are on PATH. Installs deps on first run.
start "Bulk Image Optimiser - server (close to stop)" wsl.exe bash -lic "cd '%WSLDIR%' || { echo 'Folder not found: %WSLDIR%'; echo 'Did you copy the project there?'; exec bash; }; command -v node >/dev/null 2>&1 || { echo 'Node.js is not installed in WSL - see the project README to install it.'; exec bash; }; [ -d node_modules ] || npm install; npm run dev -- --port 5173 --strictPort"

REM Wait for the server to respond, then open the default browser.
echo Waiting for the server to start...
set /a tries=0
:wait
>nul timeout /t 1 /nobreak
curl -s -o nul %URL% && goto ready
set /a tries+=1
if %tries% lss 60 goto wait

:ready
start "" %URL%
echo.
echo Opened %URL% in your browser.
echo To stop the optimiser, close the "Bulk Image Optimiser - server" window.
timeout /t 5 /nobreak >nul
exit /b 0
