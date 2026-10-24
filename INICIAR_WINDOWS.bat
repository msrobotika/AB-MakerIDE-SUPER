@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
if not defined AB_MAKERIDE_DATA_DIR set "AB_MAKERIDE_DATA_DIR=%~dp0.makeride-data"
where arduino-cli >nul 2>nul
if errorlevel 1 if exist "C:\Program Files\Arduino CLI\arduino-cli.exe" set "PATH=C:\Program Files\Arduino CLI;%PATH%"
echo =============================================================
echo   AB MakerIDE SUPER v1.0.0-rc.1 - MS Robotika
 echo   Interfaz: http://127.0.0.1:8770
 echo   Datos de esta version: carpeta local .makeride-data.
echo =============================================================
where py >nul 2>nul
if not errorlevel 1 (
  py -3 server.py --port 8770
) else (
  python server.py --port 8770
)
if errorlevel 1 (
  echo.
  echo No se pudo iniciar. Revisa Python 3.10+, el puerto 8770 y las dependencias.
  pause
)
