# 04 — Backlog e Cronograma

> **Projeto:** LLFinance — Sistema Contábil Educacional  
> **Versão:** 1.0 — 05/11/2026  
> **Como usar:** cada item é uma tarefa verificável. O dono marca `[x]` ao concluir; o aceite entre parênteses é o critério mínimo.

---

## 1. Visão das sprints

| Sprint | Semana | Objetivo | Marco de integração |
|---|---|---|---|
| **S0 — Fundação** | 1 | Projeto rodando, schema congelado, contratos assinados | Login + layout + schema + seed |
| **S1 — Núcleo** | 2–3 | Empresa, plano, saldo, lançamento manual, Diário, Razão, Balancete | Criar empresa → saldo → lançamento → relatórios básicos |
| **S2 — Integrações** | 4–5 | Venda, compra 14x, estoque, BP, DRE, apuração | Compra → estoque → venda/CMV → BP/DRE |
| **S3 — Fechamento** | 6 | PDF completo, E2E, backup, performance | Fluxo completo + PDF + restauração |
| **S4 — Ensaio** | 7 (buffer) | Teste no notebook, bugs, apresentação | Entrega |

---

## 2. Sprint 0 — Fundação (Semana 1)

### Frente A

- [ ] **S0-A1** — Criar projeto Next.js + TypeScript strict + Tailwind + ESLint/Prettier.  
  *(Aceite: `npm run dev`, `npm run lint` e `npm run build` funcionam.)*
- [ ] **S0-A2** — Configurar Prisma + SQLite + `.env` + WAL + `busy_timeout`.  
  *(Aceite: `npx prisma migrate dev` cria o banco e o app conecta.)*
- [ ] **S0-A3** — Schema v1: empresa, usuário, vínculo, conta, saldo inicial, período, sequência, operação, lançamento, auditoria.  
  *(Aceite: migration aplica sem erro; relacionamentos e índices principais.)*
- [ ] **S0-A4** — Login/logout, sessão `httpOnly`, middleware e RBAC básico.  
  *(Aceite: rota protegida redireciona; perfis diferentes veem menus diferentes.)*
- [ ] **S0-A5** — Layout base + design system (MoneyInput, DateInput, AccountSelect, DataTable, Modal, Toast, StatusBadge, EmptyState).  
  *(Aceite: uma tela de exemplo usa todos os componentes.)*
- [ ] **S0-A6** — Esqueleto de empresa + plano de contas (rotas e serviços).  
  *(Aceite: navegação funciona; dados ainda podem ser mockados.)*
- [ ] **S0-A7** — Publicar `core/types.ts` com `ContextoUsuario`, `TipoConta`, `TipoOperacao`, DTOs.  
  *(Aceite: B, C e D importam sem erro.)*
- [ ] **S0-A8** — Seed base: 4 usuários (um por perfil) + empresa demo + plano padrão + período aberto.  
  *(Aceite: `npm run seed` é idempotente.)*

### Frente B

- [ ] **S0-B1** — Especificar `criarOperacao`, `estornarOperacao`, `lancarVenda`, `lancarCompra`, `apurarResultado`.  
  *(Aceite: assinaturas em `docs/` + tipos compilando.)*
- [ ] **S0-B2** — Implementar validações puras (soma D/C, valor > 0, contas diferentes) + testes unitários.  
  *(Aceite: testes cobrem desbalanceado, zero, negativo, mesma conta.)*
- [ ] **S0-B3** — Esqueleto da tela de lançamento manual com linhas dinâmicas e totais.  
  *(Aceite: adiciona/remove linhas e calcula totais no cliente.)*
- [ ] **S0-B4** — Contratos de venda e compra (tipos de entrada/saída).  
  *(Aceite: B e D conseguem codar contra a interface.)*

### Frente C

- [ ] **S0-C1** — Criar fixtures: empresa LTDA, plano padrão, saldo inicial, compra 14x, venda, despesa.  
  *(Aceite: JSONs versionados em `tests/fixtures/`.)*
- [ ] **S0-C2** — Implementar fórmulas puras de saldo, razão, balancete e DRE sobre as fixtures.  
  *(Aceite: testes unitários passam.)*
- [ ] **S0-C3** — Golden test da DRE com o layout do professor.  
  *(Aceite: receitas 5.000, despesas 4.000, lucro 1.000.)*
- [ ] **S0-C4** — Wireframe dos PDFs (Diário, Razão, Balancete, BP, DRE, completo).  
  *(Aceite: layout acordado com o grupo antes de codar.)*

### Frente D

- [ ] **S0-D1** — Configurar CI (lint + test + build) e regras de branch/PR.  
  *(Aceite: PR falha se lint/test/build falharem.)*
- [ ] **S0-D2** — Scripts `iniciar.bat`, `backup.ps1`, `restaurar.ps1` (esqueleto).  
  *(Aceite: scripts executam sem erro em pasta limpa.)*
- [ ] **S0-D3** — Contratos de estoque (`entrarEstoque`, `baixarEstoque`, `getKardex`) e de obrigações.  
  *(Aceite: B e D codam contra a interface.)*
- [ ] **S0-D4** — Catálogo inicial de obrigações por natureza/regime.  
  *(Aceite: MEI, EI, SLU, LTDA, S.A, cooperativa, associação, fundação representados.)*
- [ ] **S0-D5** — Seed demo (em conjunto com A).  
  *(Aceite: sistema abre com dados suficientes para demonstrar.)*

**Marco S0:** `main` roda; login; schema congelado; contratos publicados; seed idempotente.

---

## 3. Sprint 1 — Núcleo (Semanas 2–3)

### Frente A

- [ ] **S1-A1** — CRUD de empresa completo + validação de CNPJ + máscara + matriz/filial.  
  *(Aceite: CNPJ inválido bloqueado; válido salvo e formatado.)*
- [ ] **S1-A2** — Natureza/regime + vínculo com o catálogo de obrigações.  
  *(Aceite: ao salvar empresa, obrigações correspondentes são criadas.)*
- [ ] **S1-A3** — Plano de contas padrão do professor (40 contas) idempotente.  
  *(Aceite: carregar duas vezes não duplica.)*
- [ ] **S1-A4** — Criar/editar/inativar conta + hierarquia + validação de código.  
  *(Aceite: código duplicado bloqueado; conta pai sintética; filha analítica.)*
- [ ] **S1-A5** — Tela de plano em árvore + busca + filtro por tipo.  
  *(Aceite: navegação e criação funcionam.)*
- [ ] **S1-A6** — Saldo inicial por conta + totais + bloqueio se desbalanceado.  
  *(Aceite: salvar gera operação `SALDO_INICIAL`.)*
- [ ] **S1-A7** — Usuários/perfis: criar, editar, inativar, trocar senha.  
  *(Aceite: 4 perfis funcionam; sem permissão = acesso negado.)*
- [ ] **S1-A8** — Auditoria: helper + registro nas escritas + tela com filtros.  
  *(Aceite: criar/editar/excluir logicamente aparecem com antes/depois.)*
- [ ] **S1-A9** — Importar/exportar plano em Excel.  
  *(Aceite: arquivo do professor importa; exportação reabre no Excel.)*

### Frente B

- [ ] **S1-B1** — `criarOperacao` completo: validações, transação, sequência, auditoria.  
  *(Aceite: operação válida grava; inválida não grava nada.)*
- [ ] **S1-B2** — Tela de lançamento manual integrada ao serviço.  
  *(Aceite: salva e mostra ID/número; erro mostra diferença.)*
- [ ] **S1-B3** — Livro Diário: lista, filtros, detalhe, paginação.  
  *(Aceite: operação aparece agrupada com linhas e totais.)*
- [ ] **S1-B4** — Estorno: operação inversa + vínculo + motivo + status.  
  *(Aceite: original fica `ESTORNADA`; nada é apagado.)*
- [ ] **S1-B5** — Tela de trilha original → estorno → atual.  
  *(Aceite: usuário e data/hora visíveis.)*
- [ ] **S1-B6** — Testes de integração do motor + sequência + auditoria.  
  *(Aceite: suíte verde em banco temporário.)*
- [ ] **S1-B7** — Históricos padrão e rascunho local da tela manual.  
  *(Aceite: recarregar a página não perde o rascunho.)*

### Frente C

- [ ] **S1-C1** — `getSaldosConta` real (saldo anterior, débitos, créditos, saldo atual).  
  *(Aceite: confere com fixtures e com o banco.)*
- [ ] **S1-C2** — Livro Razão por conta + saldo acumulado + filtro de período.  
  *(Aceite: saldo final = saldo do balancete.)*
- [ ] **S1-C3** — Lista “contas usadas no Diário”.  
  *(Aceite: só contas com movimento aparecem.)*
- [ ] **S1-C4** — Balancete de verificação + totais + conferência.  
  *(Aceite: Σ saldos devedores = Σ saldos credores.)*
- [ ] **S1-C5** — Testes unitários e de integração de saldo/razão/balancete.  
  *(Aceite: cobertura dos casos com saldo inicial e período.)*
- [ ] **S1-C6** — Exportação XLSX de razão/balancete.  
  *(Aceite: arquivo abre e mantém valores.)*

### Frente D

- [ ] **S1-D1** — CRUD de produto + saldo inicial de estoque.  
  *(Aceite: produto criado, editado, inativado; sem exclusão física.)*
- [ ] **S1-D2** — Motor de custo médio: entrada, saída, ajuste.  
  *(Aceite: exemplo 10@10 + 10@20 = médio 15.)*
- [ ] **S1-D3** — Kardex por produto.  
  *(Aceite: saldo do kardex = saldo do produto.)*
- [ ] **S1-D4** — Bloqueio de estoque negativo + exceção auditada.  
  *(Aceite: venda maior que saldo bloqueada por padrão.)*
- [ ] **S1-D5** — Catálogo de obrigações + tela de checklist.  
  *(Aceite: empresa MEI vê DAS/DASN; LTDA vê IRPJ/CSLL etc.)*
- [ ] **S1-D6** — Dashboard esqueleto (cards + últimas operações).  
  *(Aceite: números vêm dos serviços reais.)*

**Marco S1:** criar empresa → plano → saldo → lançamento manual → Diário → Razão/Balancete.

---

## 4. Sprint 2 — Integrações (Semanas 4–5)

### Frente A

- [ ] **S2-A1** — Fechar/reabrir período com validações e auditoria.  
  *(Aceite: fechado bloqueia lançamento; reabrir só ADMIN com motivo.)*
- [ ] **S2-A2** — Tela de auditoria avançada (diff, filtros, exportação).  
  *(Aceite: encontra ação por usuário/entidade/período.)*
- [ ] **S2-A3** — Multiempresa: seletor + isolamento de dados.  
  *(Aceite: dados de uma empresa não aparecem na outra.)*
- [ ] **S2-A4** — Ajustes de saldo inicial com auditoria (sem sobrescrever).  
  *(Aceite: alteração gera operação de ajuste.)*
- [ ] **S2-A5** — Testes de RBAC e isolamento.  
  *(Aceite: auxiliar não estorna; consulta não escreve.)*

### Frente B

- [ ] **S2-B1** — Venda automática com 4 linhas + documento + itens.  
  *(Aceite: Caixa/Clientes × Receita + CMV × Estoques.)*
- [ ] **S2-B2** — Integração da venda com `baixarEstoque` (CMV real).  
  *(Aceite: CMV = qtd × custo médio; rollback se estoque falhar.)*
- [ ] **S2-B3** — Compra parcelada 14x (12 CP + 2 LP) + parcelas.  
  *(Aceite: uma operação, dois créditos, somas corretas.)*
- [ ] **S2-B4** — Integração da compra com `entrarEstoque`.  
  *(Aceite: quantidade e custo médio atualizados.)*
- [ ] **S2-B5** — Edição via estorno + nova operação + trilha.  
  *(Aceite: original `SUBSTITUIDA`; nova ligada; motivo obrigatório.)*
- [ ] **S2-B6** — Apuração do resultado com prévia e idempotência.  
  *(Aceite: receitas/despesas zeradas; PL atualizado; segunda tentativa bloqueada.)*
- [ ] **S2-B7** — Testes de venda, compra, estorno e apuração.  
  *(Aceite: todos os cenários do guia contábil.)*

### Frente C

- [ ] **S2-C1** — Balanço Patrimonial com grupos, subtotais e equação.  
  *(Aceite: Ativo = Passivo + PL; alerta se não fechar.)*
- [ ] **S2-C2** — DRE idêntica ao professor.  
  *(Aceite: layout e valores; golden test.)*
- [ ] **S2-C3** — DRE após apuração (excluir `APURACAO`).  
  *(Aceite: continua mostrando receitas/despesas do período.)*
- [ ] **S2-C4** — PDF de razão e balancete.  
  *(Aceite: cabeçalho, tabela, totais, páginas.)*
- [ ] **S2-C5** — PDF de BP e DRE.  
  *(Aceite: layout do professor; assinatura.)*
- [ ] **S2-C6** — Testes de BP/DRE com fixtures e comparação com o professor.  
  *(Aceite: diferença zero.)*

### Frente D

- [ ] **S2-D1** — Integração completa estoque ↔ venda/compra.  
  *(Aceite: transação única; idempotência.)*
- [ ] **S2-D2** — Reconciliação estoque × conta `1.0.4 Estoques`.  
  *(Aceite: relatório de diferenças.)*
- [ ] **S2-D3** — Tela de obrigações com status/vencimento/valor.  
  *(Aceite: marcar como pendente/pago; alerta.)*
- [ ] **S2-D4** — Dashboard com receitas, despesas, resultado, estoque e obrigações.  
  *(Aceite: números conferem com os relatórios.)*
- [ ] **S2-D5** — Seed demo completo (compra, venda, despesa, apuração).  
  *(Aceite: sistema abre pronto para demonstrar.)*
- [ ] **S2-D6** — Início do E2E Playwright (login → empresa → saldo).  
  *(Aceite: teste roda em banco limpo.)*
- [ ] **S2-D7** — Testes de custo médio, negativo e idempotência.  
  *(Aceite: cenários do guia contábil.)*

**Marco S2:** compra 14x → estoque → venda com CMV → BP/DRE → apuração.

---

## 5. Sprint 3 — Fechamento (Semana 6)

### Frente A

- [ ] **S3-A1** — Hardening de auth (rate limit, troca de senha, expiração).  
  *(Aceite: 5 tentativas erradas bloqueiam temporariamente.)*
- [ ] **S3-A2** — Revisão de migrations, índices e integridade.  
  *(Aceite: banco limpo sobe com uma migration.)*
- [ ] **S3-A3** — Testes finais de cadastros/auditoria.  
  *(Aceite: suíte verde.)*
- [ ] **S3-A4** — Documentação de operação da Frente A.  
  *(Aceite: tutorial de empresa/plano/saldo/usuários.)*

### Frente B

- [ ] **S3-B1** — Casos de borda: arredondamento, 14x com dízima, estorno de estorno.  
  *(Aceite: testes cobrem; diferença de centavos na última parcela.)*
- [ ] **S3-B2** — Performance do Diário (paginação/índices).  
  *(Aceite: 10 mil operações < 3 s.)*
- [ ] **S3-B3** — Testes finais e correções.  
  *(Aceite: suíte verde.)*
- [ ] **S3-B4** — Documentação “como lançar”.  
  *(Aceite: passo a passo com prints.)*

### Frente C

- [ ] **S3-C1** — PDF completo (capa + tudo + todos os razões).  
  *(Aceite: contém todas as seções; páginas X de Y.)*
- [ ] **S3-C2** — Exportação XLSX de BP/DRE.  
  *(Aceite: abre no Excel.)*
- [ ] **S3-C3** — Golden tests finais e performance.  
  *(Aceite: diferença zero; 10 mil lançamentos < 3 s.)*
- [ ] **S3-C4** — Teste de fumaça dos PDFs.  
  *(Aceite: gera, abre e texto contém títulos.)*
- [ ] **S3-C5** — Documentação “como ler os relatórios”.  
  *(Aceite: guia curto com exemplos.)*

### Frente D

- [ ] **S3-D1** — E2E completo (11 passos do roteiro).  
  *(Aceite: verde em banco limpo.)*
- [ ] **S3-D2** — Backup/restauração em outro notebook.  
  *(Aceite: dados restaurados idênticos.)*
- [ ] **S3-D3** — `iniciar.bat` validado no notebook do instituto.  
  *(Aceite: abre o sistema sem internet.)*
- [ ] **S3-D4** — Dashboard final + reconciliação.  
  *(Aceite: números coerentes.)*
- [ ] **S3-D5** — Relatório de bugs e priorização.  
  *(Aceite: nenhum bloqueador aberto.)*
- [ ] **S3-D6** — Documento de entrega/apresentação.  
  *(Aceite: roteiro de 10 min.)*

**Marco S3:** fluxo completo + PDF + E2E verde + restauração testada.

---

## 6. Sprint 4 — Ensaio e entrega (Semana 7, buffer)

- [ ] **S4-01** — Rodar o sistema no notebook do instituto, com dados fictícios.
- [ ] **S4-02** — Corrigir bugs encontrados no ensaio.
- [ ] **S4-03** — Ensaiar a apresentação (10 min) com as 4 frentes.
- [ ] **S4-04** — Conferir DRE e BP com o sistema do professor, lado a lado.
- [ ] **S4-05** — Gerar PDF completo de demonstração e anexar.
- [ ] **S4-06** — Atualizar README, docs e checklist final.
- [ ] **S4-07** — Entrega.

---

## 7. Roteiro de demonstração (10 minutos)

1. **Abertura** (30 s): problema, objetivo e as 4 frentes.
2. **Frente A** (2 min): criar empresa LTDA, CNPJ, natureza, plano padrão, conta própria, saldo inicial 50.000 (Caixa × Capital).
3. **Frente B** (3 min): lançamento manual, tentativa desbalanceada bloqueada, compra 14.000 em 14x (12 CP + 2 LP), venda 5.000 com CMV 3.000 (4 linhas), estorno com trilha.
4. **Frente C** (2 min): Diário, Razão, Balancete, BP (Ativo 65.000 = Passivo 14.000 + PL 51.000), DRE (receitas 5.000, despesas 4.000, lucro 1.000), PDF completo.
5. **Frente D** (2 min): estoque/kardex, custo médio, obrigações por natureza, dashboard, backup.
6. **Fechamento** (30 s): apuração, persistência após reiniciar, aprendizados.

> **Dica:** deixar uma empresa demo pronta, mas fazer a demonstração criando outra do zero para provar o requisito do teste com os usuários.

---

## 8. Plano de testes

### 8.1 Unitários (Vitest)

- [ ] `money`: conversão BRL ↔ centavos, arredondamento, divisão de parcelas.
- [ ] CNPJ: válido, inválido, matriz/filial.
- [ ] Saldo por natureza: devedora e credora.
- [ ] Partida dobrada: válida, desbalanceada, zero, negativa.
- [ ] DRE: receitas, despesas, lucro, prejuízo, após apuração.
- [ ] BP: grupos, subtotais, equação.
- [ ] Custo médio: entrada, saída, nova entrada.
- [ ] Apuração: zeragem e transferência ao PL.

### 8.2 Integração (Vitest + SQLite temporário)

- [ ] Criar empresa + plano + saldo inicial.
- [ ] Criar operação + linhas + sequência + auditoria.
- [ ] Estornar e conferir status/trilha.
- [ ] Venda + estoque + CMV.
- [ ] Compra 14x + parcelas + estoque.
- [ ] Fechar período e bloquear lançamento.
- [ ] Isolamento por empresa.

### 8.3 Golden tests

- [ ] DRE da fixture = DRE do professor.
- [ ] BP da fixture = valores esperados.
- [ ] Balancete fecha.
- [ ] Razão final = balancete.

### 8.4 E2E (Playwright)

- [ ] Login.
- [ ] Criar empresa.
- [ ] Carregar plano.
- [ ] Saldo inicial.
- [ ] Compra 14x.
- [ ] Venda com CMV.
- [ ] Despesa.
- [ ] Diário/Razão/Balancete/BP/DRE.
- [ ] Apuração.
- [ ] PDF completo.
- [ ] Reiniciar e conferir persistência.

### 8.5 Manual (notebook do instituto)

- [ ] Instalar do zero seguindo o README.
- [ ] Abrir sem internet.
- [ ] Criar empresa e lançar.
- [ ] Fechar o notebook e retomar.
- [ ] Gerar PDF e abrir fora do sistema.
- [ ] Restaurar backup.

---

## 9. Critérios de “pronto para entregar”

- [ ] Todos os requisitos **Must** implementados.
- [ ] Nenhum bug bloqueador aberto.
- [ ] E2E verde em banco limpo.
- [ ] DRE/BP conferidos com o professor.
- [ ] PDF completo gerado e revisado.
- [ ] Backup/restauração testados.
- [ ] 4 perfis testados.
- [ ] Auditoria mostrando ações das 4 frentes.
- [ ] README e docs atualizados.
- [ ] Apresentação ensaiada.

---

## 10. Perguntas para confirmar com o professor

1. O plano de contas deve ser **exatamente** o do sistema (40 contas) ou podemos acrescentar contas padrão?
2. A DRE deve seguir **exatamente** o layout receitas/despesas, ou o CMV deve aparecer separado?
3. O “balancete” do documento é a **tela de lançamento** ou o **relatório de verificação**? (Vamos implementar os dois, mas vale confirmar.)
4. A venda automática de **4 lançamentos** é Caixa/Clientes × Receita + CMV × Estoques, ou inclui impostos?
5. A compra de **14x = 12x CP + 2x LP** é uma regra fixa ou apenas um exemplo configurável?
6. O sistema precisa de **login**? (O documento fala em “responsável pela ação”; vamos implementar.)
7. Estoque: **custo médio** ou PEPS? (Vamos de custo médio, salvo orientação contrária.)
8. Precisa de **apuração do resultado** e fechamento de exercício?
9. O PDF deve ser **um arquivo único com tudo** ou vários relatórios separados? (Vamos fazer os dois.)
10. O sistema deve ser **multiempresa** ou uma empresa por instalação?

---

## 11. Riscos do cronograma

| Risco | Prob. | Impacto | Resposta |
|---|---|---|---|
| Schema atrasar | Média | Alto | A entrega o schema até o fim da semana 1; mudanças depois só por PR |
| Integração B ↔ D atrasar | Média | Alto | Contrato na semana 1; stub de custo médio até D entregar |
| DRE divergir do professor | Média | Alto | Golden test na semana 1; comparação lado a lado na semana 5 |
| PDF completo estourar memória | Baixa | Médio | Streaming + teste com 10 mil lançamentos |
| Notebook do instituto não rodar | Média | Alto | Testar na semana 3, não só no fim; `iniciar.bat` e modo offline |
| Perda de dados | Baixa | Alto | Backup automático + restauração testada |
| Escopo crescer | Alta | Alto | Cortar “Could” na ordem do plano de contingência |
| Pessoa sobrecarregada | Média | Alto | Redistribuir tarefas “Could”; revisão cruzada; daily |

---

## 12. Quadro resumido de tarefas por pessoa

| Pessoa | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|---|
| **A** | 8 tarefas | 9 tarefas | 5 tarefas | 4 tarefas |
| **B** | 4 tarefas | 7 tarefas | 7 tarefas | 4 tarefas |
| **C** | 4 tarefas | 6 tarefas | 6 tarefas | 5 tarefas |
| **D** | 5 tarefas | 6 tarefas | 7 tarefas | 6 tarefas |

> O equilíbrio é aproximado. Se A ficar sobrecarregada na semana 1, D assume CI/scripts/seed e B ajuda no design system.
