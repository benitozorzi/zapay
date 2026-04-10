# Estrutura sugerida

```text
zapay/
  app/
    lib/
      server/
    modules/
      recovery/
    routes/
  prisma/
  docs/
  package.json
  README.md
```

## Organização
- `app/lib/server/*`: infraestrutura server-side
- `app/modules/recovery/*`: regras do domínio
- `app/routes/*`: rotas Remix embedded
