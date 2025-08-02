#!/bin/bash

echo "🔍 Verificando configuração para produção..."
echo "=========================================="

# Verificar se o arquivo .env.production existe
if [ ! -f .env.production ]; then
    echo "❌ ERRO: Arquivo .env.production não encontrado!"
    echo "   Crie o arquivo com: cp .env.example .env.production"
    exit 1
fi

# Verificar variáveis obrigatórias
echo "📋 Verificando variáveis de ambiente..."

source .env.production

# Lista de variáveis obrigatórias
required_vars=(
    "NODE_ENV"
    "DATABASE_NAME"
    "DATABASE_USER"
    "DATABASE_PASSWORD"
    "JWT_SECRET"
)

# Verificar cada variável
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ ERRO: Variável $var não está definida!"
        exit 1
    else
        echo "✅ $var está configurada"
    fi
done

# Verificar se JWT_SECRET não é o padrão
if [ "$JWT_SECRET" = "e96e27377004b123200928ce0abaedb1" ]; then
    echo "⚠️  AVISO: JWT_SECRET ainda está com valor padrão!"
    echo "   Gere uma nova chave com: openssl rand -base64 64"
fi

# Verificar se a senha do banco não é padrão
if [ "$DATABASE_PASSWORD" = "postgres123" ]; then
    echo "⚠️  AVISO: DATABASE_PASSWORD ainda está com valor padrão!"
fi

# Verificar Docker
echo ""
echo "🐳 Verificando Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker está instalado"
    docker --version
else
    echo "❌ Docker não está instalado!"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose está instalado"
    docker-compose --version
else
    echo "❌ Docker Compose não está instalado!"
    exit 1
fi

# Verificar Nginx
echo ""
echo "🌐 Verificando Nginx..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx está instalado"
    nginx -v
else
    echo "❌ Nginx não está instalado!"
    exit 1
fi

# Verificar firewall
echo ""
echo "🔥 Verificando Firewall..."
if command -v ufw &> /dev/null; then
    echo "✅ UFW está instalado"
    ufw status
else
    echo "❌ UFW não está instalado!"
    exit 1
fi

echo ""
echo "✅ Verificação concluída!"
echo "🚀 Sistema pronto para produção!"
echo ""
echo "📋 Próximos passos:"
echo "1. docker-compose --env-file .env.production up -d --build"
echo "2. docker-compose logs -f app"
echo "3. curl http://SEU_IP/api/health" 