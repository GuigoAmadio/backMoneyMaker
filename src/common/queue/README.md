# Queue Module (Bull)

Este módulo integra o Bull (baseado em Redis) para filas de jobs no backend NestJS.

## Endpoints

- `POST /queue/add` — Adiciona um job à fila padrão
- `GET /queue/jobs` — Lista jobs da fila padrão
- `POST /queue/clean` — Limpa todos os jobs da fila padrão

## Exemplo de uso no código

```ts
// Injete o QueueService em qualquer serviço/controller
constructor(private readonly queueService: QueueService) {}

// Adicione um job
await this.queueService.addJob({ tipo: 'email', payload: { ... } });
```

## Configuração

- Configure as variáveis de ambiente do Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- O Bull já está registrado para a fila 'default'.

## Observações

- Expanda este módulo para múltiplas filas, processadores e workers conforme a necessidade.
- Use o Bull Board para monitorar filas (opcional).

## Monitoramento visual (Bull Board)

- Acesse `/admin/queues` no backend para visualizar as filas.
- Protegido por senha simples: envie header `Authorization: Bearer devpassword`.
- Exemplo com curl:
  ```sh
  curl -H "Authorization: Bearer devpassword" http://localhost:3000/admin/queues
  ```
