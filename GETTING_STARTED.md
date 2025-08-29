# 🚀 Guia de Início Rápido - MoneyMaker Backend

## Visão Geral

Este é um backend SaaS multi-tenant robusto construído com **NestJS + TypeScript** para servir múltiplas empresas através de APIs padronizadas.

### 🌟 Características Principais

- ✅ **Multi-tenant** com isolamento completo de dados
- ✅ **Autenticação JWT** com refresh tokens
- ✅ **Autorização por roles** (SUPER_ADMIN, ADMIN, EMPLOYEE, CLIENT)
- ✅ **Validação rigorosa** com class-validator
- ✅ **Documentação automática** com Swagger
- ✅ **Rate limiting** e proteções de segurança
- ✅ **Docker** para desenvolvimento e produção
- ✅ **Banco PostgreSQL** com Prisma ORM
- ✅ **Logs estruturados** e auditoria
- ✅ **Testes automatizados**

## 📋 Pré-requisitos

- **Node.js** 18+
- **Docker** e Docker Compose
- **Git**

## ⚡ Início Rápido

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd moneymaker-backend
```

### 2. Setup Automático

```bash
# Executar script de setup (instala dependências, configura banco, etc.)
./scripts/dev-setup.sh
```

### 3. Iniciar Aplicação

```bash
# Desenvolvimento com hot reload
npm run start:dev

# OU usando Docker
npm run docker:up
```

### 4. Acessar Aplicação

- **API**: https://api.expatriamente.com
- **Documentação**: https://api.expatriamente.com/api/docs
- **Health Check**: https://api.expatriamente.com/api/health

## 🗃️ Banco de Dados

### Visualizar Dados

```bash
# Abrir Prisma Studio
npx prisma studio
```

### Migrations

```bash
# Criar nova migration
npx prisma migrate dev --name nome-da-migration

# Aplicar migrations
npx prisma migrate deploy

# Reset do banco (cuidado!)
npx prisma migrate reset
```

### Recriar Dados de Exemplo

```bash
npm run prisma:seed
```

## 🔑 Credenciais de Teste

**Super Admin:**

- Email: `admin@moneymaker.dev`
- Senha: `Admin123!@#`

**Admin Demo:**

- Email: `admin@demo.moneymaker.dev`
- Senha: `Demo123!@#`

## 🌐 Testando a API

### 1. Login (Obter Token)

```bash
curl -X POST https://api.expatriamente.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: clnt_01h3m5k8y7x9p2q3r4s5t6u7v8w9" \
  -d '{
    "email": "admin@demo.moneymaker.dev",
    "password": "Demo123!@#"
  }'
```

### 2. Usar Token nas Requisições

```bash
curl -X GET https://api.expatriamente.com/api/v1/users \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "x-client-id: clnt_01h3m5k8y7x9p2q3r4s5t6u7v8w9"
```

### 3. Multi-tenancy via Subdomínio

```bash
# Configurar hosts locais
echo "127.0.0.1 demo.localhost" >> /etc/hosts

# Testar via subdomínio
curl -X GET http://demo.localhost:3000/api/v1/users \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📁 Estrutura do Projeto

```
src/
├── common/           # Utilitários, guards, decorators
│   ├── decorators/   # @Tenant(), @CurrentUser(), @Public()
│   ├── filters/      # Filtros de exceção
│   ├── guards/       # Guards de autenticação e autorização
│   ├── interceptors/ # Interceptors de transformação
│   ├── middleware/   # Middleware de tenant
│   └── dto/          # DTOs comuns
├── config/           # Configurações da aplicação
├── database/         # Prisma service e configurações
├── modules/          # Módulos de domínio
│   ├── auth/         # Autenticação (login, register, refresh)
│   ├── users/        # Gestão de usuários
│   ├── clients/      # Gestão de clientes (empresas)
│   ├── appointments/ # Sistema de agendamentos
│   ├── orders/       # Sistema de pedidos
│   ├── products/     # Catálogo de produtos
│   └── dashboard/    # Métricas e dashboard
└── main.ts          # Ponto de entrada da aplicação
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com watch
npm run test:watch

# Testes de cobertura
npm run test:cov

# Testes E2E
npm run test:e2e
```

## 🔧 Comandos Úteis

```bash
# Docker
npm run docker:up        # Subir containers
npm run docker:down      # Parar containers
npm run docker:logs      # Ver logs

# Prisma
npm run prisma:generate  # Gerar cliente
npm run prisma:migrate   # Executar migrations
npm run prisma:seed      # Popular dados

# Qualidade
npm run lint             # ESLint
npm run format           # Prettier
```

## 🚀 Deploy em Produção

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guia completo de deploy.

**Quick deploy:**

```bash
# Configure variáveis de ambiente
cp .env.example .env.production

# Execute deploy
./scripts/prod-deploy.sh
```

## 🛡️ Segurança

### Configurações Implementadas

- ✅ **Helmet** - Headers de segurança
- ✅ **CORS** - Configurável por cliente
- ✅ **Rate Limiting** - Proteção contra spam
- ✅ **JWT** - Tokens seguros com expiração
- ✅ **bcrypt** - Hash seguro de senhas
- ✅ **Validação** - DTOs com class-validator
- ✅ **SQL Injection** - Proteção via Prisma
- ✅ **Auditoria** - Log de ações importantes

### Boas Práticas Aplicadas

- 🔐 Senhas com requisitos mínimos de complexidade
- 🔒 Lock de conta após tentativas falhadas
- 🕐 Expiração automática de tokens
- 📝 Auditoria de todas as operações críticas
- 🏢 Isolamento completo entre tenants

## 📊 Monitoramento

### Health Checks

```bash
# Status básico
curl https://api.expatriamente.com/api/health

# Status detalhado
curl https://api.expatriamente.com/api/health | jq
```

### Logs

```bash
# Logs da aplicação
docker-compose logs -f app

# Logs do banco
docker-compose logs -f postgres
```

## 🆘 Troubleshooting

### Problemas Comuns

**1. Erro de conexão com banco:**

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Recriar containers se necessário
docker-compose down && docker-compose up -d
```

**2. Erro "client not found":**

- Verificar se o header `x-client-id` está sendo enviado
- Confirmar que o cliente existe no banco
- Verificar se o slug/subdomínio está correto

**3. Erro de autenticação:**

- Verificar se o token JWT não expirou
- Confirmar que o header `Authorization: Bearer TOKEN` está correto
- Verificar se o usuário não foi desativado

**4. Erro de permissão:**

- Confirmar que o usuário tem a role necessária
- Verificar se está acessando recursos do tenant correto

### Limpar Dados

```bash
# Reset completo do banco
npx prisma migrate reset

# Recriar dados de exemplo
npm run prisma:seed
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📚 Recursos Adicionais

- [Documentação NestJS](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Swagger/OpenAPI](https://swagger.io/docs/)
- [Docker Documentation](https://docs.docker.com/)

## 📝 Licença

Este projeto está sob a licença MIT. Ver arquivo [LICENSE](LICENSE) para detalhes.

---

## 🎯 Próximos Passos

Após configurar o ambiente:

1. **Explorar a API**: Use a documentação Swagger em `/api/docs`
2. **Implementar funcionalidades**: Adicione novos módulos conforme necessário
3. **Configurar deploy**: Configure seu ambiente de produção
4. **Monitoramento**: Implemente logs e métricas avançadas
5. **Testes**: Adicione testes para suas novas funcionalidades

**Happy coding! 🚀**
