# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 10 implementada

Nesta etapa o repositório já inclui:

- validação com Zod
- tratamento de erro padronizado
- logs básicos de operação
- ErrorBoundary global
- rotas críticas endurecidas para piloto

## Estrutura principal

```text
app/
  lib/
    server/
      logger.server.ts
      prisma.server.ts
      request-payload.server.ts
      route-errors.server.ts
      shopify-graphql.server.ts
      store.server.ts
      validation.server.ts
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
    app.opportunities.tsx
    app.opportunities.$id.tsx
    app.settings.tsx
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

## Validação da Etapa 10

- payloads inválidos devem falhar com resposta consistente
- ids ausentes ou inválidos devem retornar erro padronizado
- logs de sync, reconciliação e envio devem ser emitidos
- o app deve renderizar uma ErrorBoundary simples quando houver erro não tratado

## Próximo passo

Após esta etapa, o fluxo natural deixa de ser “implementar o MVP” e passa a ser “testar piloto, corrigir fricções e evoluir features”.
