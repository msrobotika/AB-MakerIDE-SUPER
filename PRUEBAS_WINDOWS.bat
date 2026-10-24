@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
 py -3 tests/run_isolated.py
) else (
 python tests/run_isolated.py
)
pause
