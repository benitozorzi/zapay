# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 5 implementada

Nesta etapa o repositório já inclui:

- checkpoints por tipo de sync
- runner consolidado por loja
- separação de sucesso/falha por fonte
- progressão incremental com `lastCursor` e `lastSyncedAt`

## Estrutura principal

```text
app/
  lib/
    server/
      prisma.server.ts
      shopify-graphql.server.ts
      store.server.ts
  modules/
    recovery/
      recovery-opportunity.mapper.server.ts
      recovery-opportunity.repository.server.ts
      run-recovery-sync.server.ts
      sync-abandoned-checkouts.server.ts
      sync-checkpoints.server.ts
      sync-pending-orders.server.ts
      shopify/
        recovery-shopify.queries.server.ts
        recovery-shopify.types.ts
  routes/
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

## Validação da Etapa 5

- `getOrCreateSyncCheckpoint()` deve garantir um checkpoint por `storeId + syncType`
- `markSyncStarted()` deve marcar `RUNNING` e limpar erro anterior
- `markSyncSucceeded()` deve salvar `lastCursor`, `lastSyncedAt` e `SUCCEEDED`
- `markSyncFailed()` deve salvar `FAILED` e o erro serializado
- `runRecoverySyncForStore()` deve executar cada fonte isoladamente e devolver um resumo consolidado

## Próximo passo

Etapa 6: criar `getDashboardSummary(storeId)` com agregações Prisma e breakdown por origem.
