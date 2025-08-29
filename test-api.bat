@echo off
echo ========================================
echo Testando API MoneyMaker Backend
echo ========================================
echo.

echo 1. Testando conectividade básica...
curl -X GET "https://api.expatriamente.com/api/health"
echo.
echo.

echo 2. Testando health check do Telegram...
curl -X GET "https://api.expatriamente.com/api/notifications/telegram/public/health"
echo.
echo.

echo 3. Testando conexão do Telegram...
curl -X GET "https://api.expatriamente.com/api/notifications/telegram/public/test"
echo.
echo.

echo 4. Testando envio de mensagem...
curl -X POST "https://api.expatriamente.com/api/notifications/telegram/public/test-message" -H "Content-Type: application/json" -d "{\"message\": \"Teste via script batch\"}"
echo.
echo.

echo 5. Testando status do Telegram...
curl -X GET "https://api.expatriamente.com/api/notifications/telegram/public/status"
echo.
echo.

echo 6. Testando informações do bot...
curl -X GET "https://api.expatriamente.com/api/notifications/telegram/public/bot-info"
echo.
echo.

echo ========================================
echo Testes concluídos!
echo ========================================
pause 