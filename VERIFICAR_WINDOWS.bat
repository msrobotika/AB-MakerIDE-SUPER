@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo AB MakerIDE v1.0.0-rc.1 - pruebas automaticas
 echo ===============================================
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 tests/run_isolated.py
) else (
    python tests/run_isolated.py
)
echo.
echo Recuerda: estos tests no sustituyen las pruebas USB y firmware.
pause
