# 🚀 Guia de Setup para Produção - MoneyMaker Backend

## ✅ Status do Sistema

O sistema foi **otimizado para produção** com as seguintes melhorias:

### **🔧 Otimizações Implementadas:**

1. **Dockerfile otimizado:**

   - ✅ `npm ci --only=production` (apenas dependências de produção)
   - ✅ Build da aplicação incluído
   - ✅ Comando alterado para `start:prod`

2. **Docker Compose otimizado:**

   - ✅ Variáveis de ambiente para JWT_SECRET
   - ✅ NODE_ENV configurado para produção
   - ✅ Remoção de valores hardcoded

3. **Arquivos de configuração:**
   - ✅ `.dockerignore` otimizado
   - ✅ Scripts de verificação e deploy
   - ✅ Configuração Nginx para produção

## 📋 Checklist de Produção

### **1. Configuração da VPS:**

- ✅ Docker instalado
- ✅ Docker Compose instalado
- ✅ Nginx instalado
- ✅ UFW configurado
- ✅ Certbot instalado

### **2. Arquivos de Configuração:**

- [ ] Criar `.env.production`
- [ ] Configurar variáveis de ambiente
- [ ] Configurar Nginx
- [ ] Testar configurações

### **3. Deploy:**

- [ ] Clonar repositório
- [ ] Executar deploy
- [ ] Verificar logs
- [ ] Testar API

## 🚀 Comandos de Deploy

### **1. Preparar ambiente:**

```bash
# Na VPS
cd /opt/moneymaker-backend
git clone https://github.com/GuigoAmadio/backMoneyMaker.git .
```

### **2. Configurar variáveis:**

```bash
# Criar arquivo de produção
cp .env.example .env.production
nano .env.production
```

**Conteúdo mínimo do .env.production:**

```env
NODE_ENV=production
DATABASE_NAME=moneymaker_prod
DATABASE_USER=moneymaker_user
DATABASE_PASSWORD=sua_senha_super_segura
JWT_SECRET=sua_chave_jwt_super_secreta_64_caracteres
JWT_EXPIRATION=30d
```

### **3. Configurar Nginx:**

```bash
# Copiar configuração otimizada
cp nginx-production.conf /etc/nginx/sites-available/moneymaker-api

# Ativar configuração
ln -s /etc/nginx/sites-available/moneymaker-api /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Testar e reiniciar
nginx -t
systemctl restart nginx
```

### **4. Verificar configuração:**

```bash
# Executar script de verificação
bash scripts/check-production.sh
```

### **5. Fazer deploy:**

```bash
# Deploy automático
bash scripts/deploy-production.sh

# Ou manualmente:
docker-compose --env-file .env.production up -d --build
```

## 🔍 Verificações Pós-Deploy

### **1. Status dos containers:**

```bash
docker-compose ps
```

### **2. Logs da aplicação:**

```bash
docker-compose logs -f app
```

### **3. Testar API:**

```bash
# Health check
curl http://72.60.1.234/api/health

# Testar autenticação
curl -X POST http://72.60.1.234/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### **4. Verificar banco:**

```bash
docker-compose exec postgres psql -U moneymaker_user -d moneymaker_prod -c "SELECT version();"
```

## 🔧 Comandos Úteis

### **Logs:**

```bash
# Logs em tempo real
docker-compose logs -f

# Logs específicos
docker-compose logs -f app
docker-compose logs -f postgres
```

### **Manutenção:**

```bash
# Reiniciar aplicação
docker-compose restart app

# Atualizar código
git pull && docker-compose --env-file .env.production up -d --build

# Backup do banco
docker-compose exec postgres pg_dump -U moneymaker_user moneymaker_prod > backup.sql
```

### **Monitoramento:**

```bash
# Status dos containers
docker stats

# Uso de disco
df -h

# Uso de memória
free -h
```

## 🛡️ Segurança

### **Firewall (já configurado):**

- ✅ Porta 22 (SSH)
- ✅ Porta 80 (HTTP)
- ✅ Porta 443 (HTTPS)

### **SSL/TLS (próximo passo):**

```bash
# Configurar SSL
sudo certbot --nginx -d seu-dominio.com
```

### **Backup automático:**

```bash
# Adicionar ao crontab
0 2 * * * docker-compose exec postgres pg_dump -U moneymaker_user moneymaker_prod | gzip > /backups/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz
```

## 📊 Monitoramento

### **Prometheus (já configurado):**

- Acesse: `http://72.60.1.234:9090`
- Métricas da aplicação disponíveis

### **Logs estruturados:**

- Logs em `/opt/moneymaker-backend/logs/`
- Rotação automática configurada

## 🚨 Troubleshooting

### **Problema: Container não sobe**

```bash
# Verificar logs
docker-compose logs app

# Verificar variáveis de ambiente
docker-compose config
```

### **Problema: Banco não conecta**

```bash
# Verificar se PostgreSQL está rodando
docker-compose exec postgres pg_isready

# Verificar credenciais
docker-compose exec postgres psql -U moneymaker_user -d moneymaker_prod
```

### **Problema: Nginx não funciona**

```bash
# Verificar configuração
nginx -t

# Verificar status
systemctl status nginx

# Verificar logs
tail -f /var/log/nginx/error.log
```

## ✅ Sistema Pronto!

Seu sistema está **otimizado e pronto para produção** com:

- ✅ **Performance otimizada**
- ✅ **Segurança configurada**
- ✅ **Monitoramento ativo**
- ✅ **Scripts de automação**
- ✅ **Documentação completa**

**Próximo passo: Execute o deploy na VPS!** 🚀
