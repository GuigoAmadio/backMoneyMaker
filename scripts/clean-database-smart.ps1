# Script PowerShell inteligente para limpeza completa da base de dados

Write-Host "🧹 Iniciando limpeza completa da base de dados..." -ForegroundColor Green

# Parar TODOS os containers do projeto
Write-Host "⏹️ Parando todos os containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Aguardar um pouco para garantir que containers foram parados
Start-Sleep -Seconds 3

# Forçar parada de containers que possam estar rodando
Write-Host "🛑 Forçando parada de containers..." -ForegroundColor Red
docker-compose kill 2>$null
docker-compose rm -f 2>$null

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
            Write-Host "⚠️ Volume $volumeName não pode ser removido (pode estar em uso)" -ForegroundColor Yellow
        }
    }
}

# Subir containers novamente
Write-Host "🚀 Subindo containers..." -ForegroundColor Green
docker-compose up -d postgres

# Aguardar banco estar pronto
Write-Host "⏳ Aguardando banco estar disponível..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Executar migrations (isso recria as tabelas)
Write-Host "📊 Executando migrations..." -ForegroundColor Blue
npx prisma migrate deploy

# Executar seed
Write-Host "🌱 Executando seed..." -ForegroundColor Green
npm run prisma:seed-bemmecare

Write-Host "✅ Limpeza completa concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Base de dados limpa e populada com dados do BemMeCare" -ForegroundColor Cyan
Write-Host "🔑 Credenciais:" -ForegroundColor Yellow
Write-Host "   - Admin: admin@bemmecare.com / admin123" -ForegroundColor White
Write-Host "   - Funcionário: funcionario@bemmecare.com / employee123" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para iniciar a aplicação: docker-compose up" -ForegroundColor Green 