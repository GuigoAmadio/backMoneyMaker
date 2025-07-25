# Dockerfile simplificado para desenvolvimento e produção
FROM node:20-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev ca-certificates

WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Copiar e dar permissão ao script de entrada
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Gerar cliente Prisma
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando de inicialização
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"] 