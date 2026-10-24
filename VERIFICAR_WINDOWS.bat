@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo AB MakerIDE v0.9.7 - pruebas automaticas
 echo ===============================================
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 -m unittest discover -s tests -v
) else (
    python -m unittest discover -s tests -v
)
echo.
echo Recuerda: estos tests no sustituyen las pruebas USB y firmware.
pause
