# Etapa 5 — Checkpoints e runner

## Arquivos principais

- `app/modules/recovery/sync-checkpoints.server.ts`
- `app/modules/recovery/run-recovery-sync.server.ts`

## O que foi implementado

### 1. Checkpoints por tipo de sync
Foram criados os helpers:
- `getOrCreateSyncCheckpoint()`
- `markSyncStarted()`
- `markSyncSucceeded()`
- `markSyncFailed()`

Esses helpers trabalham em cima da unique key:

```ts
storeId + syncType
```

Com isso, cada loja mantém estado separado para:
- `ABANDONED_CHECKOUTS`
- `PENDING_PAYMENT_ORDERS`
- `CONVERSION_RECONCILIATION`

### 2. Runner consolidado por loja
Foi criado `runRecoverySyncForStore()`.

Ele:
- busca a loja e suas configurações
- cria `StoreSettings` padrão se ainda não existir
- carrega checkpoints por tipo
- executa os syncs habilitados
- marca início, sucesso ou falha de cada fonte separadamente
- continua o processamento de uma fonte mesmo se a outra falhar
- devolve um resumo consolidado do sync

### 3. Estratégia de execução
A falha é separada por fonte. Isso significa:
- se `abandonedCheckouts` falhar, `pendingOrders` continua
- se `pendingOrders` falhar, o resultado de `abandonedCheckouts` é preservado

Essa escolha melhora a robustez operacional e conversa diretamente com a tese do produto de sync observável por fonte.

## Exemplo de uso

```ts
const { admin, session } = await authenticate.admin(request);
const store = await getStoreForSessionShop(session.shop);

const result = await runRecoverySyncForStore({
  admin,
  storeId: store.id,
  first: 50,
});
```

## Estrutura do retorno

O runner devolve:
- `storeId`
- `startedAt`
- `finishedAt`
- `success`
- `results.abandonedCheckouts`
- `results.pendingPaymentOrders`

Cada bloco de resultado informa:
- se estava habilitado
- se foi pulado
- se deu sucesso
- quantos registros persistiu
- se há próxima página
- qual foi o cursor final
- eventual erro

## Observações de implementação

- Nesta etapa o checkpoint usa `lastCursor` e `lastSyncedAt` vindos de cada fonte.
- O cursor é preservado por tipo de sync.
- A configuração padrão da loja é criada automaticamente quando ainda não existe.
- O runner ainda não aciona reconciliação. Isso entra na Etapa 7.

## Próximo encaixe natural

Na Etapa 6, o próximo passo é construir `getDashboardSummary(storeId)` com agregações em Prisma para:
- total capturado
- total elegível
- total enviado
- total convertido
- valor líquido recuperado
- breakdown por origem
