# 🔴 Como Instalar Redis no Windows (RÁPIDO)

## ✅ Resumo do que já está funcionando:

- ✅ PostgreSQL 15 instalado e funcionando (porta 5433)
- ✅ Banco `moneymaker_dev` criado
- ✅ Usuário `moneymaker_user` configurado
- ✅ Migrations aplicadas (18 migrations)
- ✅ Arquivo `.env` configurado

---

## 🔴 Falta instalar: REDIS

### Opção 1: Memurai (RECOMENDADO - Mais fácil)

1. **Baixar Memurai Developer (Gratuito)**

   - Acesse: https://www.memurai.com/get-memurai
   - Baixe a versão **Developer** (gratuita)
   - OU use o link direto: https://dist.memurai.com/releases/Memurai-Developer-v4.0.5-64-bit.msi

2. **Instalar**

   - Execute o arquivo `.msi` baixado
   - Aceite todas as opções padrão
   - O instalador já configura como serviço do Windows

3. **Verificar instalação**

   ```powershell
   # Verificar se está rodando
   Get-Service Memurai

   # Testar
   memurai-cli ping
   # Deve retornar: PONG
   ```

4. **Se não iniciou automaticamente:**
   ```powershell
   Start-Service Memurai
   ```

---

### Opção 2: Redis Portável (Alternativa)

1. **Baixar**

   - https://github.com/tporadowski/redis/releases
   - Baixe: `Redis-x64-5.0.14.1.zip`

2. **Extrair e Instalar**

   ```powershell
   # Criar diretório
   mkdir C:\redis

   # Extrair para C:\redis
   Expand-Archive -Path .\Redis-x64-*.zip -DestinationPath C:\redis

   # Instalar como serviço (como Administrador)
   cd C:\redis
   .\redis-server.exe --service-install redis.windows.conf
   .\redis-server.exe --service-start
   ```

3. **Testar**
   ```powershell
   C:\redis\redis-cli.exe ping
   # Deve retornar: PONG
   ```

---

## 🚀 Depois de instalar o Redis

Execute este comando para testar tudo:

```powershell
npm run start:dev
```

O backend deve iniciar na porta 3000!

---

## 🎯 Configuração Final

Seu `.env` já está configurado:

```env
DATABASE_URL="postgresql://moneymaker_user:postgre123@localhost:5433/moneymaker_dev?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

**PostgreSQL:** Porta 5433 (versão 15)
**Redis:** Porta 6379 (padrão)
**Backend:** Porta 3000

---

## 🔧 Comandos Úteis

```powershell
# Ver serviços PostgreSQL
Get-Service postgresql*

# Ver serviço Redis/Memurai
Get-Service Memurai

# Testar PostgreSQL
psql -U moneymaker_user -d moneymaker_dev -p 5433

# Testar Redis
memurai-cli ping
# ou
C:\redis\redis-cli.exe ping

# Iniciar backend
npm run start:dev

# Ver logs do backend
npm run start:dev
```
