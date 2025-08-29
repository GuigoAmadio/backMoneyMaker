#!/bin/bash

# 🧪 Script de Testes - Money Maker Backend
# Este script executa todos os testes de forma organizada

echo "🚀 Iniciando testes do Money Maker Backend..."
echo "================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se o Docker está rodando
print_status "Verificando se o Docker está rodando..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi
print_success "Docker está rodando"

# Verificar se os serviços estão ativos
print_status "Verificando serviços Docker..."
if ! docker-compose ps | grep -q "Up"; then
    print_warning "Serviços Docker não estão rodando. Iniciando..."
    docker-compose up -d
    sleep 10
fi
print_success "Serviços Docker ativos"

# Verificar dependências
print_status "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    print_warning "Dependências não instaladas. Instalando..."
    npm install
fi
print_success "Dependências verificadas"

# Executar migrações se necessário
print_status "Verificando migrações do banco..."
npm run prisma:generate
print_success "Migrações verificadas"

echo ""
echo "🧪 Executando testes..."
echo "========================"

# Array de testes para executar
tests=(
    "test:health:Teste Completo de Health Check"
    "test:redis:Teste do Cache Redis"
    "test:queue:Teste do Sistema de Filas"
    "test:telegram:Teste das Notificações Telegram"
    "test:metrics:Teste das Métricas Prometheus"
)

# Contadores
total_tests=${#tests[@]}
passed_tests=0
failed_tests=0

# Executar cada teste
for test in "${tests[@]}"; do
    IFS=':' read -r command name <<< "$test"
    
    echo ""
    print_status "Executando: $name"
    echo "----------------------------------------"
    
    if npm run $command; then
        print_success "$name - PASSOU ✅"
        ((passed_tests++))
    else
        print_error "$name - FALHOU ❌"
        ((failed_tests++))
    fi
done

echo ""
echo "📊 Resumo dos Testes"
echo "===================="
echo "Total de testes: $total_tests"
echo -e "Passaram: ${GREEN}$passed_tests${NC}"
echo -e "Falharam: ${RED}$failed_tests${NC}"

if [ $failed_tests -eq 0 ]; then
    echo ""
    print_success "🎉 Todos os testes passaram! Seu backend está funcionando perfeitamente!"
    echo ""
    echo "📈 Próximos passos:"
    echo "1. Verifique os logs: docker-compose logs -f"
    echo "2. Teste os endpoints manualmente:"
    echo "   - GET https://api.expatriamente.com/health"
    echo "   - GET https://api.expatriamente.com/metrics"
    echo "3. Configure monitoramento em produção"
    echo "4. Implemente testes E2E"
else
    echo ""
    print_error "❌ Alguns testes falharam. Verifique os logs acima."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Verifique se todos os serviços estão rodando: docker-compose ps"
    echo "2. Verifique os logs: docker-compose logs -f"
    echo "3. Recrie os serviços: docker-compose down && docker-compose up -d"
    echo "4. Limpe o cache: docker system prune -f"
fi

echo ""
echo "📚 Para mais informações, consulte o TEST_GUIDE.md" 