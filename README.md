# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 7 implementada

Nesta etapa o repositório já inclui:

- query de pedidos pagos
- busca de oportunidades abertas com tentativa
- score conservador de matching
- marcação de conversão no banco
- reconciliação v0.1 por loja

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
      dashboard-summary.server.ts
      reconcile-conversions.server.ts
      recovery-opportunity.mapper.server.ts
      recovery-opportunity.repository.server.ts
      run-recovery-sync.server.ts
      sync-abandoned-checkouts.server.ts
      sync-checkpoints.server.ts
      sync-pending-orders.server.ts
      shopify/
        reconciliation-shopify.queries.server.ts
        reconciliation-shopify.types.ts
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

## Validação da Etapa 7

- `reconcileConversionsForStore()` deve buscar pedidos pagos recentes
- a função deve buscar oportunidades abertas que já receberam tentativa
- o matching deve aceitar `orderGid` exato com prioridade máxima
- o matching heurístico deve combinar e-mail, telefone e valor de forma conservadora
- a oportunidade reconciliada deve ser marcada como `CONVERTED`

## Próximo passo

Etapa 8: criar API routes JSON autenticadas para dashboard, oportunidades, settings, sync e envio no WhatsApp.
