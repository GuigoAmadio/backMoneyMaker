#!/bin/bash

echo "🚀 Deploy MoneyMaker Backend - Produção"
echo "========================================"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ ERRO: Execute este script no diretório do projeto!"
    exit 1
fi

# Verificar arquivo de ambiente
if [ ! -f ".env.production" ]; then
    echo "❌ ERRO: Arquivo .env.production não encontrado!"
    echo "   Crie o arquivo com as variáveis de produção"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Limpar cache do Docker
echo "🧹 Limpando cache..."
docker system prune -f

# Fazer pull das últimas mudanças
echo "📥 Atualizando código..."
git pull origin main

# Build e subir containers
echo "🔨 Fazendo build e subindo containers..."
docker-compose --env-file .env.production up -d --build

# Aguardar containers subirem
echo "⏳ Aguardando containers..."
sleep 30

# Verificar status
echo "📊 Verificando status dos containers..."
docker-compose ps

# Verificar logs
echo "📋 Últimos logs da aplicação:"
docker-compose logs --tail=20 app

# Testar health check
echo "🏥 Testando health check..."
sleep 10
curl -f https://api.expatriamente.com/api/health || echo "⚠️ Health check falhou, verifique os logs"

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://SEU_IP/api/health"
echo "📊 Logs: docker-compose logs -f app" 