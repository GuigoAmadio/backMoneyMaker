# Dockerfile multi-stage para desenvolvimento e produção
FROM node:20-alpine AS base

# Instalar dependências do sistema necessárias para compilar bcrypt e Prisma
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev ca-certificates
WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Stage para desenvolvimento
FROM base AS development

# Instalar todas as dependências (incluindo dev) - instalação limpa
RUN npm ci

# Copiar código fonte (excluindo node_modules local)
COPY . .

# Copiar e dar permissão ao script de entrada
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Gerar cliente Prisma
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando padrão para desenvolvimento
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Instalar dependências do sistema necessárias para compilar bcrypt e Prisma
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev ca-certificates

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Gerar Prisma Client
RUN npx prisma generate

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Instalar dumb-init e OpenSSL para gerenciamento de processos e Prisma
RUN apk add --no-cache dumb-init openssl ca-certificates

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copiar dependências e código
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=nestjs:nodejs . .

# Copiar e dar permissão ao script de entrada
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Gerar Prisma Client novamente (caso necessário)
RUN npx prisma generate

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Comando de inicialização
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"] 