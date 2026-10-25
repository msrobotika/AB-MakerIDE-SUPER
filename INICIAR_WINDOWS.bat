@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
if exist "%~dp0.venv\Scripts\python.exe" goto local_python
where py >nul 2>nul
if not errorlevel 1 goto py_launcher
where python >nul 2>nul
if not errorlevel 1 goto system_python
echo No se encontro Python. Instala Python 3.10 o posterior desde python.org.
echo Tus proyectos no se han modificado.
set "MAKERIDE_EXIT=2"
goto failed
:local_python
"%~dp0.venv\Scripts\python.exe" "%~dp0launch.py" %*
goto result
:py_launcher
py -3 "%~dp0launch.py" %*
goto result
:system_python
python "%~dp0launch.py" %*
:result
set "MAKERIDE_EXIT=%errorlevel%"
if "%MAKERIDE_EXIT%"=="0" exit /b 0
:failed
echo.
echo No se pudo completar el arranque. Consulta docs\INSTALACION.md.
if not "%AB_MAKERIDE_NO_PAUSE%"=="1" pause
exit /b %MAKERIDE_EXIT%
