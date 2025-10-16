# Teste das Ações da IA

## Como Testar as Ações

### 1. Navegação Automática

Teste comandos como:

- "Leve-me para a página de produtos"
- "Navegue para a seção de clientes"
- "Abra o dashboard principal"
- "Vá para a página de agendamentos"

**Resultado esperado**: A IA deve navegar automaticamente para a página solicitada.

### 2. Abertura de Modais

Teste comandos como:

- "Crie um novo produto"
- "Abra o modal de cadastro de cliente"
- "Mostre o formulário de novo agendamento"
- "Abra a tela de edição de pedido"

**Resultado esperado**: A IA deve abrir o modal/formulário correspondente.

### 3. Consulta de Dados

Teste comandos como:

- "Mostre meus produtos"
- "Quantos clientes eu tenho?"
- "Qual é o faturamento do mês?"
- "Liste os agendamentos de hoje"

**Resultado esperado**: A IA deve consultar e exibir os dados solicitados.

### 4. Execução de Ações

Teste comandos como:

- "Crie um produto chamado 'Teste' com preço R$ 50"
- "Marque o cliente João como ativo"
- "Cancele o agendamento de amanhã"

**Resultado esperado**: A IA deve executar a ação solicitada.

## Comandos de Teste Específicos

### Navegação

```
"Leve-me para produtos"
"Navegue para /products"
"Abra a seção de clientes"
"Vá para o dashboard"
```

### Modais

```
"Crie um novo produto"
"Abra o modal de cliente"
"Mostre o formulário de agendamento"
"Abra a tela de pedidos"
```

### Dados

```
"Mostre meus produtos"
"Quantos clientes ativos?"
"Qual o faturamento?"
"Liste agendamentos de hoje"
```

### Ações CRUD

```
"Crie um produto chamado 'Produto Teste'"
"Edite o cliente João"
"Delete o agendamento de amanhã"
"Atualize o pedido #123"
```

## Debugging

### Verificar Logs do Backend

```bash
# No terminal do backend, procure por:
# "Action extracted: ..."
# "Failed to parse action: ..."
```

### Verificar Console do Frontend

```javascript
// No console do navegador, procure por:
// Eventos de navegação
// Eventos de modal
// Erros de ação
```

### Testar Conexão WebSocket

```javascript
// No console do navegador:
// Verificar se há mensagens de "✅ Conectado ao assistente IA"
// Verificar se há erros de conexão
```

## Troubleshooting

### A IA não executa ações

1. Verificar se o backend está rodando
2. Verificar se o WebSocket está conectado
3. Verificar logs do backend para erros de parsing
4. Testar com comandos mais simples

### Ações não funcionam corretamente

1. Verificar se as rotas existem no frontend
2. Verificar se os modais estão implementados
3. Verificar se os eventos customizados estão sendo capturados

### IA responde mas não navega

1. Verificar se o router está funcionando
2. Verificar se as rotas estão corretas
3. Verificar se há erros no console

## Melhorias Futuras

1. **Treinamento específico**: Treinar a IA com mais exemplos de ações
2. **Validação de ações**: Validar se as ações são válidas antes de executar
3. **Feedback visual**: Mostrar quando uma ação está sendo executada
4. **Histórico de ações**: Manter histórico das ações executadas
5. **Confirmação**: Pedir confirmação para ações destrutivas
