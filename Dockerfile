# Dockerfile otimizado para produção - Multi-stage build
FROM node:20-alpine AS builder

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev ca-certificates

WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Verificar se o build foi criado
RUN ls -la dist/

# Remover dev dependencies após o build
RUN npm prune --production

# Stage de produção
FROM node:20-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat openssl ca-certificates

WORKDIR /usr/src/app

# Copiar package.json e prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Copiar node_modules de produção do builder (já instalado e pronto)
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copiar o build do stage anterior
COPY --from=builder /usr/src/app/dist ./dist

# Copiar e dar permissão ao script de entrada
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expor porta
EXPOSE 3000

# Comando de inicialização
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"] 