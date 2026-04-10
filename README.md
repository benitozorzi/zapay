# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 6 implementada

Nesta etapa o repositório já inclui:

- service de dashboard com agregações Prisma
- breakdown por origem de oportunidade
- KPIs consolidados de captura, elegibilidade, envio e conversão
- cálculo de recuperação bruta e líquida no formato v0.1

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

## Validação da Etapa 6

- `getDashboardSummary(storeId)` deve devolver os KPIs gerais do dashboard
- o service deve usar `aggregate()` para totais
- o service deve usar `groupBy()` para o breakdown por `OpportunityType`
- `recoveryRate` deve ser calculada sobre capturado vs convertido
- no v0.1, `discountValue` ainda fica zerado por ausência de campo específico no schema

## Próximo passo

Etapa 7: criar reconciliação v0.1 para detectar pedidos pagos e marcar oportunidades como convertidas.
