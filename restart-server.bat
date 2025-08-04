@echo off
echo ========================================
echo Reiniciando servidor MoneyMaker Backend
echo ========================================
echo.

echo Parando servidor anterior...
taskkill /f /im node.exe 2>nul

echo.
echo Instalando dependências...
npm install

echo.
echo Iniciando servidor...
npm run start:dev

echo.
echo Servidor iniciado! Pressione Ctrl+C para parar.
pause 