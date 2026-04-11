# Etapa 8 — API routes

## Arquivos principais

- `app/routes/app.api.dashboard.summary.ts`
- `app/routes/app.api.opportunities.ts`
- `app/routes/app.api.opportunities.$id.ts`
- `app/routes/app.api.opportunities.$id.send.ts`
- `app/routes/app.api.settings.ts`
- `app/routes/app.api.sync.ts`

## Helpers adicionados

- `app/lib/server/request-payload.server.ts`
- `app/modules/recovery/recovery-settings.server.ts`
- `app/modules/recovery/recovery-opportunities.server.ts`
- `app/modules/recovery/send-recovery-whatsapp.server.ts`

## O que foi implementado

### Dashboard summary
`GET /app/api/dashboard/summary`

Retorna o resumo consolidado do dashboard da loja autenticada.

### Opportunities list
`GET /app/api/opportunities`

Aceita filtros por query string:
- `page`
- `limit`
- `opportunityType`
- `status`

### Opportunity detail
`GET /app/api/opportunities/:id`

Retorna a oportunidade com histórico de tentativas.

### Send recovery message
`POST /app/api/opportunities/:id/send`

Valida:
- oportunidade da loja
- telefone normalizado
- URL de retomada

Depois:
- renderiza a mensagem
- cria `RecoveryAttempt`
- atualiza `lastAttemptAt`
- atualiza status para `SENT_ONCE` ou `SENT_MULTIPLE`
- devolve `whatsappUrl`

### Settings
`GET /app/api/settings`
`POST /app/api/settings`

A rota lê e atualiza as configurações da loja.

### Sync
`POST /app/api/sync`

Executa `runRecoverySyncForStore()`.
Opcionalmente também roda reconciliação quando `includeReconciliation=true`.

## Estratégia adotada

Todas as rotas:
- usam `authenticate.admin`
- resolvem a loja via `session.shop`
- isolam os dados por `storeId`

## Payload parsing

Foi criado `parseRequestPayload()` para aceitar:
- JSON
- FormData

Isso ajuda a testar as rotas sem amarrar o frontend a um único formato nesta etapa.

## Próximo encaixe natural

Na Etapa 9, essas rotas serão consumidas pela UI mínima embedded com Polaris.
