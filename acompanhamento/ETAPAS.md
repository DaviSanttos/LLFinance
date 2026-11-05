# ETAPAS — LLFinance

Roteiro macro do projeto. Cada etapa só é marcada como concluída quando os critérios de aceite forem atendidos e o usuário aprovar.

## Etapa 0 — Descoberta e documentação ✅

**Objetivo:** entender o enunciado e o sistema do professor antes de escrever código.

Entregas:
- Leitura integral de `Contabilidade.txt`.
- Análise do sistema de referência do professor (plano de 40 contas, DRE e Balanço).
- Documentos `docs/01` a `docs/05`.

Critérios de aceite:
- [x] Escopo funcional e não funcional documentado.
- [x] Arquitetura e modelo de dados propostos.
- [x] Divisão do trabalho em 4 fatias verticais.
- [x] Guia contábil com lançamentos e valores esperados.

---

## Etapa 1 — Protótipo navegável com mocks ✅

**Objetivo:** validar o visual e a experiência antes da implementação real.

Entregas:
- Projeto Next.js + TypeScript + Tailwind configurado.
- Design system e shell de navegação.
- Todas as telas navegáveis com dados realistas.
- Motor contábil mock calculando relatórios a partir das operações.
- Persistência em `localStorage` (`llfinance:mock:v1`).
- Cenário de demonstração com apuração pendente.

Critérios de aceite:
- [x] Todas as rotas do menu abrem sem erro.
- [x] `npm run typecheck` passa.
- [x] `npm run build` passa.
- [ ] Usuário aprovou o visual.
- [ ] Ajustes visuais pós-aprovação aplicados.

**Status:** tecnicamente concluída; aguardando aprovação visual.

---

## Etapa 2 — Persistência real (Prisma + SQLite)

**Objetivo:** substituir o estado em memória/localStorage por banco de dados.

Entregas:
- `prisma/schema.prisma` com todas as entidades.
- Migration inicial.
- Seed idêntico ao cenário mock.
- Repositórios/serviços no servidor.
- Rotas de API para cada agregado.

Critérios de aceite:
- [ ] Dados sobrevivem a reinício do servidor.
- [ ] Seed reproduz os mesmos valores do cenário mock.
- [ ] Testes de integração dos serviços passam.

---

## Etapa 3 — Autenticação e autorização

**Objetivo:** login real com perfis e permissões.

Entregas:
- Sessão com cookie `httpOnly`.
- Hash de senha (`bcryptjs`).
- Middleware de autorização por papel.
- Tela de login e gestão de usuários ligada ao banco.

Critérios de aceite:
- [ ] Cada papel só acessa o que a matriz permite.
- [ ] Ações sensíveis (reabrir período, estornar) são auditadas com o usuário real.
- [ ] Logout e expiração de sessão funcionam.

---

## Etapa 4 — Lançamentos e relatórios no servidor

**Objetivo:** mover a lógica contábil para o servidor e ligar todas as telas.

Entregas:
- Serviços de operação, venda, compra, estorno e apuração.
- Geração de Diário, Razão, Balancete, Balanço e DRE no servidor.
- Validações compartilhadas com Zod.
- Auditoria automática em toda mutação.

Critérios de aceite:
- [ ] Partida dobrada bloqueada no servidor, não só na UI.
- [ ] DRE e Balanço batem com os valores de referência.
- [ ] Estorno nunca apaga registros.
- [ ] Testes unitários do motor contábil com cobertura dos casos do guia.

---

## Etapa 5 — Estoque, obrigações e PDF

**Objetivo:** fechar os módulos complementares.

Entregas:
- Estoque persistido com custo médio e CMV.
- Conciliação estoque × contabilidade.
- Obrigações fiscais por regime.
- Geração de PDF no servidor (PDFKit) do relatório completo e de cada livro.
- Importação/exportação do plano de contas (SheetJS).

Critérios de aceite:
- [ ] PDF completo com capa, DRE, Balanço, Balancete, Diário, Razão, Estoque, Obrigações e Auditoria.
- [ ] Estoque e conta `1.0.4` sempre conciliados.
- [ ] Obrigações com vencimento, competência e status.

---

## Etapa 6 — Qualidade, testes e entrega

**Objetivo:** garantir que o sistema é confiável e apresentável.

Entregas:
- Testes E2E (Playwright) dos fluxos principais.
- Testes de regressão contábil.
- Revisão de acessibilidade e responsividade.
- Roteiro de demonstração.
- Documentação final de uso.

Critérios de aceite:
- [ ] Fluxo completo: empresa → plano → saldos → operações → relatórios → PDF.
- [ ] Nenhum erro no console.
- [ ] Build de produção limpo.
- [ ] Backup e restauração testados.

---

## Regras de avanço

1. Não iniciar uma etapa sem a anterior aprovada.
2. Toda etapa termina com `npm run typecheck` e `npm run build` verdes.
3. Toda decisão relevante é registrada em `DECISOES.md`.
4. Todo trabalho realizado é registrado em `DIARIO.md`.
5. O `STATUS.md` é atualizado ao final de cada sessão.
