# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 4 implementada

Nesta etapa o repositório já inclui:

- queries GraphQL para `abandonedCheckouts` e `orders`
- mapeadores para `RecoveryOpportunity`
- upsert por chave estável da origem Shopify
- syncs iniciais para captura de abandonados e pedidos pendentes

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
      sync-abandoned-checkouts.server.ts
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

## Validação da Etapa 4

- `syncAbandonedCheckouts()` deve consultar a Shopify, mapear e persistir oportunidades por `sourceShopifyId`
- `syncPendingOrders()` deve consultar pedidos pendentes, mapear e persistir oportunidades por `sourceShopifyId`
- a unique key composta deve impedir duplicação por loja e tipo de oportunidade
- o status inicial deve ser `ELIGIBLE` apenas quando existir telefone normalizado e link de retomada

## Próximo passo

Etapa 5: criar checkpoints e runner consolidado para sincronização por loja.
