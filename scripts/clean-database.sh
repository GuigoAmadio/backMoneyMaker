#!/bin/bash

echo "🧹 Iniciando limpeza completa da base de dados..."

# Parar containers se estiverem rodando
echo "⏹️ Parando containers..."
docker-compose down

# Remover volumes do banco (isso apaga TODOS os dados)
echo "🗑️ Removendo volumes do banco..."
docker volume rm backend_postgres_data 2>/dev/null || echo "Volume backend_postgres_data não encontrado"
docker volume rm backmoneymaker_postgres_data 2>/dev/null || echo "Volume backmoneymaker_postgres_data não encontrado"
docker volume rm moneymaker_postgres_data 2>/dev/null || echo "Volume moneymaker_postgres_data não encontrado"
echo "Volumes removidos ou não encontrados, continuando..."

# Subir containers novamente
echo "🚀 Subindo containers..."
docker-compose up -d postgres

# Aguardar banco estar pronto
echo "⏳ Aguardando banco estar disponível..."
sleep 10

# Executar migrations (isso recria as tabelas)
echo "📊 Executando migrations..."
npx prisma migrate deploy

# Executar seed
echo "🌱 Executando seed..."
npm run prisma:seed-bemmecare

echo "✅ Limpeza completa concluída!"
echo ""
echo "📊 Base de dados limpa e populada com dados do BemMeCare"
echo "🔑 Credenciais:"
echo "   - Admin: admin@bemmecare.com / admin123"
echo "   - Funcionário: funcionario@bemmecare.com / employee123"
echo ""
echo "🚀 Para iniciar a aplicação: docker-compose up" 