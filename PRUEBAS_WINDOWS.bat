@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
 py -3 -m unittest discover -s tests -p "test*.py"
) else (
 python -m unittest discover -s tests -p "test*.py"
)
pause
