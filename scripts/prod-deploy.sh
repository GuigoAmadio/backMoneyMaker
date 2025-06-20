#!/bin/bash

echo "🚀 Iniciando deploy em produção..."

# Verificar variáveis de ambiente
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não está definida"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET não está definida"
    exit 1
fi

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Executar migrations em produção
echo "🗃️  Executando migrations..."
npx prisma migrate deploy

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Iniciar aplicação
echo "🚀 Iniciando aplicação..."
npm run start:prod

echo "✅ Deploy concluído!" 