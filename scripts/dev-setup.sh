#!/bin/bash

echo "🚀 Configurando ambiente de desenvolvimento..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo "📋 Copiando arquivo de ambiente..."
    cp .env.example .env
    echo "⚠️  Configure suas variáveis de ambiente no arquivo .env"
fi

# Subir containers Docker
echo "🐳 Iniciando containers Docker..."
docker-compose up -d postgres redis

# Aguardar PostgreSQL ficar pronto
echo "⏳ Aguardando PostgreSQL..."
until docker-compose exec postgres pg_isready -U postgres; do
    sleep 1
done

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executar migrations
echo "🗃️  Executando migrations..."
npx prisma db push

# Popular banco com dados de exemplo
echo "🌱 Populando banco com dados de exemplo..."
npm run prisma:seed

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Para iniciar a aplicação:"
echo "  npm run start:dev"
echo ""
echo "Para visualizar o banco de dados:"
echo "  npx prisma studio"
echo ""
echo "Para acessar a documentação da API:"
echo "  http://localhost:3000/api/docs" 