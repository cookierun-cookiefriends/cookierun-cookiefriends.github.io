@echo off
REM Cookiefriends OCR launcher - Python 3.13 (paddle 3.2.0 compatible; 3.14 unsupported)
py -3.13 "%~dp0ocr\main.py"
if errorlevel 1 pause
