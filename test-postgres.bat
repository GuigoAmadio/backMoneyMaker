@echo off
echo ========================================
echo   TESTE DE INSTALACAO DO POSTGRESQL
echo ========================================
echo.

echo [1/5] Verificando versao do PostgreSQL...
psql --version
echo.

echo [2/5] Verificando servicos...
powershell -Command "Get-Service postgresql* | Format-Table -AutoSize"
echo.

echo [3/5] Listando bancos de dados (vai pedir senha do usuario postgres)...
echo Digite a senha que voce configurou na instalacao do PostgreSQL:
psql -U postgres -l
echo.

echo [4/5] Testando criacao de banco de dados de teste...
echo Digite a senha novamente:
psql -U postgres -c "CREATE DATABASE test_connection_db;"
echo.

echo [5/5] Removendo banco de teste...
psql -U postgres -c "DROP DATABASE test_connection_db;"
echo.

echo ========================================
echo   TESTE CONCLUIDO!
echo ========================================
echo.
echo Se todos os passos funcionaram, seu PostgreSQL esta 100%% operacional!
echo.
pause

