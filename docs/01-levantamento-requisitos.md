# 01 — Levantamento de Requisitos

> **Projeto:** LLFinance — Sistema Contábil Educacional  
> **Fonte primária:** `C:\Users\aluno\Downloads\Contabilidade.txt` (anotações de aula)  
> **Referência funcional:** sistema Contabiliês do professor — <https://sistemadecontabilidade.netlify.app/>  
> **Versão:** 1.0 — 05/11/2026  
> **Status:** levantamento concluído; implementação a iniciar

---

## 1. Contexto

O documento parte da abertura de uma empresa e evolui até a escrituração contábil:

1. A empresa nasce com nome, endereço, CNPJ, natureza jurídica e regime.
2. A natureza define obrigações tributárias e relatórios exigidos.
3. O plano de contas é cadastrado (padrão ou personalizado).
4. Os saldos iniciais são informados.
5. As operações são lançadas pelo balancete de lançamento e registradas no Livro Diário.
6. O Livro Razão é extraído por conta.
7. O Balanço Patrimonial e a DRE são gerados.
8. O resultado é apurado e o ciclo recomeça no exercício seguinte.

O sistema do professor (Contabiliês) foi usado como **referência de layout e de cálculo**, principalmente para a DRE e para o plano de contas padrão. O LLFinance deve reproduzir esses resultados e acrescentar o que o documento exige: usuários, auditoria, estoque, compra parcelada com duas contas e PDF completo.

---

## 2. Objetivo do sistema

Permitir que um usuário **abra uma empresa do zero**, cadastre o plano de contas, informe saldos iniciais, registre operações com partida dobrada, controle estoque e gere os livros e demonstrações contábeis — com **persistência para retomada**, **trilha de auditoria** e **bloqueio de lançamentos inconsistentes**.

### 2.1 Resultado esperado no teste com os usuários

O aluno deve conseguir, em uma aula:

- abrir uma empresa;
- carregar o plano de contas padrão e criar contas próprias;
- informar o saldo inicial;
- lançar compras, vendas e despesas;
- gerar Diário, Razão, Balancete, Balanço e DRE;
- **fechar o notebook, reabrir o sistema e continuar exatamente de onde parou**.

---

## 3. Escopo

### 3.1 Dentro do escopo

- Cadastro de empresa com CNPJ, natureza jurídica e regime tributário.
- Validação offline de CNPJ (dígitos verificadores) e consulta opcional à base pública.
- Plano de contas padrão do professor + contas personalizadas, com importação/exportação em Excel.
- Saldos iniciais por conta, com bloqueio se débitos ≠ créditos.
- Lançamentos manuais (balancete de lançamento) e automáticos (venda e compra).
- Livro Diário, Livro Razão, Balancete de Verificação, Balanço Patrimonial e DRE.
- Apuração do resultado do exercício.
- Controle de estoque com custo médio e CMV.
- Trilha de auditoria, exclusão lógica e estorno contábil.
- Usuários, perfis e permissões.
- Geração de PDF detalhado e exportação.
- Backup e restauração do banco local.
- Dashboard gerencial simples.

### 3.2 Fora do escopo (nesta versão)

- Cálculo oficial de tributos, emissão de guias, SPED, eSocial, NF-e ou obrigações acessórias.
- Assinatura digital e certificado ICP-Brasil.
- Integração bancária/Open Finance.
- Folha de pagamento completa.
- Consolidação de demonstrações de várias empresas.
- Aplicativo mobile nativo.
- SaaS multiusuário em nuvem (o sistema roda localmente; a arquitetura permite migrar).
- Contabilidade pública ou de terceiro setor com regras específicas completas.
- Reavaliação, impairment, arrendamento, instrumentos financeiros e demais CPCs avançados.

> **Decisão:** o sistema é **educacional**. Ele aplica as regras contábeis gerais (partida dobrada, competência, natureza das contas, estrutura do BP e da DRE), mas não substitui um contador.

---

## 4. Perfis de usuário

| Perfil | Pode | Não pode |
|---|---|---|
| **Administrador** | Tudo: criar empresa, usuários, plano de contas, lançar, estornar, apurar, fechar período, configurar | — |
| **Contador** | Cadastros contábeis, lançamentos, estornos, apuração, relatórios, fechamento | Gerenciar usuários e excluir empresa |
| **Auxiliar** | Lançar operações, consultar relatórios, gerar PDF | Estornar, apurar, fechar período, alterar plano de contas |
| **Consulta** | Visualizar relatórios, livros e PDFs | Criar, alterar, estornar ou excluir qualquer dado |

> A exigência de “quem foi o responsável pela ação” (documento, linha 141) só é atendida com autenticação e perfis. Por isso, usuários e permissões são **Must**, não um extra.

---

## 5. Regras de negócio contábeis (RN)

Estas regras são a espinha dorsal do sistema. Cada uma deve ser aplicada no **serviço** (não apenas na tela) e coberta por teste.

| ID | Regra | Como o sistema garante |
|---|---|---|
| **RN01** | **Partida dobrada:** toda operação tem débitos = créditos. | Soma em centavos no serviço; transação abortada se diferença ≠ 0. Teste de propriedade. |
| **RN02** | **Valor positivo:** nenhuma linha pode ter valor ≤ 0. | Validação Zod + serviço + `CHECK` no banco. |
| **RN03** | **Conta analítica:** só conta analítica (folha) recebe lançamento. | Campo `analitica`; serviço rejeita conta sintética. |
| **RN04** | **Conta da empresa:** não se lança em conta de outra empresa. | `conta.empresa_id` obrigatório; validação no serviço. |
| **RN05** | **Natureza da conta:** devedora (Ativo, Despesa, Custo) aumenta com débito; credora (Passivo, PL, Receita) aumenta com crédito. | Cálculo de saldo sempre pela natureza, nunca por “débito − crédito” cego. |
| **RN06** | **Regime de competência:** a data do lançamento é o fato gerador, não o pagamento. | Data obrigatória; relatórios por período; orientação na tela. |
| **RN07** | **Saldo inicial separado:** é uma operação do tipo `SALDO_INICIAL`, na data de abertura, e não entra na DRE. | Tipo próprio; DRE ignora `SALDO_INICIAL`; BP e Razão incluem. |
| **RN08** | **Saldo inicial balanceado:** débitos = créditos antes de liberar os lançamentos. | Tela mostra totais e bloqueia salvamento desbalanceado. |
| **RN09** | **Operação atômica:** cabeçalho + linhas + número do Diário + auditoria são gravados na mesma transação. | `prisma.$transaction`; rollback total em erro. |
| **RN10** | **ID de operação:** todo lançamento do Diário referencia a operação que o originou. | `operacao.id` + número sequencial `OP-AAAA-000001`. |
| **RN11** | **Diário sequencial:** numeração sem lacunas por empresa/exercício. | Tabela de sequência com `UPDATE ... RETURNING` dentro da transação. |
| **RN12** | **Diário imutável:** não se edita nem apaga linha do Diário. | Edição = estorno + nova operação; exclusão = estorno. |
| **RN13** | **Nada é excluído definitivamente.** | `deleted_at`/`deleted_by` em cadastros; estorno em lançamentos; `audit_log` de tudo. |
| **RN14** | **Estorno rastreável:** o estorno referencia o original e aparece na trilha. | `reversal_of_id`, `status`, `audit_log`; tela mostra original → estorno → atual. |
| **RN15** | **Edição rastreável:** editar gera estorno do original + nova operação ligada. | `edited_from_id` / `replaced_by_id`; motivo obrigatório. |
| **RN16** | **Período contábil:** não se lança em período fechado. | `periodo_contabil.status = FECHADO` bloqueia escrita; reabertura só admin, auditada. |
| **RN17** | **Venda automática:** gera 4 linhas (2 pares débito/crédito): Caixa/Clientes × Receita e CMV × Estoques. | Caso de uso `lancarVenda`; contas configuráveis; valida estoque. |
| **RN18** | **Compra a prazo parcelada:** uma compra de 14x pode ser dividida em 12x Fornecedores (curto prazo) + 2x Fornecedores LP (longo prazo), na mesma tela e na mesma operação. | Caso de uso `lancarCompra`; gera 1 débito em Estoques e 2 créditos (CP + LP); parcelas vinculadas. |
| **RN19** | **Estoque perpétuo:** entrada por compra, saída por venda, ajuste por inventário. | Movimentos de estoque vinculados à operação; kardex. |
| **RN20** | **Custo médio ponderado:** o custo unitário é recalculado a cada entrada; a saída usa o custo médio vigente. | Serviço de estoque em transação; CMV = quantidade × custo médio. |
| **RN21** | **Estoque não negativo:** saída maior que o saldo é bloqueada (ou exige autorização com auditoria). | Validação no serviço; parâmetro por empresa. |
| **RN22** | **DRE igual à do professor:** Receitas Operacionais → Total de Receitas (+) → Despesas Operacionais → Total de Despesas (−) → Lucro/Prejuízo Líquido do Exercício. | Serviço de DRE com o mesmo layout e a mesma fórmula: `receitas − despesas`. |
| **RN23** | **DRE após apuração:** a DRE do período continua correta mesmo depois do encerramento. | DRE usa movimentos de receita/despesa do período e **exclui operações do tipo `APURACAO`**. |
| **RN24** | **Balanço equilibrado:** Ativo = Passivo + Patrimônio Líquido. | Serviço de BP valida a equação; relatório mostra alerta se não fechar. |
| **RN25** | **Apuração do resultado:** receitas e despesas são transferidas para `7.0.1` e o saldo para o PL (Lucros/Prejuízos Acumulados). | Caso de uso `apurarResultado`, idempotente por exercício, com prévia e auditoria. |
| **RN26** | **Centavos inteiros:** nenhum cálculo monetário usa `float`. | Valores em centavos (`Int`) no banco e no domínio; formatação só na borda. |
| **RN27** | **Arredondamento:** divisões (parcelas, custo médio) arredondam meio para cima e a diferença vai para a última parcela. | Helper `Money`; teste com 14.000 / 14 e casos com dízima. |
| **RN28** | **CNPJ válido:** 14 dígitos, dígitos verificadores conferidos, matriz/filial identificada. | Validação offline; consulta pública opcional. |
| **RN29** | **Histórico obrigatório:** toda operação tem descrição. | Campo obrigatório, mínimo 3 caracteres. |
| **RN30** | **Contas diferentes:** a mesma conta não pode ser débito e crédito na mesma linha. | Validação no serviço; operações compostas podem repetir conta em linhas diferentes, se fizer sentido. |
| **RN31** | **Isolamento por empresa:** nenhum dado vaza entre empresas. | `empresa_id` em todas as consultas; middleware/guarda; testes. |
| **RN32** | **Obrigações por natureza:** o sistema apresenta um roteiro de obrigações conforme MEI, EI, SLU, LTDA, S.A, cooperativa, associação ou fundação. | Catálogo configurável; não calcula tributo; permite marcar status. |
| **RN33** | **PDF completo:** um único PDF detalhado com tudo que foi feito e todos os Livros Razão. | Serviço de relatório completo; cabeçalho, período, páginas e assinatura. |
| **RN34** | **Persistência:** fechar o navegador/notebook e retomar sem perder dados. | SQLite em arquivo + backup; teste de retomada. |

---

## 6. Requisitos funcionais

Legenda de prioridade: **M** = Must (obrigatório), **S** = Should (importante), **C** = Could (desejável).

| ID | Requisito | Detalhes | Fonte | Frente | Pri. |
|---|---|---|---|---|---|
| **RF01** | Cadastro de empresa | Nome/razão social, nome fantasia, CNPJ, endereço, natureza jurídica, regime, capital, data de abertura, exercício | L4–10 | A | M |
| **RF02** | Validação e consulta de CNPJ | Validar dígitos; máscara `00.000.000/0001-91`; identificar matriz (0001) e filial; consulta pública opcional | L16–23 | A | M |
| **RF03** | Natureza e obrigações | MEI, EI, SLU, LTDA, S.A, cooperativa, associação, fundação; obrigações e relatórios esperados | L10, L26–54 | A/D | M |
| **RF04** | Plano de contas | Plano padrão do professor, grupos 1/2 Ativo, 3 Passivo, 4 PL, 5 Despesa, 6 Receita, 7 Apuração; criar/editar/inativar contas; importar/exportar Excel | L96, L137 | A | M |
| **RF05** | Saldo inicial | Saldo por conta, débito/crédito, totais, bloqueio se desbalanceado; gera operação `SALDO_INICIAL` | L138 | A | M |
| **RF06** | Lançamento manual | Tela de balancete com N linhas, conta, débito/crédito, valor, histórico, totais em tempo real | L125, L139–140 | B | M |
| **RF07** | Livro Diário | Lista cronológica por operação, com ID, data, histórico, contas, valores, usuário, status; PDF | L106–112 | B/C | M |
| **RF08** | Livro Razão | Extrato por conta com saldo anterior, débitos, créditos, saldo acumulado e final; PDF por conta | L109 | C | M |
| **RF09** | Balancete de verificação | Contas com saldo anterior, débitos, créditos e saldo atual; totais iguais; PDF | L125 | C | M |
| **RF10** | Balanço Patrimonial | Ativo Circulante/Não Circulante; Passivo Circulante/Não Circulante; PL; totais; equação; PDF | L145 | C | M |
| **RF11** | DRE | Layout idêntico ao do professor; receitas, despesas, totais e lucro/prejuízo; PDF | L146 | C | M |
| **RF12** | Apuração do resultado | Encerrar receitas/despesas em `7.0.1`, transferir para PL; prévia e auditoria | L125–128 | B | M |
| **RF13** | Venda automática | 4 lançamentos (Caixa/Clientes × Receita; CMV × Estoques); à vista ou a prazo | L142 | B | M |
| **RF14** | Compra a prazo parcelada | Dividir 14x em 12x CP + 2x LP na mesma tela; uma operação com múltiplos créditos | L143 | B | M |
| **RF15** | Edição/exclusão auditada | Nunca apagar; estornar e/ou substituir; motivo, usuário, data/hora; trilha visível | L141 | B | M |
| **RF16** | Usuários e auditoria | Login, perfis, permissões, log de todas as ações, exclusão lógica | L141 | A | M |
| **RF17** | Controle de estoque | Produtos, entradas, saídas, ajustes, custo médio, kardex, inventário, CMV | L148 | D | M |
| **RF18** | PDF detalhado | “Tudo que foi feito” + todos os Livros Razão, em um PDF com cabeçalho e páginas | L144 | C | M |
| **RF19** | Persistência e retomada | Salvar automaticamente; reabrir e continuar; backup/restauração | L133 | A/D | M |
| **RF20** | Exercício e período | Abrir/fechar exercício; bloquear lançamentos em período fechado; reabrir com auditoria | L125–128 | A | M |
| **RF21** | Importar/exportar plano | Excel com colunas Número, Nome da Conta, Tipo, Subtipo | L137 | A | S |
| **RF22** | Dashboard | Caixa, bancos, estoque, receitas, despesas, resultado, obrigações e últimas operações | — | D | S |
| **RF23** | Backup/restauração | Exportar banco + JSON; restaurar em outro notebook | L133 | D | S |
| **RF24** | Multiempresa | Um usuário pode ter mais de uma empresa; dados isolados | L4 | A | S |
| **RF25** | Exportação XLSX/CSV | Diário, razão, balancete, BP e DRE | L144 | C | C |
| **RF26** | Comparação com o professor | Fixtures/golden tests garantindo DRE e BP iguais aos do sistema de referência | L146 | C | M |

---

## 7. Requisitos não funcionais

| ID | Requisito | Meta |
|---|---|---|
| **RNF01** | Funcionar offline | Após instalado, abrir e operar sem internet (fonte local, SQLite) |
| **RNF02** | Desempenho | Relatórios de até 10 mil lançamentos em < 3 s no notebook do instituto |
| **RNF03** | Usabilidade | Português do Brasil, linguagem contábil, máscaras, atalhos, mensagens claras |
| **RNF04** | Responsividade | Usável em notebook 1366×768 e tablet; impressão A4 |
| **RNF05** | Segurança | Senha com hash, cookie `httpOnly`, RBAC, proteção CSRF, sem dados sensíveis em log |
| **RNF06** | Auditabilidade | 100% das escritas com usuário, data/hora e antes/depois |
| **RNF07** | Portabilidade | Windows 10/11 com Node.js; script `iniciar.bat`; opcional Docker |
| **RNF08** | Confiabilidade | Transações atômicas; backup antes de fechamento; recuperação de falha |
| **RNF09** | Testabilidade | Serviços puros testáveis; cobertura mínima de 80% no domínio contábil |
| **RNF10** | Manutenibilidade | Módulos por frente, contratos tipados, lint e formatação |
| **RNF11** | Acessibilidade | Contraste, foco visível, labels, navegação por teclado |
| **RNF12** | LGPD | Dados fictícios no ambiente escolar; exportação e exclusão lógica; aviso de privacidade |
| **RNF13** | Impressão/PDF | A4 retrato, cabeçalho da empresa, período, emissão, página X de Y, assinatura |
| **RNF14** | Integridade | Nenhum estado inválido persiste: validação no cliente, servidor e banco |
| **RNF15** | Idioma e moeda | `pt-BR`, BRL, datas `dd/mm/aaaa`, valores `R$ 1.234,56` |

---

## 8. Validações e mensagens

| Código | Situação | Mensagem ao usuário |
|---|---|---|
| `PARTIDA_DOBRADA_INVALIDA` | Débitos ≠ créditos | “A operação não fecha: débitos R$ X e créditos R$ Y. A diferença é R$ Z.” |
| `VALOR_INVALIDO` | Valor ≤ 0 | “Informe um valor maior que zero.” |
| `CONTA_SINTETICA` | Conta pai/sintética | “A conta 1.0 — Ativo Circulante é sintética. Escolha uma conta analítica.” |
| `CONTA_INATIVA` | Conta inativada | “Esta conta está inativa e não pode receber lançamentos.” |
| `CONTA_OUTRA_EMPRESA` | Conta de outra empresa | “Conta inválida para esta empresa.” |
| `PERIODO_FECHADO` | Data em período fechado | “O período de 01/01/2026 a 31/12/2026 está fechado. Reabra com um administrador.” |
| `DATA_FORA_EXERCICIO` | Data fora do exercício | “A data está fora do exercício ativo.” |
| `HISTORICO_OBRIGATORIO` | Sem histórico | “Descreva a operação (mínimo 3 caracteres).” |
| `ESTOQUE_INSUFICIENTE` | Saída > saldo | “Saldo insuficiente do produto X: disponível 3, solicitado 5.” |
| `ESTOQUE_NEGATIVO_BLOQUEADO` | Parâmetro ativo | “O estoque não pode ficar negativo. Ajuste a quantidade ou autorize a exceção.” |
| `OPERACAO_JA_ESTORNADA` | Estorno duplicado | “Esta operação já foi estornada.” |
| `APURACAO_JA_REALIZADA` | Apuração repetida | “O resultado do exercício 2026 já foi apurado.” |
| `SALDO_INICIAL_DESBALANCEADO` | Saldo inicial | “Os saldos iniciais não fecham. Débitos R$ X, créditos R$ Y.” |
| `CNPJ_INVALIDO` | Dígitos errados | “CNPJ inválido. Confira os 14 dígitos.” |
| `ACESSO_NEGADO` | Sem permissão | “Seu perfil não permite esta ação.” |
| `PERIODO_COM_MOVIMENTO` | Fechar período com pendências | “Existem lançamentos sem estorno ou contas desbalanceadas. Revise antes de fechar.” |

---

## 9. Matriz de rastreabilidade

| Trecho do documento | Tema | Requisitos |
|---|---|---|
| L4–10 | Ideia, tipo da empresa, nome/endereço, obrigações | RF01, RF03 |
| L13–14 | LTDA e limite de dívida | RF01, RF03 |
| L16–23 | CNPJ, consulta, matriz/filial, dígitos | RF02 |
| L26–54 | MEI, EI, SLU, LTDA, S.A, cooperativa, associação, fundação | RF03, RF24 |
| L60–64 | Patrimônio, bens/direitos/obrigações, partida dobrada | RN01, RF05, RF10 |
| L67–71 | Relevância e representação fidedigna | RNF05, RNF06, RN13 |
| L73–78 | Dados contábeis, usuários internos/externos | RF16 |
| L81–84 | Contabilidade financeira (CPC) × gerencial | RF09–RF11 |
| L87–100 | Ativo, passivo, contas, códigos 1/2/3/4, PL, caixa | RF04, RN05 |
| L103–112 | Livros obrigatórios, Diário e Razão | RF07, RF08, RN11–RN12 |
| L117–120 | Custo × despesa | RN22, RF11 |
| L125–128 | Balancete, Diário, Razão, 4º passo | RF06–RF12 |
| L130–133 | Requisitos em 4 pessoas e teste com usuários | Toda a documentação |
| L136–148 | Contas padrão, saldo inicial, débito/crédito, ID, exclusão auditada, venda, compra a prazo, PDF, BP, DRE, bloqueio, estoque | RF04–RF19 |

> **4º passo:** o documento deixa em branco. Pela sequência contábil e pelo sistema do professor, o 4º passo é **Apuração do Resultado + Balanço Patrimonial + DRE** (encerramento do exercício). Está coberto por RF10–RF12.

---

## 10. Premissas

1. O sistema será usado em **notebooks do instituto**, com Node.js instalado e sem dependência de internet.
2. Cada grupo usará **dados fictícios**; nenhum dado real de empresa será necessário.
3. O **plano de contas padrão** é o do sistema Contabiliês (40 contas), podendo ser personalizado.
4. A **DRE de referência** é a do professor: receitas operacionais, total de receitas, despesas operacionais, total de despesas e lucro/prejuízo líquido.
5. O **custo** (CMV/CPV/CSP) é tratado como conta de despesa no plano padrão, aparecendo em “Despesas Operacionais” na DRE, exatamente como no sistema do professor.
6. O sistema **não calcula tributos**; apenas organiza o roteiro de obrigações por natureza/regime.
7. O fechamento do exercício é **opcional** para gerar relatórios, mas obrigatório para o ciclo contábil completo.
8. A equipe tem **4 pessoas** com disponibilidade parcial e fará revisão cruzada.

---

## 11. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Complexidade tributária | Alto | Catálogo configurável, sem cálculo oficial; aviso legal; foco educacional |
| 4 pessoas editando arquivos compartilhados | Alto | Dono por pasta, contratos na semana 1, PRs pequenos, schema só pela Frente A |
| Erro de contabilidade | Alto | Testes golden contra o sistema do professor; revisão por quem entende; checklist de fechamento |
| PDF grande/travando | Médio | Gerar por seções, streaming, testar com 10 mil lançamentos |
| SQLite com acessos simultâneos | Médio | Uso local; WAL + `busy_timeout`; migrar para PostgreSQL se necessário |
| Perda de dados no notebook | Alto | Backup automático antes de fechar período; exportação JSON; restauração testada |
| Escopo crescer | Alto | Priorizar Must; “Could” só depois do ensaio |
| Layout divergir do professor | Médio | Fixtures e comparação lado a lado; congelar layout na semana 2 |

---

## 12. Critérios de aceite globais

O sistema só é considerado pronto quando:

- [ ] Uma empresa pode ser criada do zero e reaberta depois de reiniciar o servidor.
- [ ] O plano de contas padrão carrega sem duplicar e aceita contas personalizadas.
- [ ] Saldo inicial desbalanceado é bloqueado com mensagem clara.
- [ ] Nenhum lançamento com débito ≠ crédito é persistido.
- [ ] Venda gera exatamente 4 linhas e compra 14x divide 12x CP + 2x LP.
- [ ] Editar/excluir nunca apaga: gera estorno com usuário, motivo e data.
- [ ] Diário tem numeração sequencial e ID de operação.
- [ ] Razão, Balancete, BP e DRE batem entre si e com o sistema do professor.
- [ ] BP fecha: Ativo = Passivo + PL.
- [ ] DRE mostra receitas, despesas, totais e lucro/prejuízo no layout do professor.
- [ ] Apuração zera receitas/despesas e transfere o resultado ao PL.
- [ ] Estoque mantém custo médio, kardex e CMV coerentes.
- [ ] PDF completo contém tudo e todos os razões, com páginas e cabeçalho.
- [ ] Perfis de acesso funcionam e toda ação fica auditada.
- [ ] Backup e restauração funcionam em outro notebook.
- [ ] Teste ponta a ponta passa em banco limpo.

---

## 13. Glossário

| Termo | Definição |
|---|---|
| **Ativo** | Bens e direitos controlados pela empresa (caixa, estoque, clientes, veículos). |
| **Passivo** | Obrigações com terceiros (fornecedores, salários, impostos, empréstimos). |
| **Patrimônio Líquido** | Obrigação interna: capital dos sócios + lucros/prejuízos acumulados. |
| **Partida dobrada** | Todo débito tem um crédito de igual valor; a soma dos débitos é igual à soma dos créditos. |
| **Débito** | Aumenta contas devedoras (Ativo, Despesa, Custo) e diminui credoras. |
| **Crédito** | Aumenta contas credoras (Passivo, PL, Receita) e diminui devedoras. |
| **Balancete de lançamento** | Tela de entrada de uma operação com várias linhas (nome usado no documento). |
| **Balancete de verificação** | Relatório com saldos de todas as contas e conferência débito = crédito. |
| **Livro Diário** | Registro cronológico das operações, com data, histórico, contas e valores. |
| **Livro Razão** | Extrato de uma conta, com saldo anterior, movimentos e saldo final. |
| **Balanço Patrimonial** | Demonstração do Ativo, Passivo e PL em uma data. |
| **DRE** | Demonstração do Resultado do Exercício: receitas − despesas = resultado. |
| **Apuração** | Encerramento das contas de resultado e transferência do lucro/prejuízo ao PL. |
| **CMV** | Custo da Mercadoria Vendida. |
| **Custo médio ponderado** | Método de valoração do estoque que recalcula o custo unitário a cada entrada. |
| **Estorno** | Lançamento inverso que anula outro, preservando o histórico. |
| **Exercício** | Período contábil, normalmente de 1º de janeiro a 31 de dezembro. |
| **CNPJ** | Cadastro Nacional da Pessoa Jurídica; 14 dígitos, sendo os dois últimos verificadores. |
| **Matriz/filial** | Identificada pelos dígitos 0001 (matriz) ou 0002+ (filial) no CNPJ. |
