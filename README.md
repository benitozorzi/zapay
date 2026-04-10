# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 1 implementada

Nesta etapa o repositório já inclui:

- base em TypeScript para app embedded com Remix
- `shopify.server.ts` com `authenticate.admin`
- Polaris e App Bridge provider na rota `/app`
- Prisma configurado
- helper singleton de Prisma server-side
- helper para obter ou criar `Store` a partir de `session.shop`

## Estrutura principal

```text
app/
  lib/
    server/
      prisma.server.ts
      store.server.ts
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

5. Rode a migration inicial:

```bash
npx prisma migrate dev --name init
```

6. Rode o app:

```bash
npm run dev
```

## Validação da Etapa 1

- `npx prisma validate` deve passar
- `npm run typecheck` deve passar
- ao abrir `/app`, a rota deve exigir autenticação via `authenticate.admin`
- após autenticar, a loader de `/app` e `/app._index` deve conseguir resolver `session.shop`
- o helper `getOrCreateStoreByShopDomain()` deve criar ou retornar a loja no banco

## Próximo passo

Etapa 2: expandir o `schema.prisma` com os models e enums do MVP:
- `StoreSettings`
- `RecoveryOpportunity`
- `RecoveryAttempt`
- `SyncCheckpoint`
