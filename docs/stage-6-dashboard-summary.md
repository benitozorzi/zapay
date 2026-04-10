# Etapa 6 — Dashboard summary

## Arquivo principal

- `app/modules/recovery/dashboard-summary.server.ts`

## O que foi implementado

Foi criado `getDashboardSummary(storeId)` para consolidar os KPIs principais do MVP:
- total capturado
- total elegível
- total enviado
- total convertido
- valor bruto recuperado
- valor líquido recuperado
- breakdown por origem

## Estratégia de agregação

### Aggregate
O service usa `aggregate()` para os totais gerais:
- total capturado
- total elegível
- total enviado
- total convertido
- soma do valor recuperado em convertidos

### GroupBy
O service usa `groupBy()` para o breakdown por `OpportunityType`:
- contagem por tipo e status
- soma de `cartValue` para convertidos por tipo

## Regras atuais do dashboard v0.1

### Total enviado
Neste momento, `totalSent` considera oportunidades em:
- `SENT_ONCE`
- `SENT_MULTIPLE`
- `CONVERTED`

Isso mantém consistência com a leitura de oportunidades que já passaram pela etapa de envio.

### Valor líquido recuperado
O schema atual ainda não armazena o desconto efetivamente concedido por oportunidade. Por isso, nesta versão:
- `discountValue = 0`
- `netRecoveredValue = grossRecoveredValue`

Ou seja, o dashboard já entrega o KPI de recuperação, mas sem separar desconto real ainda.

## Estrutura de retorno

O retorno inclui:
- `storeId`
- `generatedAt`
- `totals`
- `breakdown`

Cada item de `breakdown` devolve:
- `opportunityType`
- `totalCaptured`
- `totalEligible`
- `totalSent`
- `totalConverted`
- `grossRecoveredValue`
- `netRecoveredValue`
- `recoveryRate`

## Exemplo de uso

```ts
const summary = await getDashboardSummary(store.id);
```

## Próximo encaixe natural

Na Etapa 8, esse service será consumido pela rota JSON do dashboard.
Na Etapa 9, ele será mostrado na UI embedded com cards de KPI.
