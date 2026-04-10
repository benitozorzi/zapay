# Etapa 7 — Reconciliação v0.1

## Arquivos principais

- `app/modules/recovery/reconcile-conversions.server.ts`
- `app/modules/recovery/shopify/reconciliation-shopify.queries.server.ts`
- `app/modules/recovery/shopify/reconciliation-shopify.types.ts`

## O que foi implementado

### 1. Query de pedidos pagos
Foi criada `PAID_ORDERS_QUERY` para buscar pedidos com `financial_status:paid`, ordenados por `UPDATED_AT`.

### 2. Busca de oportunidades abertas com tentativa
A reconciliação busca oportunidades que:
- pertencem à loja
- ainda não foram convertidas
- estão em status abertos e reconciliáveis
- já têm `lastAttemptAt`
- estão dentro da janela de atribuição da loja

### 3. Janela de atribuição
A função respeita `StoreSettings.attributionWindowHours`.
Se a loja ainda não tiver settings, o registro padrão é criado automaticamente.

### 4. Score de matching
A lógica foi feita para ser conservadora:

#### Match exato por order GID
Se `opportunity.orderGid === paidOrder.id`, a conversão é aceita com score máximo.

#### Match heurístico
Se não houver `orderGid` exato, a função soma pontos por:
- e-mail exato
- telefone exato
- valor exato ou aproximado

O match só é aceito se atingir o threshold mínimo.

### 5. Conversão marcada no banco
Quando encontra match válido, a oportunidade é atualizada com:
- `status = CONVERTED`
- `convertedAt`
- `convertedOrderId`
- `conversionType`

## Estratégia adotada

- `ORDER_PAID` para match exato por `orderGid`
- `MANUAL_MATCH` para match heurístico de alta confiança

Essa separação já prepara auditoria melhor para o futuro.

## Observações de implementação

- O matching é intencionalmente conservador para reduzir falso positivo.
- Cada oportunidade só pode ser consumida uma vez por execução.
- Nesta etapa a reconciliação ainda não foi plugada no runner consolidado de sync. Isso pode ser feito depois sem retrabalho grande.

## Exemplo de uso

```ts
const result = await reconcileConversionsForStore({
  admin,
  storeId: store.id,
  first: 50,
  after: null,
});
```

## Retorno

A função devolve:
- `storeId`
- `scannedPaidOrders`
- `scannedOpenOpportunities`
- `matchedCount`
- `hasNextPage`
- `lastCursor`
- `reconciledOpportunityIds`

## Próximo encaixe natural

Na Etapa 8, isso pode ser exposto por rota JSON e acionado manualmente pelo app.
