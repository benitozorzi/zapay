# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 8 implementada

Nesta etapa o repositório já inclui:

- rotas JSON autenticadas do app embedded
- leitura e atualização de settings por loja
- listagem e detalhe de oportunidades
- envio manual para WhatsApp com registro de tentativa
- sync manual via API

## Estrutura principal

```text
app/
  lib/
    server/
      prisma.server.ts
      request-payload.server.ts
      shopify-graphql.server.ts
      store.server.ts
  modules/
    recovery/
      dashboard-summary.server.ts
      reconcile-conversions.server.ts
      recovery-opportunities.server.ts
      recovery-settings.server.ts
      recovery-opportunity.mapper.server.ts
      recovery-opportunity.repository.server.ts
      run-recovery-sync.server.ts
      send-recovery-whatsapp.server.ts
      sync-abandoned-checkouts.server.ts
      sync-checkpoints.server.ts
      sync-pending-orders.server.ts
      shopify/
        reconciliation-shopify.queries.server.ts
        reconciliation-shopify.types.ts
        recovery-shopify.queries.server.ts
        recovery-shopify.types.ts
  routes/
    app.api.dashboard.summary.ts
    app.api.opportunities.ts
    app.api.opportunities.$id.ts
    app.api.opportunities.$id.send.ts
    app.api.settings.ts
    app.api.sync.ts
    _index.tsx
    app.tsx
    app._index.tsx
    auth.$.tsx
    auth.login.tsx
  db.server.ts
  entry.client.tsx
  entry.server.tsx
  root.tsx
  shopify.server.ts
prisma/
  migrations/
  schema.prisma
```

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Preencha as variáveis do app Shopify e do banco.

4. Gere o client do Prisma:

```bash
npx prisma generate
```

5. Rode a migration:

```bash
npx prisma migrate dev
```

6. Valide types e schema:

```bash
npx prisma validate
npm run typecheck
```

7. Rode o app:

```bash
npm run dev
```

## Validação da Etapa 8

- `GET /app/api/dashboard/summary` deve retornar os KPIs da loja autenticada
- `GET /app/api/opportunities` deve listar oportunidades com filtros
- `GET /app/api/opportunities/:id` deve retornar detalhe com tentativas
- `POST /app/api/opportunities/:id/send` deve criar `RecoveryAttempt` e retornar `whatsappUrl`
- `GET /app/api/settings` deve retornar settings da loja
- `POST /app/api/settings` deve atualizar settings da loja
- `POST /app/api/sync` deve executar sync manual por loja

## Próximo passo

Etapa 9: criar a UI mínima embedded com Polaris consumindo essas rotas.
