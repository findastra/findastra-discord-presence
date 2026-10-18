@echo off
rem Discord Tower: runs every Press Plai file-updater tool that is ON (see discord-tower\README.md).
cd /d "%~dp0"
set "NODE=node"
where node >nul 2>nul || for /d %%D in ("%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*") do if exist "%%D\bin\node.exe" set "NODE=%%D\bin\node.exe"
"%NODE%" discord-tower\file-updater-20261017.mjs all --post
pause
