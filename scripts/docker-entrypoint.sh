#!/bin/sh

echo "🚀 Iniciando aplicação MoneyMaker..."

# Aguardar o banco estar disponível
echo "⏳ Aguardando banco de dados..."
npx wait-on tcp:postgres:5432 -t 30000

# Executar migrations
echo "📊 Executando migrations..."
npx prisma migrate deploy

# Executar seed (se necessário)
echo "🌱 Executando seed..."
npx prisma db seed || echo "⚠️ Seed falhou ou já foi executado"

# Iniciar aplicação
echo "✅ Iniciando aplicação NestJS..."
exec "$@" 