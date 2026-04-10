# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 2 implementada

Nesta etapa o repositório já inclui:

- schema Prisma expandido com os models do MVP
- enums de domínio para oportunidade, sync, conversão e desconto
- migration inicial dos modelos de recuperação
- índices e chaves únicas para suportar upsert, dashboard e checkpoints

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

6. Valide o schema:

```bash
npx prisma validate
```

7. Rode o app:

```bash
npm run dev
```

## Validação da Etapa 2

- `npx prisma validate` deve passar
- `npx prisma migrate dev` deve criar as tabelas e enums novos
- o banco deve passar a ter:
  - `StoreSettings`
  - `RecoveryOpportunity`
  - `RecoveryAttempt`
  - `SyncCheckpoint`
- a unique key de oportunidade deve impedir duplicação por origem Shopify dentro da loja
- a unique key de checkpoint deve garantir um checkpoint por tipo de sync em cada loja

## Próximo passo

Etapa 3: criar o cliente server-side de GraphQL da Shopify com tratamento de erro HTTP, erro GraphQL e base para paginação.
