# Script para Resetar Senha do PostgreSQL
# Execute como ADMINISTRADOR!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESETAR SENHA DO POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERRO: Este script precisa ser executado como ADMINISTRADOR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clique com botão direito no PowerShell e escolha 'Executar como Administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

# Escolher versão do PostgreSQL
Write-Host "Qual versão do PostgreSQL você quer usar?" -ForegroundColor Yellow
Write-Host "1) PostgreSQL 16 (porta 5432)" -ForegroundColor White
Write-Host "2) PostgreSQL 15 (porta 5433)" -ForegroundColor White
Write-Host ""
$version = Read-Host "Digite 1 ou 2"

if ($version -eq "1") {
    $pgVersion = "16"
    $serviceName = "postgresql-x64-16"
} elseif ($version -eq "2") {
    $pgVersion = "15"
    $serviceName = "postgresql-x64-15"
} else {
    Write-Host "❌ Opção inválida!" -ForegroundColor Red
    pause
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\$pgVersion"
$dataPath = "$pgPath\data"
$configFile = "$dataPath\pg_hba.conf"
$backupFile = "$dataPath\pg_hba.conf.backup"

# Verificar se o arquivo existe
if (-not (Test-Path $configFile)) {
    Write-Host "❌ Arquivo não encontrado: $configFile" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "[1/6] Fazendo backup do arquivo de configuração..." -ForegroundColor Green
Copy-Item $configFile $backupFile -Force
Write-Host "✅ Backup criado em: $backupFile" -ForegroundColor Green

Write-Host ""
Write-Host "[2/6] Modificando pg_hba.conf para permitir acesso sem senha..." -ForegroundColor Green

# Ler o arquivo e substituir as autenticações
$content = Get-Content $configFile
$newContent = $content | ForEach-Object {
    if ($_ -match "^host\s+all\s+all\s+127\.0\.0\.1/32\s+(scram-sha-256|md5)") {
        $_ -replace "(scram-sha-256|md5)", "trust"
    } elseif ($_ -match "^host\s+all\s+all\s+::1/128\s+(scram-sha-256|md5)") {
        $_ -replace "(scram-sha-256|md5)", "trust"
    } else {
        $_
    }
}

$newContent | Set-Content $configFile
Write-Host "✅ Arquivo modificado!" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] Reiniciando serviço PostgreSQL..." -ForegroundColor Green
Restart-Service $serviceName
Start-Sleep -Seconds 3
Write-Host "✅ Serviço reiniciado!" -ForegroundColor Green

Write-Host ""
Write-Host "[4/6] Digite a NOVA SENHA que você quer usar:" -ForegroundColor Yellow
$newPassword = Read-Host "Nova senha"

Write-Host ""
Write-Host "[5/6] Alterando senha do usuário 'postgres'..." -ForegroundColor Green

# Criar script SQL temporário
$sqlScript = @"
ALTER USER postgres PASSWORD '$newPassword';
"@

$sqlScript | & "$pgPath\bin\psql.exe" -U postgres -d postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Senha alterada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao alterar senha!" -ForegroundColor Red
}

Write-Host ""
Write-Host "[6/6] Restaurando configuração de segurança..." -ForegroundColor Green

# Restaurar o arquivo original
$content = Get-Content $configFile
$finalContent = $content | ForEach-Object {
    if ($_ -match "^host\s+all\s+all\s+127\.0\.0\.1/32\s+trust") {
        $_ -replace "trust", "scram-sha-256"
    } elseif ($_ -match "^host\s+all\s+all\s+::1/128\s+trust") {
        $_ -replace "trust", "scram-sha-256"
    } else {
        $_
    }
}

$finalContent | Set-Content $configFile
Write-Host "✅ Configuração de segurança restaurada!" -ForegroundColor Green

Write-Host ""
Write-Host "Reiniciando serviço novamente..." -ForegroundColor Green
Restart-Service $serviceName
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ PROCESSO CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sua nova senha para o usuário 'postgres' é: $newPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Testando conexão..." -ForegroundColor Green
Write-Host ""

# Tentar conectar
$env:PGPASSWORD = $newPassword
& "$pgPath\bin\psql.exe" -U postgres -c "SELECT version();"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCESSO! PostgreSQL está funcionando com a nova senha!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ Houve um problema. Você pode restaurar o backup em:" -ForegroundColor Yellow
    Write-Host $backupFile -ForegroundColor White
}

Write-Host ""
pause

