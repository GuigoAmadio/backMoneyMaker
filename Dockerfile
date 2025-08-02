# Dockerfile otimizado para produção
FROM node:20-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev ca-certificates

WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências de produção
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Copiar e dar permissão ao script de entrada
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando de inicialização
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"] 