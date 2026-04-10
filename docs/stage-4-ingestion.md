# Etapa 4 — Queries, mapeamento e ingestão

## Arquivos principais

- `app/modules/recovery/shopify/recovery-shopify.types.ts`
- `app/modules/recovery/shopify/recovery-shopify.queries.server.ts`
- `app/modules/recovery/recovery-opportunity.mapper.server.ts`
- `app/modules/recovery/recovery-opportunity.repository.server.ts`
- `app/modules/recovery/sync-abandoned-checkouts.server.ts`
- `app/modules/recovery/sync-pending-orders.server.ts`

## O que foi implementado

### 1. Queries GraphQL
Foram criadas duas queries base:
- `ABANDONED_CHECKOUTS_QUERY`
- `PENDING_PAYMENT_ORDERS_QUERY`

Além disso, foi criado `buildShopifySearchQuery()` para compor filtros com `updated_at` e termos-base.

### 2. Mapeamento para o domínio
Os mapeadores transformam o payload da Shopify em estrutura pronta para persistência como `RecoveryOpportunity`.

Regras incluídas:
- normalização de e-mail
- normalização de telefone
- composição de nome do cliente
- fallback entre `customer`, `billingAddress` e `shippingAddress`
- status inicial como `ELIGIBLE` apenas quando há telefone e URL de retomada

### 3. Upsert por chave estável
O repositório usa a unique key:

```ts
storeId + opportunityType + sourceShopifyId
```

Com isso, o sync pode ser reexecutado sem duplicar oportunidade.

### 4. Syncs iniciais
Foram criadas:
- `syncAbandonedCheckouts()`
- `syncPendingOrders()`

Cada uma:
- consulta uma página da Shopify
- mapeia os nodes
- persiste via upsert
- devolve `count`, `opportunities` e `pageInfo`

## Observações de implementação

- Nesta etapa, os syncs recebem `after` e `updatedAtMin`, mas ainda não salvam checkpoint automaticamente. Isso fica para a Etapa 5.
- O filtro de pedidos pendentes foi iniciado com `financial_status:pending`, mantendo o escopo estreito do MVP.
- O canal ainda é WhatsApp Web, então a elegibilidade foi pensada para envio com link direto e telefone válido.

## Exemplo de uso

```ts
const { admin, session } = await authenticate.admin(request);
const store = await getStoreForSessionShop(session.shop);

const abandoned = await syncAbandonedCheckouts({
  admin,
  storeId: store.id,
  first: 50,
  after: null,
  updatedAtMin: new Date(Date.now() - 1000 * 60 * 60 * 24),
});

const pending = await syncPendingOrders({
  admin,
  storeId: store.id,
  first: 50,
  after: null,
  updatedAtMin: new Date(Date.now() - 1000 * 60 * 60 * 24),
});
```

## Próximo encaixe natural

Na Etapa 5, o runner consolidado vai orquestrar:
- checkpoint por tipo
- início/falha/sucesso
- sync incremental por loja
