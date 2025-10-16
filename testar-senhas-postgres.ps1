# Script para Testar Senhas Comuns do PostgreSQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTADOR DE SENHAS DO POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pgVersions = @("16", "15")
$commonPasswords = @(
    "postgres",
    "postgres123",
    "postgre123", 
    "admin",
    "admin123",
    "password",
    "12345678",
    "root",
    "",  # Sem senha
    "Postgres123",
    "Admin123"
)

$found = $false

foreach ($pgVersion in $pgVersions) {
    $pgPath = "C:\Program Files\PostgreSQL\$pgVersion\bin"
    
    if (-not (Test-Path "$pgPath\psql.exe")) {
        Write-Host "PostgreSQL $pgVersion nao encontrado, pulando..." -ForegroundColor Gray
        continue
    }
    
    Write-Host ""
    Write-Host "[*] Testando PostgreSQL versao $pgVersion..." -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($password in $commonPasswords) {
        $env:PGPASSWORD = $password
        
        $displayPassword = if ($password -eq "") { "(vazio)" } else { $password }
        Write-Host "  Tentando senha: $displayPassword" -NoNewline
        
        $result = & "$pgPath\psql.exe" -U postgres -c "SELECT version();" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK] FUNCIONOU!" -ForegroundColor Green
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  [+] SENHA ENCONTRADA!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Versao: PostgreSQL $pgVersion" -ForegroundColor White
            Write-Host "Usuario: postgres" -ForegroundColor White
            Write-Host "Senha: $displayPassword" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Criar o banco do projeto agora? (S/N)" -ForegroundColor Cyan
            $create = Read-Host
            
            if ($create -eq "S" -or $create -eq "s") {
                Write-Host ""
                Write-Host "Digite a senha para o usuario 'moneymaker_user':" -ForegroundColor Yellow
                $dbPassword = Read-Host
                
                $env:PGPASSWORD = $password
                
                & "$pgPath\psql.exe" -U postgres -c "CREATE DATABASE moneymaker_dev;"
                & "$pgPath\psql.exe" -U postgres -c "CREATE USER moneymaker_user WITH ENCRYPTED PASSWORD '$dbPassword';"
                & "$pgPath\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE moneymaker_dev TO moneymaker_user;"
                & "$pgPath\psql.exe" -U postgres -c "ALTER DATABASE moneymaker_dev OWNER TO moneymaker_user;"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "[OK] Banco 'moneymaker_dev' criado com sucesso!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Adicione ao seu arquivo .env:" -ForegroundColor Yellow
                    Write-Host ""
                    Write-Host "DATABASE_URL=`"postgresql://moneymaker_user:$dbPassword@localhost:5432/moneymaker_dev?schema=public`"" -ForegroundColor White
                    Write-Host "REDIS_HOST=localhost" -ForegroundColor White
                    Write-Host "REDIS_PORT=6379" -ForegroundColor White
                }
            }
            
            $found = $true
            break
        } else {
            Write-Host " [X]" -ForegroundColor Red
        }
    }
    
    if ($found) {
        break
    }
}

if (-not $found) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  [X] NENHUMA SENHA FUNCIONOU" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Voce precisa resetar a senha do PostgreSQL." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Execute o script:" -ForegroundColor White
    Write-Host "  .\reset-postgres-password.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[!] IMPORTANTE: Execute o PowerShell como ADMINISTRADOR!" -ForegroundColor Yellow
}

Write-Host ""
pause

