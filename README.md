# Zapay

App embedded para Shopify Brasil focado em recuperação de vendas via WhatsApp.

## Proposta
O produto foca em recuperar receita travada em:
- checkouts abandonados
- pedidos com pagamento pendente
- meios de pagamento comuns no Brasil, como PIX, boleto e gateways locais

## Stack planejada
- Shopify Embedded App
- Remix
- Polaris
- Prisma
- TypeScript

## Estrutura inicial
- `app/` interface e rotas do app embedded
- `app/lib/server/` helpers server-side
- `app/modules/recovery/` domínio de recuperação
- `prisma/` banco e models
- `docs/` documentação inicial do produto

## Próximo passo
Implementar a Etapa 1:
1. validar template Shopify Remix
2. configurar Prisma
3. criar helper de prisma server
4. criar helper para resolver Store via `session.shop`
