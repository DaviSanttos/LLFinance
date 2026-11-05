# 03 — Divisão do Trabalho em 4 Frentes Ponta a Ponta

> **Projeto:** LLFinance — Sistema Contábil Educacional  
> **Versão:** 1.0 — 05/11/2026  
> **Regra da divisão:** cada pessoa entrega **banco + serviço + API + tela + teste + documentação** da sua parte, e consegue demonstrar o fluxo completo funcionando.

---

## 1. Princípios da divisão

1. **Fatia vertical, não camada.** Ninguém é “só front”, “só back” ou “só banco”. Cada frente atravessa todas as camadas do seu domínio.
2. **Contrato antes do código.** Na semana 1, as interfaces entre as frentes são congeladas em `src/core/types.ts` e nos `queries.ts`/`service.ts` de cada módulo.
3. **Dono de pasta.** Cada frente tem pastas próprias. Para mexer na do outro, só via PR com revisão.
4. **Schema único.** A Frente A é a dona do `prisma/schema.prisma`; as demais pedem campos e revisam.
5. **Integração semanal.** Quarta e sexta são dias de merge, suíte completa e correção de contrato.
6. **Nada de exclusão definitiva.** Vale para todas as frentes: cadastro usa exclusão lógica; lançamento usa estorno; tudo vai para a auditoria.
7. **A pessoa demonstra a sua parte.** Cada uma precisa rodar o sistema do zero e mostrar o fluxo da sua frente, não apenas o código.

---

## 2. Visão geral

| Frente | Nome | Missão | Entrega principal | Depende de |
|---|---|---|---|---|
| **A** | **Fundação & Cadastros** | Garantir que exista empresa, plano de contas, saldo inicial, usuário e auditoria para todos trabalharem | Base do sistema + cadastros + segurança | — |
| **B** | **Lançamentos & Diário** | Ser o coração contábil: registrar operações com partida dobrada, vender, comprar, estornar e apurar | Motor de lançamentos + Livro Diário | A (schema/auth/contas) e D (estoque) |
| **C** | **Livros & Demonstrações** | Transformar os lançamentos em informação contábil: Razão, Balancete, BP, DRE e PDF | Todos os relatórios e o PDF completo | A (contas) e B (operações) |
| **D** | **Estoque, Tributação & Qualidade** | Controlar o estoque, orientar obrigações por natureza e garantir que tudo funcione junto no notebook | Estoque + obrigações + dashboard + E2E + entrega | A, B e C |

### 2.1 O que cada frente **não** faz

- **A** não cria lançamentos nem calcula relatórios.
- **B** não calcula saldos de relatório nem gera PDF final; não mexe direto no estoque.
- **C** não grava dados contábeis; só lê e calcula.
- **D** não cria lançamentos contábeis; devolve CMV/quantidade para B montar as linhas.

---

## 3. Frente A — Fundação & Cadastros

### 3.1 Missão

> “Sem a Frente A, ninguém começa.” Entregar a empresa, o plano de contas, o saldo inicial, os usuários e a auditoria — com a qualidade de base que as outras três frentes vão consumir.

### 3.2 Escopo detalhado (ponta a ponta)

#### A1. Setup e base técnica
- [ ] Criar o projeto Next.js + TypeScript strict + Tailwind + ESLint/Prettier.
- [ ] Configurar Prisma + SQLite (`.env`, `DATABASE_URL`, WAL, `busy_timeout`).
- [ ] Criar `src/core/db.ts`, `errors.ts`, `money.ts`, `period.ts`.
- [ ] Criar layout base, menu lateral, cabeçalho, tema e componentes essenciais:
  - `MoneyInput` (máscara BRL → centavos)
  - `DateInput` (dd/mm/aaaa)
  - `AccountSelect` (busca por código/nome)
  - `DataTable`, `Modal`, `Toast`, `StatusBadge`, `EmptyState`, `ConfirmDialog`
- [ ] Configurar scripts `dev`, `build`, `start`, `test`, `lint`, `seed`.

#### A2. Empresa
- [ ] CRUD com exclusão lógica.
- [ ] Campos: razão social, nome fantasia, CNPJ, endereço, natureza jurídica, regime, capital social, início/fim do exercício, data de abertura.
- [ ] Validação de CNPJ (14 dígitos + dígitos verificadores + matriz/filial).
- [ ] Consulta pública opcional (Redesim) com fallback offline.
- [ ] Naturezas: MEI, EI, SLU, LTDA, S.A, Cooperativa, Associação, Fundação.
- [ ] Regimes: MEI, Simples Nacional, Lucro Presumido, Lucro Real.
- [ ] Ao criar a empresa, disparar o catálogo de obrigações da Frente D (contrato).
- [ ] Multiempresa: usuário pode ter vínculo com mais de uma empresa; seletor no topo.

#### A3. Plano de contas
- [ ] Carregar o **plano padrão do professor** (40 contas) de forma idempotente.
- [ ] Estrutura: 1/2 Ativo, 3 Passivo, 4 PL, 5 Despesa, 6 Receita, 7 Apuração.
- [ ] Campos: código, nome, tipo, natureza (devedora/credora), grupo, conta pai, analítica, ativa, padrão.
- [ ] Criar/editar/inativar conta personalizada (nunca apagar).
- [ ] Validar código único por empresa e hierarquia (pai sintético, filha analítica).
- [ ] Importar/exportar Excel com as colunas `Número`, `Nome da Conta`, `Tipo`, `Subtipo`.
- [ ] Tela com busca, filtro por tipo e visualização em árvore.

#### A4. Saldos iniciais
- [ ] Tela por conta com débito/crédito e totais em tempo real.
- [ ] Bloquear salvamento se débitos ≠ créditos.
- [ ] Salvar como operação `SALDO_INICIAL` (via contrato com B) na data de abertura.
- [ ] Exibir “saldo inicial pendente” no dashboard até ser concluído.
- [ ] Alteração posterior: gerar ajuste auditado, nunca sobrescrever.

#### A5. Usuários, perfis e sessão
- [ ] Login/logout com cookie `httpOnly` assinado.
- [ ] Hash de senha com `bcryptjs`.
- [ ] Perfis: ADMIN, CONTADOR, AUXILIAR, CONSULTA (matriz em `docs/02`).
- [ ] Middleware de proteção de rotas + revalidação no servidor.
- [ ] Criar/editar/inativar usuário; convite com senha temporária.
- [ ] Troca de senha e “esqueci a senha” local (pergunta de segurança ou redefinição pelo admin).

#### A6. Período contábil
- [ ] Criar exercício com início/fim.
- [ ] Status ABERTO/FECHADO/REABERTO.
- [ ] Fechar período: valida pendências, confirma e audita.
- [ ] Reabrir: somente ADMIN, com motivo e auditoria.
- [ ] Bloqueio de escrita em período fechado (serviço compartilhado com B).

#### A7. Auditoria e exclusão lógica
- [ ] Tabela `auditoria` + helper `registrarAuditoria`.
- [ ] Registrar `LOGIN`, `LOGOUT`, `CRIAR`, `EDITAR`, `EXCLUIR_LOGICO`, `FECHAR/REABRIR_PERIODO`, `GERAR_PDF`.
- [ ] Tela de auditoria com filtros (usuário, entidade, ação, período) e diff antes/depois.
- [ ] Nenhum `DELETE` físico em cadastros; `deleted_at`/`deleted_by`.

#### A8. Seed e dados de demonstração
- [ ] Seed base: usuários dos 4 perfis, empresa demo, plano padrão, período aberto.
- [ ] Seed de demonstração completa (em conjunto com D): saldo inicial, compra, venda, despesa, apuração.

### 3.3 Telas/rotas

| Rota | Tela |
|---|---|
| `/login` | Login |
| `/empresas` | Lista/seleção de empresas |
| `/empresas/nova` | Cadastro de empresa |
| `/empresas/:id` | Editar empresa e ver obrigações |
| `/plano-contas` | Plano de contas (árvore, criar, importar/exportar) |
| `/saldos-iniciais` | Saldo inicial por conta |
| `/usuarios` | Usuários e perfis |
| `/auditoria` | Trilha de auditoria |
| `/periodos` | Exercícios e fechamento |

### 3.4 Entidades/migrations que a Frente A possui

`Empresa`, `Usuario`, `UsuarioEmpresa`, `Conta`, `SaldoInicial`, `PeriodoContabil`, `SequenciaDiario`, `Auditoria`.

> As demais entidades entram no schema sob revisão de A, mas são “propriedade funcional” de B/C/D.

### 3.5 Contratos que expõe

```ts
// A expõe para B, C e D
validarPeriodoAberto(ctx, data): Promise<void>
getContaAnalitica(ctx, contaId): Promise<ContaDTO>
getPlanoContas(ctx): Promise<ContaDTO[]>
registrarAuditoria(tx, ctx, evento): Promise<void>
getEmpresa(ctx): Promise<EmpresaDTO>
```

### 3.6 Regras contábeis aplicadas

- RN02, RN03, RN04, RN07, RN08, RN11, RN13, RN16, RN26, RN27, RN28, RN31, RN34.
- Código 1/2 = Ativo; 3 = Passivo; 4 = PL; 5 = Despesa; 6 = Receita; 7 = Apuração.
- Natureza da conta define o saldo (devedora/credora).

### 3.7 Entregáveis

- [ ] Código das telas e serviços de cadastros.
- [ ] Migrations e seed.
- [ ] Testes unitários: CNPJ, dinheiro, período, RBAC.
- [ ] Testes de integração: criar empresa, importar plano, salvar saldo, auditoria.
- [ ] Documento curto de operação: “como criar a empresa e o plano de contas”.
- [ ] Demonstração de 5 minutos.

### 3.8 Critérios de aceite

- [ ] Banco limpo → criar empresa → plano padrão carregado sem duplicar.
- [ ] CNPJ inválido é bloqueado; CNPJ válido é aceito e formatado.
- [ ] Conta duplicada é bloqueada; conta sintética não recebe lançamento.
- [ ] Conta personalizada é criada, aparece na árvore e pode ser inativada.
- [ ] Saldo inicial desbalanceado é bloqueado; balanceado gera operação e aparece no razão.
- [ ] Login funciona para os 4 perfis; cada um vê apenas o que pode.
- [ ] Ações geram auditoria com usuário, data/hora e antes/depois.
- [ ] Excluir cadastro não remove a linha do banco; fica `deleted_at`.
- [ ] Fechar período bloqueia lançamento; reabrir exige ADMIN e audita.
- [ ] Reiniciar o servidor mantém todos os dados.

### 3.9 Dependências e riscos

- **Depende de:** nada (é a base). Precisa entregar schema/auth/plano até o fim da semana 1.
- **Risco:** virar gargalo. Mitigação: congelar schema cedo, usar stubs e priorizar o caminho crítico.
- **Risco:** autenticação atrasar. Mitigação: começar por um login simples e evoluir.

### 3.10 Pastas

`prisma/`, `src/core/`, `src/modules/cadastros/`, `src/app/(auth)`, `src/app/(app)/empresas|plano-contas|saldos-iniciais|usuarios|auditoria|periodos`, `src/components/ui/`.

### 3.11 Ordem de implementação

1. Setup + schema + auth.
2. Empresa + CNPJ.
3. Plano de contas padrão + custom.
4. Saldo inicial.
5. Usuários/perfis.
6. Período + fechamento.
7. Auditoria/tela.
8. Seed, testes, docs.

**Estimativa:** 12–15 dias de trabalho distribuídos em 6 semanas.

---

## 4. Frente B — Lançamentos & Diário

### 4.1 Missão

> “Se não fecha, não grava.” Ser o motor contábil que garante partida dobrada, registra tudo no Diário com ID de operação e permite vender, comprar, estornar e apurar sem perder histórico.

### 4.2 Escopo detalhado (ponta a ponta)

#### B1. Motor de lançamentos
- [ ] `criarOperacao(ctx, input)` com validações:
  - débitos = créditos (em centavos);
  - pelo menos 2 linhas;
  - valor > 0;
  - conta analítica, ativa e da empresa;
  - contas de débito e crédito diferentes na mesma linha;
  - data dentro do período aberto;
  - histórico obrigatório;
  - usuário com permissão.
- [ ] Gravar cabeçalho + linhas + número sequencial do Diário + auditoria **na mesma transação**.
- [ ] Gerar `numero` legível (`OP-2026-000001`) e `id` único.
- [ ] Tipos: `MANUAL`, `VENDA`, `COMPRA`, `SALDO_INICIAL`, `ESTORNO`, `APURACAO`, `AJUSTE_ESTOQUE`.
- [ ] Status: `ATIVA`, `ESTORNADA`, `SUBSTITUIDA`.
- [ ] Retornar `OperacaoDTO` com linhas e trilha.

#### B2. Tela de lançamento manual (“balancete”)
- [ ] Linhas dinâmicas: conta, débito/crédito, valor, histórico.
- [ ] Totais de débito e crédito em tempo real.
- [ ] Indicador visual “fecha / não fecha” e diferença.
- [ ] Adicionar/remover linhas; duplicar linha; limpar.
- [ ] Salvar como uma única operação; após salvar, mostrar ID e link para o Diário.
- [ ] Históricos padrão (ex.: “Compra de mercadoria”, “Venda de mercadoria”, “Pagamento de despesa”).
- [ ] Rascunho local para não perder o que foi digitado.

#### B3. Livro Diário
- [ ] Lista cronológica agrupada por operação.
- [ ] Filtros: período, tipo, status, usuário, conta, texto.
- [ ] Detalhe da operação com linhas, totais, usuário, data/hora e trilha.
- [ ] Exibir estorno e substituição (original → estorno → atual).
- [ ] Exportar dados para PDF (layout da Frente C) e XLSX.
- [ ] Paginação e ordenação por data/número.

#### B4. Venda automática
- [ ] Formulário: data, cliente (opcional), condição (à vista/a prazo), itens (produto, quantidade, valor unitário) ou valor simples.
- [ ] Gerar **4 linhas**:
  - D Caixa (ou Clientes) / C Receita de Vendas;
  - D CMV / C Estoques.
- [ ] Se houver estoque: chamar `baixarEstoque` da Frente D para obter o CMV real.
- [ ] Se não houver estoque: permitir informar o custo manualmente.
- [ ] Validar estoque insuficiente (bloquear ou autorizar com auditoria).
- [ ] Criar `Documento` de venda + itens + vínculo com a operação.
- [ ] Serviço: 2 linhas (Caixa/Clientes × Receita), sem CMV.

#### B5. Compra a prazo parcelada
- [ ] Formulário: data, fornecedor, total, condição, conta de destino (Estoques ou despesa), parcelas.
- [ ] Exemplo obrigatório: **14x → 12x Fornecedores (CP) + 2x Fornecedores LP**.
- [ ] Gerar uma operação com:
  - D Estoques (total);
  - C Fornecedores CP (12/14 do total);
  - C Fornecedores LP (2/14 do total).
- [ ] Criar parcelas com vencimento e conta (CP/LP).
- [ ] Arredondamento: diferença de centavos na última parcela.
- [ ] Se houver estoque: chamar `entrarEstoque` para atualizar quantidade e custo médio.
- [ ] Compra à vista: D Estoques / C Caixa.

#### B6. Edição, exclusão e estorno
- [ ] Nunca `DELETE` em operação.
- [ ] Estornar: gerar operação inversa (`ESTORNO`), vincular `reversal_of_id`, marcar original como `ESTORNADA`, exigir motivo e permissão.
- [ ] Editar: estornar original + criar nova operação, vincular `edited_from_id`/`replaced_by_id`, exigir motivo.
- [ ] Tela de trilha: original, estorno e atual, com usuário/data/hora.
- [ ] Bloquear estorno de operação já estornada.
- [ ] Bloquear estorno de `APURACAO` sem reabrir exercício (regra de negócio).

#### B7. Apuração do resultado
- [ ] Prévia: receitas, despesas e resultado calculado.
- [ ] Confirmar: transferir receitas para `7.0.1` e despesas para `7.0.1`.
- [ ] Transferir o saldo de `7.0.1` para `4.0.3 Lucros Acumulados` (lucro) ou `4.0.x Prejuízos Acumulados` (prejuízo).
- [ ] Gerar uma operação `APURACAO` com todas as linhas e auditoria.
- [ ] Idempotente por exercício: não permitir apurar duas vezes.
- [ ] Garantir que a DRE do período continue correta após a apuração (ver RN23).

#### B8. Testes
- [ ] Unitários: validação de partida dobrada, arredondamento, contas inválidas.
- [ ] Property-based: para qualquer conjunto de linhas, soma D = soma C ou erro.
- [ ] Integração: operação + banco + auditoria + sequência.
- [ ] Venda: 4 linhas e CMV correto.
- [ ] Compra 14x: 12 CP + 2 LP e somas.
- [ ] Estorno: trilha e status.
- [ ] Apuração: contas de resultado zeradas e PL atualizado.

### 4.3 Telas/rotas

| Rota | Tela |
|---|---|
| `/lancamentos` | Lista de operações + filtros |
| `/lancamentos/novo` | Balancete de lançamento manual |
| `/lancamentos/venda` | Venda automática |
| `/lancamentos/compra` | Compra parcelada |
| `/diario` | Livro Diário |
| `/diario/:id` | Detalhe/trilha da operação |
| `/apuracao` | Apuração do resultado |

### 4.4 Entidades que a Frente B opera

`Operacao`, `Lancamento`, `SequenciaDiario`, `Documento`, `DocumentoItem`, `Parcela` (em conjunto com A/D).

### 4.5 Contratos que expõe

```ts
criarOperacao(ctx, input): Promise<OperacaoDTO>
estornarOperacao(ctx, operacaoId, motivo): Promise<OperacaoDTO>
lancarVenda(ctx, input): Promise<OperacaoDTO>
lancarCompra(ctx, input): Promise<OperacaoDTO>
apurarResultado(ctx, exercicio): Promise<OperacaoDTO>
listarDiario(ctx, filtros): Promise<Pagina<OperacaoDTO>>
getOperacao(ctx, id): Promise<OperacaoDTO>
```

### 4.6 Regras contábeis aplicadas

- RN01–RN06, RN09–RN12, RN14, RN15, RN17–RN20, RN22–RN27, RN29, RN30.
- **Competência:** data do fato gerador.
- **Venda:** Caixa/Clientes × Receita + CMV × Estoques.
- **Compra:** Estoques × Fornecedores CP + Fornecedores LP.
- **Apuração:** 7.0.1 e PL.

### 4.7 Entregáveis

- [ ] Motor + serviços + telas.
- [ ] Migrations revisadas por A.
- [ ] Testes unitários, de integração e property-based.
- [ ] Documento “como lançar uma operação, uma venda e uma compra parcelada”.
- [ ] Demonstração de 5 minutos.

### 4.8 Critérios de aceite

- [ ] Operação desbalanceada é bloqueada com a diferença exata.
- [ ] Operação com valor zero/negativo, conta sintética, inativa ou de outra empresa é bloqueada.
- [ ] Operação em período fechado é bloqueada.
- [ ] Operação salva recebe ID e número sequencial, e aparece no Diário.
- [ ] Venda gera exatamente 4 linhas e o CMV bate com o custo médio.
- [ ] Compra 14x gera 12x CP + 2x LP, com parcelas e somas corretas.
- [ ] Estorno não apaga nada e mostra a trilha completa.
- [ ] Edição gera estorno + nova operação, com motivo.
- [ ] Apuração zera receitas/despesas, atualiza PL e não pode ser repetida.
- [ ] DRE do período continua correta após a apuração.
- [ ] Testes passam e o fluxo completo funciona com o estoque da Frente D.

### 4.9 Dependências e riscos

- **Depende de:** A (schema, contas, período, auth) e D (estoque).
- **Risco:** integração com estoque atrasar. Mitigação: interface acordada na semana 1; B usa um stub de custo médio até D entregar.
- **Risco:** regra de apuração divergir. Mitigação: fixture e revisão cruzada com C.

### 4.10 Pastas

`src/modules/lancamentos/`, `src/app/(app)/lancamentos|diario|apuracao`.

### 4.11 Ordem de implementação

1. Motor + validações + testes.
2. Tela manual + Diário.
3. Estorno/trilha.
4. Venda (com stub de estoque).
5. Compra parcelada.
6. Integração real com estoque.
7. Apuração.
8. Testes de borda + docs.

**Estimativa:** 15–18 dias distribuídos em 6 semanas.

---

## 5. Frente C — Livros & Demonstrações

### 5.1 Missão

> “Transformar lançamento em demonstração.” Garantir que Razão, Balancete, Balanço e DRE batam entre si, com o sistema do professor e com a realidade do estoque — e que tudo vire um PDF apresentável.

### 5.2 Escopo detalhado (ponta a ponta)

#### C1. Camada de saldos (read model)
- [ ] `getSaldosConta(ctx, inicio, fim, opcoes)`:
  - saldo anterior (antes de `inicio`);
  - débitos e créditos do período;
  - saldo atual pela natureza da conta;
  - incluir/excluir saldo inicial;
  - ignorar operações de apuração quando solicitado.
- [ ] `getRazao(ctx, contaId, inicio, fim)` com saldo anterior, movimentos e saldo acumulado.
- [ ] Consultas agregadas no banco; nunca carregar tudo em memória.
- [ ] Cache por request (quando necessário) sem risco de dado velho.

#### C2. Livro Razão
- [ ] Tela por conta (busca por código/nome).
- [ ] Colunas: data, histórico, débito, crédito, saldo acumulado.
- [ ] Saldo anterior e saldo final destacados.
- [ ] Filtro por período.
- [ ] Lista de “contas usadas no Diário” (documento, passo 3).
- [ ] PDF por conta e PDF consolidado.
- [ ] Exportação XLSX/CSV.

#### C3. Balancete de verificação
- [ ] Todas as contas com movimento/saldo.
- [ ] Colunas: código, conta, saldo anterior, débitos, créditos, saldo atual (D/C).
- [ ] Totais de débitos e créditos; conferência visual “fecha/não fecha”.
- [ ] Filtro por período e por grupo.
- [ ] PDF e XLSX.

#### C4. Balanço Patrimonial
- [ ] Grupos: Ativo Circulante, Ativo Não Circulante (Realizável LP, Investimentos, Imobilizado, Intangível); Passivo Circulante, Passivo Não Circulante; PL.
- [ ] Subtotal por grupo e total geral.
- [ ] Equação `Ativo = Passivo + PL`; alerta se não fechar.
- [ ] Data de referência (fim do período).
- [ ] Opcional: Razonete da ARE (como no sistema do professor).
- [ ] PDF e XLSX.

#### C5. DRE
- [ ] Layout **idêntico ao do professor**:
  1. `RECEITAS OPERACIONAIS` (contas tipo Receita, saldo líquido);
  2. `TOTAL DE RECEITAS (+)`;
  3. `DESPESAS OPERACIONAIS` (contas tipo Despesa/Custo, inclui CMV/CPV/CSP);
  4. `TOTAL DE DESPESAS (-)`;
  5. `LUCRO LÍQUIDO DO EXERCÍCIO` ou `PREJUÍZO LÍQUIDO DO EXERCÍCIO` = receitas − despesas.
- [ ] Filtro por período.
- [ ] Excluir `SALDO_INICIAL` e operações `APURACAO` do cálculo.
- [ ] Continuar correta depois da apuração.
- [ ] PDF e XLSX.
- [ ] Golden test comparando com a fixture do professor.

#### C6. PDF completo
- [ ] Capa com dados da empresa, período e emissão.
- [ ] Plano de contas.
- [ ] Saldos iniciais.
- [ ] Livro Diário completo.
- [ ] **Todos os Livros Razão** das contas usadas.
- [ ] Balancete.
- [ ] Balanço Patrimonial.
- [ ] DRE.
- [ ] Resumo de estoque (dados da Frente D).
- [ ] Resumo de auditoria (quem fez o quê).
- [ ] Cabeçalho/rodapé em todas as páginas, “Página X de Y”, assinatura.
- [ ] Geração em streaming; testar com 10 mil lançamentos.
- [ ] Registrar `GERAR_PDF` na auditoria.

#### C7. Testes
- [ ] Unitários: fórmulas de saldo, DRE, BP, agrupamento.
- [ ] Golden: fixtures JSON com resultados esperados.
- [ ] Integração: banco com lançamentos reais.
- [ ] PDF: fumaça (gera, páginas > 0, texto contém títulos).
- [ ] Performance: 10 mil lançamentos < 3 s.
- [ ] Conferência cruzada: razão final = balancete; BP fecha; DRE = 7.0.1 antes da apuração.

### 5.3 Telas/rotas

| Rota | Tela |
|---|---|
| `/razao` | Seleção de conta + razão |
| `/balancete` | Balancete de verificação |
| `/balanco` | Balanço Patrimonial |
| `/dre` | DRE |
| `/relatorios` | Central de relatórios e PDF completo |

### 5.4 Entidades que a Frente C lê

`Conta`, `SaldoInicial`, `Operacao`, `Lancamento`, `Produto`, `MovimentoEstoque`, `Auditoria` (somente leitura).

### 5.5 Contratos que expõe

```ts
getSaldosConta(...): Promise<SaldoContaDTO[]>
getRazao(...): Promise<RazaoDTO>
gerarBalancete(...): Promise<BalanceteDTO>
gerarBalanco(...): Promise<BalancoDTO>
gerarDre(...): Promise<DreDTO>
gerarPdfRazao(...), gerarPdfBalancete(...), gerarPdfBalanco(...), gerarPdfDre(...)
gerarRelatorioCompletoPdf(...)
```

### 5.6 Regras contábeis aplicadas

- RN05, RN07, RN22, RN23, RN24, RN26, RN27, RN33.
- Natureza da conta no cálculo do saldo.
- DRE = receitas − despesas.
- BP = Ativo × Passivo + PL.
- Apuração não distorce a DRE.

### 5.7 Entregáveis

- [ ] Serviços de saldo/razão/balancete/BP/DRE.
- [ ] Telas e PDFs.
- [ ] Fixtures e golden tests.
- [ ] Documento “como ler os relatórios” e “como comparar com o professor”.
- [ ] Demonstração de 5 minutos.

### 5.8 Critérios de aceite

- [ ] Razão mostra saldo anterior, movimentos, saldo acumulado e final corretos.
- [ ] Balancete fecha (Σ saldos devedores = Σ saldos credores).
- [ ] BP fecha e agrupa corretamente.
- [ ] DRE reproduz o layout e os valores do professor.
- [ ] DRE continua correta após a apuração.
- [ ] PDF completo contém todas as seções e todos os razões.
- [ ] Relatórios batem entre si e com as fixtures.
- [ ] Performance aceitável no notebook.
- [ ] Exportação XLSX funciona.

### 5.9 Dependências e riscos

- **Depende de:** A (contas) e B (operações).
- **Risco:** B atrasar. Mitigação: C começa com fixtures mockadas e troca para o banco real na semana 3.
- **Risco:** layout divergir. Mitigação: congelar o layout na semana 1 e comparar com o sistema do professor.

### 5.10 Pastas

`src/modules/relatorios/`, `src/app/(app)/razao|balancete|balanco|dre|relatorios`, `tests/fixtures/`.

### 5.11 Ordem de implementação

1. `getSaldosConta` + fixtures.
2. Razão.
3. Balancete.
4. BP.
5. DRE + golden do professor.
6. PDFs individuais.
7. PDF completo.
8. XLSX + performance.

**Estimativa:** 14–17 dias distribuídos em 6 semanas.

---

## 6. Frente D — Estoque, Tributação & Qualidade

### 6.1 Missão

> “Fazer o sistema funcionar junto e no notebook do instituto.” Controlar estoque com custo médio, orientar obrigações por natureza, montar o dashboard, garantir o E2E, o backup e a entrega.

### 6.2 Escopo detalhado (ponta a ponta)

#### D1. Produtos
- [ ] CRUD de produto: nome, SKU, unidade, estoque mínimo, ativo, exclusão lógica.
- [ ] Saldo inicial de estoque (quantidade + custo unitário).
- [ ] Busca e filtro.
- [ ] Importação/exportação CSV (opcional).

#### D2. Motor de estoque
- [ ] Entrada: recalcular custo médio ponderado:
  `novo_custo = (qtd_atual × custo_atual + qtd_entrada × custo_entrada) / (qtd_atual + qtd_entrada)`.
- [ ] Saída: usar custo médio vigente; `CMV = qtd_saída × custo_médio`.
- [ ] Ajuste de inventário: sobra/falta com justificativa e auditoria.
- [ ] Kardex por produto (data, tipo, quantidade, custo unitário, saldo).
- [ ] Bloquear estoque negativo (parâmetro por empresa) ou exigir autorização auditada.
- [ ] Idempotência por `operacaoId`.
- [ ] Reconciliação: saldo do estoque × saldo contábil da conta `1.0.4 Estoques`.

#### D3. Integração com a Frente B
- [ ] `entrarEstoque` chamado na compra.
- [ ] `baixarEstoque` chamado na venda; devolver CMV.
- [ ] Mesma transação: se o lançamento falhar, o estoque não muda; se o estoque falhar, o lançamento não grava.
- [ ] Testes de idempotência e de rollback.
- [ ] Venda sem estoque: permitir custo manual e sinalizar.

#### D4. Obrigações por natureza/regime
- [ ] Catálogo configurável (seed) por natureza:
  - MEI: DAS, DASN-SIMEI, limite R$ 81.000/ano (conforme documento).
  - EI: IRPF, INSS, ISS/ICMS conforme atividade; sem limite; responsabilidade pessoal.
  - SLU/LTDA: Simples/Presumido/Real; IRPJ, CSLL, PIS, COFINS, ICMS/ISS, folha; DRE/BP.
  - S.A: ações, CVM (se aberta), auditoria independente, BP/DRE/DMPL/DFC/notas.
  - Cooperativa: ato cooperado, sobras, assembleia, tributos específicos.
  - Associação: sem fins lucrativos, imunidade/isenção se requisitos, prestação de contas.
  - Fundação: filantrópica, Ministério Público, prestação de contas.
- [ ] Tela de checklist por empresa: competência, vencimento, status, valor, observação.
- [ ] Alerta de vencimento no dashboard.
- [ ] **Não calcular tributo**; deixar claro que é roteiro educacional.

#### D5. Dashboard
- [ ] Cards: caixa, bancos, estoque, receitas, despesas, resultado, obrigações vencendo.
- [ ] Gráficos: receitas × despesas por mês; composição do ativo.
- [ ] Últimas operações e atalhos.
- [ ] Se saldo inicial pendente ou período fechado, mostrar aviso.

#### D6. Qualidade e entrega
- [ ] Seed de demonstração completa.
- [ ] E2E Playwright:
  1. login;
  2. criar empresa;
  3. carregar plano;
  4. saldo inicial;
  5. compra 14x;
  6. venda com CMV;
  7. despesa;
  8. conferir Diário/Razão/Balancete/BP/DRE;
  9. apuração;
  10. PDF completo;
  11. reiniciar e conferir persistência.
- [ ] Script `iniciar.bat` para o notebook.
- [ ] Backup/restauração testados em outro notebook.
- [ ] Checklist de instalação (Node, dependências, banco, navegador).
- [ ] Relatório de bugs e priorização.
- [ ] Documento de entrega/apresentação.

#### D7. Testes
- [ ] Custo médio: cenários com entrada, saída e nova entrada.
- [ ] Estoque negativo: bloqueio e exceção auditada.
- [ ] Idempotência: repetir a mesma operação não duplica movimento.
- [ ] Reconciliação: estoque físico × contábil.
- [ ] Obrigações: catálogo correto por natureza.
- [ ] E2E completo.
- [ ] Restauração de backup.

### 6.3 Telas/rotas

| Rota | Tela |
|---|---|
| `/estoque` | Produtos e saldos |
| `/estoque/:produtoId` | Kardex do produto |
| `/estoque/movimentos` | Entradas, saídas e ajustes |
| `/obrigacoes` | Checklist tributário por natureza |
| `/dashboard` | Indicadores |
| `/configuracoes` | Parâmetros, backup, restauração |

### 6.4 Entidades que a Frente D possui

`Produto`, `MovimentoEstoque`, `Obrigacao`, `Configuracao` (parâmetros por empresa).

### 6.5 Contratos que expõe

```ts
entrarEstoque(ctx, input): Promise<{ custoMedioNovoCentavos; quantidadeNova }>
baixarEstoque(ctx, input): Promise<{ custoUnitarioCentavos; custoTotalCentavos; quantidadeRestante }>
ajustarEstoque(ctx, input): Promise<MovimentoEstoqueDTO>
getKardex(ctx, produtoId, inicio, fim): Promise<KardexDTO>
reconciliarEstoque(ctx): Promise<ReconciliacaoDTO>
seedObrigacoes(ctx): Promise<void>
```

### 6.6 Regras contábeis aplicadas

- RN19, RN20, RN21, RN27, RN32, RN34.
- Custo médio ponderado.
- CMV = quantidade vendida × custo médio.
- Estoque não negativo.
- Reconciliação com a conta `1.0.4 Estoques`.

### 6.7 Entregáveis

- [ ] Estoque + kardex + reconciliação.
- [ ] Obrigações + dashboard.
- [ ] Seed demo.
- [ ] E2E + scripts de instalação/backup.
- [ ] Checklist de entrega e apresentação.
- [ ] Demonstração de 5 minutos.

### 6.8 Critérios de aceite

- [ ] Compra aumenta quantidade e recalcula custo médio.
- [ ] Venda baixa estoque e gera CMV correto.
- [ ] Ajuste de inventário funciona e é auditado.
- [ ] Estoque negativo é bloqueado (ou exige autorização auditada).
- [ ] Kardex fecha com o saldo do produto.
- [ ] Reconciliação estoque × contábil funciona.
- [ ] Obrigações são criadas conforme natureza/regime.
- [ ] Dashboard mostra números coerentes.
- [ ] E2E completo passa em banco limpo.
- [ ] Backup/restauração funciona em outro notebook.
- [ ] `iniciar.bat` sobe o sistema no notebook do instituto.

### 6.9 Dependências e riscos

- **Depende de:** A (empresa/produto base), B (lançamentos) e C (relatórios para o E2E).
- **Risco:** integração atrasar. Mitigação: interface acordada na semana 1; D usa stub de operação até B entregar.
- **Risco:** escopo de qualidade competir com funcionalidade. Mitigação: E2E começa na semana 3, não no fim.

### 6.10 Pastas

`src/modules/estoque/`, `src/modules/tributacao/`, `src/app/(app)/estoque|obrigacoes|dashboard|configuracoes`, `scripts/`, `tests/e2e/`.

### 6.11 Ordem de implementação

1. Produto + motor de estoque + testes.
2. Integração com B (entrada/saída/CMV).
3. Kardex + reconciliação.
4. Obrigações + dashboard.
5. Seed demo + E2E.
6. Backup/restauração + `iniciar.bat`.
7. Ensaio no notebook + docs.

**Estimativa:** 14–17 dias distribuídos em 6 semanas.

---

## 7. Matriz RACI

> **R** = responsável pela execução; **A** = accountable (responde pelo resultado); **C** = consultado; **I** = informado.

| Atividade | A | B | C | D |
|---|---|---|---|---|
| Schema Prisma / migrations | **R/A** | C | C | C |
| Auth, RBAC, auditoria | **R/A** | C | I | C |
| Design system base | **R/A** | C | C | C |
| Empresa / CNPJ / natureza | **R/A** | I | I | C |
| Plano de contas | **R/A** | C | C | C |
| Saldo inicial | **R/A** | C | C | I |
| Motor de lançamentos | C | **R/A** | C | C |
| Venda / compra / estorno / apuração | I | **R/A** | C | C |
| Livro Diário | C | **R/A** | C | I |
| Saldos / Razão / Balancete | I | C | **R/A** | I |
| Balanço / DRE | I | C | **R/A** | I |
| PDFs | I | C | **R/A** | C |
| Estoque / CMV / kardex | I | C | C | **R/A** |
| Obrigações / dashboard | C | I | I | **R/A** |
| Seed demo | C | C | C | **R/A** |
| E2E / backup / instalação | I | C | C | **R/A** |
| Documentação final | C | C | C | **R/A** |

---

## 8. Integração entre as frentes

### 8.1 Contratos que precisam estar prontos na semana 1

| Contrato | Dono | Consumidores | Prazo |
|---|---|---|---|
| `ContextoUsuario`, `TipoConta`, `TipoOperacao`, `OperacaoDTO` | A | B, C, D | Fim da semana 1 |
| `validarPeriodoAberto`, `getContaAnalitica`, `registrarAuditoria` | A | B, C, D | Fim da semana 1 |
| `criarOperacao`, `estornarOperacao`, `lancarVenda`, `lancarCompra`, `apurarResultado` | B | C, D | Fim da semana 2 |
| `getSaldosConta`, `getRazao`, `gerarDre`, `gerarBalanco` | C | D (E2E) | Fim da semana 2 |
| `entrarEstoque`, `baixarEstoque`, `getKardex` | D | B | Fim da semana 2 |

### 8.2 Rituais

- **Daily de 15 min** (online ou presencial): o que fiz, o que vou fazer, o que está travado.
- **Quarta de integração:** merge na `main`, rodar `npm test`, resolver contrato.
- **Sexta de revisão:** PR review cruzado; uma pessoa revisa o PR de outra.
- **Sexta de demo interna:** cada frente mostra o que funcionou (5 min).
- **Registro de decisões:** `docs/decisoes.md` (ADR curto) para toda mudança de contrato.
- **Quadro de tarefas:** usar `docs/04-backlog-e-cronograma.md` ou importar no Trello/GitHub Projects.

### 8.3 Fluxo de git

```text
main
├─ feat/a-cadastros
├─ feat/b-lancamentos
├─ feat/c-relatorios
└─ feat/d-estoque
```

- Branch por frente; commits pequenos e descritivos.
- PR para `main` com: o que mudou, regra contábil afetada, como testar, print da tela.
- Pelo menos 1 aprovação; mudanças de schema exigem aprovação de A.
- Nunca commitar `data/`, `storage/`, `.env` ou backups.

### 8.4 Como evitar conflito de merge

1. Pastas separadas por frente.
2. Schema só A altera.
3. Componentes compartilhados: criar novo arquivo em vez de editar o do colega.
4. Contratos em arquivos próprios; mudança exige aviso no grupo.
5. Merge diário da `main` na branch da frente (rebase/merge frequente).
6. Feature flag para integrar antes de a outra frente terminar.

---

## 9. Cronograma de 6 semanas (+1 de buffer)

### Semana 1 — Sprint 0: Fundação

| Pessoa | Foco |
|---|---|
| **A** | Setup, schema v1, auth, layout/design system, empresa e plano (esqueleto) |
| **B** | Contratos do motor, validações, testes unitários, tela manual (esqueleto) |
| **C** | Fixtures, fórmulas de saldo/razão/DRE com dados mockados |
| **D** | Contratos de estoque, catálogo de obrigações, CI, scripts, seed |

**Marco:** schema congelado, contratos assinados, `main` rodando com login e layout.

### Semanas 2–3 — Sprint 1: Núcleo

| Pessoa | Foco |
|---|---|
| **A** | Empresa completa, plano padrão/custom, saldo inicial, usuários, auditoria |
| **B** | Motor + lançamento manual + Diário + estorno |
| **C** | `getSaldosConta` + Razão + Balancete |
| **D** | Produto + motor de estoque + obrigações (catálogo) + dashboard esqueleto |

**Marco:** criar empresa → plano → saldo inicial → lançamento manual → Diário → Razão/Balancete.

### Semanas 4–5 — Sprint 2: Integrações

| Pessoa | Foco |
|---|---|
| **A** | Período/fechamento, auditoria UI, import/export, multiempresa |
| **B** | Venda, compra 14x, apuração, trilha de estorno |
| **C** | Balanço, DRE, PDFs individuais |
| **D** | Integração estoque ↔ lançamentos, kardex, reconciliação, obrigações UI |

**Marco:** compra 14x → estoque → venda com CMV → BP/DRE → apuração.

### Semana 6 — Sprint 3: Fechamento

| Pessoa | Foco |
|---|---|
| **A** | Hardening, testes, documentação |
| **B** | Casos de borda, performance, testes, documentação |
| **C** | PDF completo, XLSX, golden tests, performance |
| **D** | E2E, dashboard final, backup/restauração, `iniciar.bat` |

**Marco:** fluxo completo + PDF + E2E verde + restauração testada.

### Semana 7 — Buffer / Ensaio

- Ensaio no notebook do instituto.
- Correção de bugs.
- Roteiro de apresentação.
- Documentação final e entrega.
- Se tudo estiver pronto: melhorias “Could” (XLSX, dashboard, multiempresa).

---

## 10. Definition of Done (vale para as 4 frentes)

Uma tarefa só está pronta quando:

- [ ] Código implementado e revisado por outra pessoa.
- [ ] Regra contábil validada no **serviço**, não só na tela.
- [ ] Teste unitário e/ou de integração cobrindo o caminho feliz e os erros.
- [ ] Tela com estados de carregamento, vazio e erro.
- [ ] Auditoria registrada (quando houver escrita).
- [ ] Nada é excluído definitivamente.
- [ ] Documentação curta atualizada (como usar/testar).
- [ ] `npm run lint`, `npm test` e `npm run build` passam.
- [ ] Demonstração de 5 minutos preparada.
- [ ] Sem `console.log` de debug, sem `any` injustificado, sem senha em código.

---

## 11. Como cada pessoa demonstra a sua parte

| Frente | Roteiro de demonstração (5 min) |
|---|---|
| **A** | Criar empresa com CNPJ válido → carregar plano padrão → criar conta própria → salvar saldo inicial balanceado → entrar com cada perfil → mostrar auditoria → reiniciar e mostrar persistência |
| **B** | Lançar operação manual → tentar desbalanceada (bloqueio) → ver no Diário com ID → venda com 4 linhas → compra 14x (12 CP + 2 LP) → estornar e mostrar trilha → apurar resultado |
| **C** | Abrir Razão de uma conta → Balancete fechando → BP equilibrado → DRE no layout do professor → gerar PDF completo com todos os razões |
| **D** | Compra atualiza estoque e custo médio → venda baixa e gera CMV → kardex → reconciliação → obrigações por natureza → dashboard → rodar E2E → restaurar backup em outro notebook |

---

## 12. Plano de contingência

Se o prazo apertar, cortar **nesta ordem** (nunca cortar o núcleo contábil):

1. Exportação XLSX/CSV (RF25).
2. Dashboard avançado (RF22).
3. Multiempresa (RF24).
4. Importação de plano por Excel (RF21) — manter o plano padrão + criação manual.
5. Consulta pública de CNPJ — manter validação offline.
6. Razonete da ARE no BP.

**Nunca cortar:** partida dobrada, Diário, Razão, Balancete, BP, DRE, estorno/auditoria, saldo inicial, estoque/CMV, PDF completo, persistência.

---

## 13. Checklist final de integração

- [ ] As 4 branches merged na `main`.
- [ ] Banco limpo + seed demo.
- [ ] Fluxo completo do E2E verde.
- [ ] PDF completo gerado e conferido.
- [ ] Backup restaurado em outro notebook.
- [ ] Todos os perfis testados.
- [ ] Auditoria mostrando as ações de todas as frentes.
- [ ] DRE e BP conferidos com o sistema do professor.
- [ ] Roteiro de apresentação ensaiado.
- [ ] Documentação e README atualizados.
