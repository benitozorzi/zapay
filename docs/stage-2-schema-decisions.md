# Decisões da Etapa 2

## Chaves únicas

### RecoveryOpportunity
`@@unique([storeId, opportunityType, sourceShopifyId])`

Essa combinação permite fazer upsert confiável por origem da Shopify dentro de cada loja, sem misturar checkout abandonado com pedido pendente.

### SyncCheckpoint
`@@unique([storeId, syncType])`

Garante um checkpoint por tipo de sincronização em cada loja.

### StoreSettings
`storeId @unique`

Mantém a relação 1:1 entre loja e configurações.

## Índices

### RecoveryOpportunity
- `(storeId, status)` para listagens operacionais
- `(storeId, opportunityType, status)` para breakdown e filtros por origem
- `(storeId, customerEmail)` e `(storeId, customerPhoneNormalized)` para reconciliação
- `(storeId, capturedAt)` para ordenação e janela de captura
- `(convertedAt)` para consultas de conversão

### RecoveryAttempt
- `(recoveryOpportunityId, sentAt)` para histórico cronológico

### SyncCheckpoint
- `(storeId, lastStatus)` para monitoramento operacional

## Escolhas de modelagem

- `discountValue` foi definido como `Decimal(10,2)` para suportar percentual ou valor fixo sem perder precisão.
- `cartValue` foi definido como `Decimal(12,2)` para manter consistência financeira no dashboard.
- `customerName`, `customerEmail` e `customerPhoneNormalized` são opcionais porque a Shopify pode entregar dados incompletos dependendo da origem.
- `RecoveryChannel` já nasce como enum mesmo com um único canal inicial, para evitar refactor desnecessário quando entrar WhatsApp API no futuro.
