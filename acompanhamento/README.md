# Acompanhamento — LLFinance

Esta pasta é o **ponto oficial de retomada** do projeto. Se o trabalho parar a qualquer momento, basta ler os arquivos abaixo na ordem para saber exatamente onde continuar.

## Ordem de leitura para retomar

1. **[STATUS.md](STATUS.md)** — onde o projeto está agora, o que já foi validado e qual é o próximo passo.
2. **[ETAPAS.md](ETAPAS.md)** — roteiro completo por etapas, com critérios de conclusão.
3. **[DIARIO.md](DIARIO.md)** — histórico do que foi feito em cada sessão.
4. **[DECISOES.md](DECISOES.md)** — decisões de produto, contabilidade e arquitetura que não devem ser reabertas sem motivo.

## Regra de ouro

> Nada é considerado concluído sem `npm run typecheck` e `npm run build` passando.
> Nenhuma entrega avança de etapa sem aprovação visual do usuário.

## Como rodar

```bash
cd C:\Users\aluno\Desktop\LLFinance
npm install        # apenas na primeira vez
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

## Estado resumido

- **Etapa atual:** 1 — protótipo navegável com dados mockados (concluída tecnicamente, aguardando aprovação visual).
- **Próxima etapa:** 2 — persistência real (Prisma + SQLite) e substituição gradual dos mocks.
- **Última validação:** `npm run typecheck` e `npm run build` sem erros em 05/11/2026.
