@echo off
cd /d "%~dp0"
echo. >> run.log
echo === Run started on %date% %time% === >> run.log
node src/main.js >> run.log 2>&1