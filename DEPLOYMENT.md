# Guia de Deployment - MoneyMaker Backend

## 🚀 Deploy em Produção

### Pré-requisitos

- Docker e Docker Compose instalados
- PostgreSQL configurado
- Redis (opcional para cache)
- Domínio configurado

### Configuração de Ambiente

1. **Configure as variáveis de ambiente de produção:**

```bash
# Copiar arquivo de exemplo
cp .env.example .env.production

# Editar com dados de produção
nano .env.production
```

2. **Variáveis obrigatórias:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=sua-chave-jwt-super-secreta-64-caracteres
JWT_REFRESH_SECRET=sua-chave-refresh-super-secreta-64-caracteres
ENCRYPTION_KEY=sua-chave-encriptacao-32-caracteres
```

### Deploy com Docker

1. **Build e subir containers:**

```bash
# Produção com Docker Compose
docker-compose --profile production up -d

# Ou usar script automatizado
chmod +x scripts/prod-deploy.sh
./scripts/prod-deploy.sh
```

2. **Verificar logs:**

```bash
docker-compose logs -f app-prod
```

### Deploy Manual

1. **Instalar dependências:**

```bash
npm ci --production
```

2. **Build da aplicação:**

```bash
npm run build
```

3. **Executar migrations:**

```bash
npx prisma migrate deploy
npx prisma generate
```

4. **Iniciar aplicação:**

```bash
npm run start:prod
```

### Configuração do Nginx

```nginx
server {
    listen 80;
    server_name api.seudominio.com *.seudominio.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.seudominio.com *.seudominio.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Monitoramento

1. **Health Checks:**

```bash
# Verificar status da aplicação
curl https://api.seudominio.com/api/health

# Verificar documentação
curl https://api.seudominio.com/api/docs
```

2. **Logs:**

```bash
# Docker logs
docker-compose logs -f app-prod

# PM2 (se usando)
pm2 logs moneymaker-backend
```

### Backup do Banco de Dados

```bash
# Backup manual
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup automático (cron)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz
```

### SSL/TLS

**Com Let's Encrypt:**

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d api.seudominio.com

# Renovação automática
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### Troubleshooting

**Problemas comuns:**

1. **Erro de conexão com banco:**
   - Verificar DATABASE_URL
   - Confirmar que PostgreSQL está rodando
   - Testar conectividade de rede

2. **Erro de JWT:**
   - Verificar JWT_SECRET
   - Confirmar expiração dos tokens

3. **Performance lenta:**
   - Verificar logs de queries (Prisma)
   - Analisar uso de CPU/memória
   - Considerar cache com Redis

### Escalabilidade

1. **Load Balancing:**
   - Usar múltiplas instâncias da aplicação
   - Configurar load balancer (Nginx/HAProxy)

2. **Database Scaling:**
   - Read replicas para consultas
   - Connection pooling (PgBouncer)

3. **Cache:**
   - Implementar Redis para cache
   - CDN para assets estáticos

### Segurança

1. **Firewall:**
   - Bloquear portas desnecessárias
   - Permitir apenas conexões HTTPS

2. **Database:**
   - Usar usuário com privilégios limitados
   - Criptografar conexões (SSL)

3. **Aplicação:**
   - Rate limiting configurado
   - CORS restritivo
   - Headers de segurança

### Monitoramento Avançado

**Com PM2:**

```bash
# Instalar PM2
npm install -g pm2

# Criar ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'moneymaker-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Logs estruturados:**

- Configurar log aggregation (ELK Stack)
- Monitoramento de métricas (Prometheus/Grafana)
- Alertas automáticos para erros críticos 