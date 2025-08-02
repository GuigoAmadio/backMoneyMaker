#!/bin/bash

echo "🌐 Configurando Nginx para MoneyMaker Backend..."

# Verificar se estamos no diretório correto
if [ ! -f "nginx-production.conf" ]; then
    echo "❌ ERRO: Execute este script no diretório do projeto!"
    exit 1
fi

# Backup da configuração atual
echo "💾 Fazendo backup da configuração atual..."
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Adicionar rate limiting zones ao nginx.conf
echo "🔧 Configurando rate limiting zones..."

# Criar arquivo temporário com as zones
cat > /tmp/nginx-zones.conf << 'EOF'
# Rate limiting zones para MoneyMaker Backend
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;
EOF

# Adicionar as zones ao nginx.conf (dentro do bloco http)
echo "📝 Adicionando zones ao nginx.conf..."
sed -i '/http {/a\    include /tmp/nginx-zones.conf;' /etc/nginx/nginx.conf

# Copiar configuração do site
echo "📋 Copiando configuração do site..."
cp nginx-production.conf /etc/nginx/sites-available/moneymaker-api

# Remover link simbólico existente (se houver)
if [ -L "/etc/nginx/sites-enabled/moneymaker-api" ]; then
    rm /etc/nginx/sites-enabled/moneymaker-api
fi

# Criar novo link simbólico
ln -s /etc/nginx/sites-available/moneymaker-api /etc/nginx/sites-enabled/

# Remover site padrão (se existir)
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
if nginx -t; then
    echo "✅ Configuração válida!"
    
    # Reiniciar Nginx
    echo "🔄 Reiniciando Nginx..."
    systemctl restart nginx
    
    # Verificar status
    echo "📊 Status do Nginx:"
    systemctl status nginx --no-pager -l
    
    echo ""
    echo "✅ Nginx configurado com sucesso!"
    echo "🌐 Acesse: http://72.60.1.234/api/health"
else
    echo "❌ ERRO: Configuração inválida!"
    echo "📋 Logs de erro:"
    nginx -t 2>&1
    
    # Restaurar backup
    echo "🔄 Restaurando configuração anterior..."
    cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
    systemctl restart nginx
    
    exit 1
fi 