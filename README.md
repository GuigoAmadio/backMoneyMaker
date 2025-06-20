# MoneyMaker Backend - SaaS Multi-tenant

Backend robusto e escalável em **NestJS + TypeScript** para servir múltiplas empresas através de APIs padronizadas.

## 🚀 Características

- **Multi-tenant**: Suporte a múltiplos clientes com isolamento de dados via `client_id`
- **Modular**: Arquitetura limpa e escalável por domínio
- **Seguro**: JWT, bcrypt, rate limiting, validação de entrada, proteção contra ataques comuns
- **Dockerizado**: Pronto para produção com Docker Compose
- **API RESTful**: Versionada com Swagger para documentação

## 🏗️ Tecnologias

- **NestJS** - Framework Node.js progressivo
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **Prisma ORM** - ORM type-safe
- **JWT** - Autenticação stateless
- **bcrypt** - Hash seguro de senhas
- **Docker** - Containerização
- **Class Validator** - Validação de DTOs

## 📋 Pré-requisitos

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

## 🔧 Instalação

1. **Clone e configure:**
```bash
git clone <repository>
cd moneymaker-backend
cp .env.example .env
```

2. **Instale dependências:**
```bash
npm install
```

3. **Configure o banco:**
```bash
# Subir containers
npm run docker:up

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Popular com dados iniciais
npm run prisma:seed
```

4. **Inicie a aplicação:**
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

## 🌐 APIs Disponíveis

### Autenticação
- `POST /api/v1/auth/register` - Registro de usuário
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/logout` - Logout

### Usuários
- `GET /api/v1/users` - Listar usuários do cliente
- `POST /api/v1/users` - Criar usuário
- `PUT /api/v1/users/:id` - Atualizar usuário
- `DELETE /api/v1/users/:id` - Deletar usuário

### Agendamentos
- `GET /api/v1/appointments` - Listar agendamentos
- `POST /api/v1/appointments` - Criar agendamento
- `PUT /api/v1/appointments/:id` - Atualizar agendamento
- `DELETE /api/v1/appointments/:id` - Cancelar agendamento

### Pedidos
- `GET /api/v1/orders` - Listar pedidos
- `POST /api/v1/orders` - Criar pedido
- `PUT /api/v1/orders/:id` - Atualizar pedido

## 🔒 Multi-tenancy

O sistema identifica o cliente através de:

1. **Header**: `x-client-id`
2. **Subdomínio**: `empresa.seudominio.com`
3. **JWT**: Campo `clientId` no token

Todas as consultas são automaticamente filtradas por `client_id`.

## 🛡️ Segurança

- **Rate Limiting**: Proteção contra spam e ataques de força bruta
- **CORS**: Configurável por cliente
- **Helmet**: Headers de segurança
- **Validação**: DTOs com class-validator
- **Hash de senhas**: bcrypt com salt alto
- **JWT**: Tokens seguros com expiração
- **SQL Injection**: Proteção via Prisma ORM
- **Auditoria**: Log de todas as ações importantes

## 📁 Estrutura do Projeto

```
src/
├── common/           # Utilities, guards, decorators, pipes
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   ├── guards/       # Auth & role guards
│   ├── interceptors/ # Request/response interceptors
│   ├── middleware/   # Custom middleware
│   └── pipes/        # Validation pipes
├── config/           # Configurações da aplicação
├── modules/          # Módulos de domínio
│   ├── auth/         # Autenticação e autorização
│   ├── users/        # Gestão de usuários
│   ├── clients/      # Gestão de clientes (empresas)
│   ├── appointments/ # Sistema de agendamentos
│   ├── orders/       # Sistema de pedidos
│   ├── products/     # Catálogo de produtos
│   └── dashboard/    # Painel administrativo
└── database/         # Prisma client e utilitários
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

## 🚀 Deploy

### Desenvolvimento
```bash
docker-compose up
```

### Produção
```bash
docker-compose --profile production up -d
```

## 📊 Monitoramento

- Health checks configurados
- Logs estruturados
- Métricas de performance

## 🔄 Scripts Úteis

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
npm run lint             # Linter
npm run format           # Formatação
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para suporte, entre em contato via email: admin@moneymaker.dev 