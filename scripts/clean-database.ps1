# Script PowerShell para limpeza completa da base de dados

Write-Host "🧹 Iniciando limpeza completa da base de dados..." -ForegroundColor Green

# Parar containers se estiverem rodando
Write-Host "⏹️ Parando containers..." -ForegroundColor Yellow
docker-compose down

# Remover volumes do banco (isso apaga TODOS os dados)
Write-Host "🗑️ Removendo volumes do banco..." -ForegroundColor Red
docker volume rm backend_postgres_data 2>$null
docker volume rm backmoneymaker_postgres_data 2>$null
docker volume rm moneymaker_postgres_data 2>$null
Write-Host "Volumes removidos ou não encontrados, continuando..." -ForegroundColor Yellow

# Subir containers novamente
Write-Host "🚀 Subindo containers..." -ForegroundColor Green
docker-compose up -d postgres

# Aguardar banco estar pronto
Write-Host "⏳ Aguardando banco estar disponível..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

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