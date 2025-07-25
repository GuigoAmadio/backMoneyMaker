# Script PowerShell AGGRESSIVO para limpeza completa da base de dados

Write-Host "🧹 Iniciando limpeza AGRESSIVA da base de dados..." -ForegroundColor Red

# Parar TODOS os containers Docker (não apenas do projeto)
Write-Host "⏹️ Parando TODOS os containers Docker..." -ForegroundColor Yellow
docker stop $(docker ps -aq) 2>$null
docker rm $(docker ps -aq) 2>$null

# Aguardar um pouco
Start-Sleep -Seconds 5

# Parar containers do projeto especificamente
Write-Host "🛑 Parando containers do projeto..." -ForegroundColor Red
docker-compose down --remove-orphans --volumes

# Aguardar mais um pouco
Start-Sleep -Seconds 3

# Detectar e remover volumes do projeto
Write-Host "🗑️ Detectando e removendo volumes do projeto..." -ForegroundColor Red

# Listar todos os volumes
$volumes = docker volume ls --format "table {{.Name}}" | Select-String -Pattern "postgres_data|redis_data"

foreach ($volume in $volumes) {
    $volumeName = $volume.ToString().Trim()
    if ($volumeName -ne "NAME") {
        Write-Host "Removendo volume: $volumeName" -ForegroundColor Yellow
        # Tentar remover com força
        docker volume rm -f $volumeName 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Volume $volumeName removido" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Volume $volumeName não pode ser removido" -ForegroundColor Yellow
        }
    }
}

# Subir containers novamente
Write-Host "🚀 Subindo containers..." -ForegroundColor Green
docker-compose up -d postgres

# Aguardar banco estar pronto
Write-Host "⏳ Aguardando banco estar disponível..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Executar migrations (isso recria as tabelas)
Write-Host "📊 Executando migrations..." -ForegroundColor Blue
npx prisma migrate deploy

# Executar seed
Write-Host "🌱 Executando seed..." -ForegroundColor Green
npm run prisma:seed-bemmecare

Write-Host "✅ Limpeza AGRESSIVA concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Base de dados limpa e populada com dados do BemMeCare" -ForegroundColor Cyan
Write-Host "🔑 Credenciais:" -ForegroundColor Yellow
Write-Host "   - Admin: admin@bemmecare.com / admin123" -ForegroundColor White
Write-Host "   - Funcionário: funcionario@bemmecare.com / employee123" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para iniciar a aplicação: docker-compose up" -ForegroundColor Green 