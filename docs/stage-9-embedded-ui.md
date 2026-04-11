# Etapa 9 — UI mínima embedded

## Arquivos principais

- `app/routes/app._index.tsx`
- `app/routes/app.tsx`
- `app/routes/app.opportunities.tsx`
- `app/routes/app.opportunities.$id.tsx`
- `app/routes/app.settings.tsx`

## O que foi implementado

### Dashboard
A tela inicial `/app` agora mostra:
- cards de KPI
- breakdown por origem
- botão `Sincronizar agora`
- feedback do último sync executado

A ação de sync usa `useFetcher()` contra `/app/api/sync` e revalida o dashboard após a conclusão.

### Oportunidades
A tela `/app/opportunities` agora mostra:
- filtros simples
- paginação
- cards com dados principais da oportunidade
- navegação para detalhe

### Detalhe da oportunidade
A tela `/app/opportunities/:id` agora mostra:
- dados completos da oportunidade
- histórico de tentativas
- botão `Enviar no WhatsApp`
- botão para abrir o link de retomada

O envio manual usa a rota `/app/api/opportunities/:id/send`.

### Configurações
A tela `/app/settings` agora permite:
- ativar ou desativar recuperação
- habilitar captura de abandonados
- habilitar captura de pedidos pendentes
- ajustar janela de atribuição
- configurar desconto

A gravação usa `useFetcher()` contra `/app/api/settings`.

### Navegação
O `NavMenu` do embedded app agora inclui:
- Dashboard
- Oportunidades
- Configurações

## Estratégia adotada

A UI usa loaders diretos para leitura e `useFetcher()` para ações mutáveis. Isso deixa a interface rápida e evita acoplamento excessivo da leitura ao formato das rotas JSON.

## Próximo encaixe natural

Na Etapa 10, o foco é hardening:
- validação com Zod
- tratamento de erro melhor
- logs básicos
- preparo para piloto
