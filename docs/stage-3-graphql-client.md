# Etapa 3 — Cliente GraphQL da Shopify

## O que foi implementado

Arquivo principal:
- `app/lib/server/shopify-graphql.server.ts`

Esse utilitário entrega:
- `executeAdminGraphQL()` para executar queries/mutations no Admin GraphQL
- `ShopifyAdminHttpError` para respostas HTTP inválidas
- `ShopifyAdminGraphQLResponseError` para `errors[]` no payload GraphQL
- `normalizeConnectionPage()` para padronizar `nodes`, `edges` e `pageInfo`
- `fetchAdminConnectionPage()` como base para queries paginadas

## Estratégia adotada

Em vez de acoplar o utilitário aos tipos internos do SDK, o arquivo usa uma interface mínima com método `graphql()`. Isso deixa o helper compatível com o retorno de `authenticate.admin` e mantém o código mais estável.

## Exemplo de uso

```ts
const { admin } = await authenticate.admin(request);

const result = await executeAdminGraphQL<{ shop: { name: string } }>({
  admin,
  query: `#graphql
    query ShopName {
      shop {
        name
      }
    }
  `,
});

console.log(result.data.shop.name);
```

## Exemplo com paginação

```ts
const page = await fetchAdminConnectionPage<
  { orders: { nodes: Array<{ id: string }>; pageInfo: { hasNextPage: boolean; endCursor?: string | null } } },
  { id: string },
  { first: number; after?: string | null }
>({
  admin,
  query: `#graphql
    query OrdersPage($first: Int!, $after: String) {
      orders(first: $first, after: $after) {
        nodes {
          id
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,
  variables: {
    first: 25,
    after: null,
  },
  selectConnection: (data) => data.orders,
});
```

## Próximo encaixe natural

Na Etapa 4 esse utilitário será reutilizado para:
- `abandonedCheckouts`
- `orders` com pagamento pendente
- paginação por cursor
- ingestão incremental com checkpoint
