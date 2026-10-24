@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
where arduino-cli >nul 2>nul
if errorlevel 1 if exist "C:\Program Files\Arduino CLI\arduino-cli.exe" set "PATH=C:\Program Files\Arduino CLI;%PATH%"
echo =============================================================
echo   AB MakerIDE SUPER v0.9.7 - MS Robotika
 echo   Interfaz: http://127.0.0.1:8765
 echo   Cierra las versiones anteriores antes de arrancar.
echo =============================================================
where py >nul 2>nul
if not errorlevel 1 (
  py -3 server.py
) else (
  python server.py
)
if errorlevel 1 (
  echo.
  echo No se pudo iniciar. Revisa Python 3.10+, el puerto 8765 y las dependencias.
  pause
)
