# Etapa 10 — Hardening básico

## Arquivos principais

- `app/lib/server/logger.server.ts`
- `app/lib/server/route-errors.server.ts`
- `app/lib/server/validation.server.ts`
- `app/root.tsx`

## O que foi implementado

### 1. Validação com Zod
Foi adicionada a dependência `zod` e criado um arquivo central de validação.

Schemas incluídos:
- `opportunityIdParamsSchema`
- `opportunitiesQuerySchema`
- `settingsUpdateSchema`
- `syncActionSchema`

Esses schemas agora cobrem os fluxos mais sensíveis do app.

### 2. Resposta de erro padronizada
Foi criado `route-errors.server.ts` com:
- `HttpError`
- `badRequest()`
- `notFound()`
- `internalServerError()`
- `toErrorResponse()`

Isso centraliza a tradução de erro para JSON HTTP e reduz inconsistência entre rotas.

### 3. Logs básicos
Foi criado `logger.server.ts` com níveis:
- `info`
- `warn`
- `error`

Logs básicos foram conectados em pontos críticos, como:
- sync consolidado
- reconciliação
- preparação de envio no WhatsApp
- falhas de rota

### 4. ErrorBoundary global
O `root.tsx` agora tem `ErrorBoundary()` simples para evitar falha silenciosa ou tela em branco quando um loader/action estourar fora do esperado.

### 5. Rotas endurecidas
As rotas mais sensíveis agora usam validação e tratamento uniforme:
- `app.api.dashboard.summary.ts`
- `app.api.opportunities.ts`
- `app.api.opportunities.$id.ts`
- `app.api.opportunities.$id.send.ts`
- `app.api.settings.ts`
- `app.api.sync.ts`

## Leitura prática

Com essa etapa, o MVP deixa de ser só funcional e passa a ter uma base muito mais segura para piloto controlado.

Ainda não é um produto enterprise, mas já tem:
- validação consistente
- erros previsíveis
- logs básicos de operação
- fallback visual de erro

## Próximo encaixe natural

Depois desta etapa, o caminho deixa de ser “MVP estrutural” e passa a ser “piloto + refinamento”.
