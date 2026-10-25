@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
where py >nul 2>nul
if not errorlevel 1 goto py_launcher
where python >nul 2>nul
if not errorlevel 1 goto system_python
echo Instala primero Python 3.10 o posterior desde python.org.
set "MAKERIDE_EXIT=2"
goto result
:py_launcher
py -3 "%~dp0prepare_windows.py"
set "MAKERIDE_EXIT=%errorlevel%"
goto result
:system_python
python "%~dp0prepare_windows.py"
set "MAKERIDE_EXIT=%errorlevel%"
:result
if not "%AB_MAKERIDE_NO_PAUSE%"=="1" pause
exit /b %MAKERIDE_EXIT%
