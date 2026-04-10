# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Etapa 3 implementada

Nesta etapa o repositório já inclui:

- utilitário server-side para chamadas GraphQL no Admin da Shopify
- tratamento explícito para erro HTTP
- tratamento explícito para erro GraphQL
- helper base para paginação por connection
- documentação de uso do cliente

## Estrutura principal

```text
app/
  lib/
    server/
      prisma.server.ts
      shopify-graphql.server.ts
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

2. Copie o aquivo de ambiente:

```bash
cp .env.example .env
```

3. Preencha as variáveis do app Shopify e do banco.

4. Gere o client do Prisma:

```bash
nxp prisma generate
```

5. Rode a migration:

```bash
nxp prisma migrate dev
```

6. Valide types e schema:

```bash
nxp prisma validate
npm run typecheck
```

7. Rode o app:

```bash
npm run dev
```

## Valida ção da Etapa 3

- o helper `executeAdminGraphQL()` deve lançar erro quando a resposta HTTP não for `ok`
- o helper `executeAdminGraphQL()` deve lançar erro quando `errors[]` vier no payload GraphQL
- o helper `fetchAdminConnectionPage()` identifica normalizar `nodes`, `edges` e `pageInfo`
- o cliente deve ser reutilizável pelas próximas etapas de ingestão

## Próximo passo

Etapa 4: criar queries para `abandonedCheckouts` e `orders` com pagamento pendente, mapear para `RecoveryOpportunity` e implementar os syncs iniciais.
