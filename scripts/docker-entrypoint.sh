#!/bin/sh

echo "🚀 Iniciando aplicação MoneyMaker..."

# Aguardar o banco estar disponível
echo "⏳ Aguardando banco de dados..."
npx wait-on tcp:postgres:5432 -t 30000

# Executar migrations
echo "📊 Executando migrations..."
npx prisma migrate deploy

# Verificar se o arquivo dist/main existe
echo "🔍 Verificando build da aplicação..."
if [ ! -f "dist/main.js" ]; then
    echo "❌ ERRO: Arquivo dist/main.js não encontrado!"
    echo "📋 Conteúdo do diretório dist/:"
    ls -la dist/ || echo "Diretório dist/ não existe"
    echo "🔨 Tentando fazer build novamente..."
    npm run build
    if [ ! -f "dist/main.js" ]; then
        echo "❌ ERRO: Build falhou novamente!"
        exit 1
    fi
fi

echo "✅ Build verificado com sucesso!"

# Executar seed (opcional - comentado por enquanto)
# echo "🌱 Executando seed..."
# npx prisma db seed || echo "⚠️ Seed falhou ou já foi executado"

# Iniciar aplicação
echo "✅ Iniciando aplicação NestJS..."
exec "$@" 