@echo off
echo === MASTRO FIX: Pulizia cache ===
cd /d C:\Users\fabio\Desktop\mastro-erp

echo Chiudo node...
taskkill /f /im node.exe 2>nul

echo Cancello .next...
if exist .next rmdir /s /q .next

echo Cancello node_modules\.cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Cancello tsconfig.tsbuildinfo...
if exist tsconfig.tsbuildinfo del tsconfig.tsbuildinfo

echo.
echo === Cache pulita! Ora riavvia: npm run dev ===
pause
