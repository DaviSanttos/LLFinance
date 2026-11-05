# DECISÕES — LLFinance

Registro das decisões que já foram tomadas. Não reabrir sem um motivo concreto e sem registrar a mudança aqui.

## Produto e método

### D1 — Protótipo mockado antes da implementação real
**Decisão:** a primeira entrega é um sistema totalmente navegável com dados mockados, persistido em `localStorage`, para aprovação visual.
**Motivo:** reduz retrabalho e permite validar layout, fluxos e textos antes de investir em banco, API e autenticação.
**Consequência:** a etiqueta “dados mockados” permanece visível até a Etapa 2.

### D2 — Entrega em fatias verticais por pessoa
**Decisão:** cada uma das 4 pessoas é responsável por banco + serviço + API + UI + testes + documentação de uma fatia.
**Motivo:** evita ilhas de conhecimento e garante que todos saibam o fluxo completo.
**Mapa:** A = cadastros/fundação; B = lançamentos/diário; C = livros/demonstrações; D = estoque/tributação/qualidade.

### D3 — Nada é excluído definitivamente
**Decisão:** operações são estornadas com uma nova operação inversa; cadastros são inativados; toda ação gera auditoria com usuário, data e detalhe.
**Motivo:** requisito explícito do enunciado e boa prática contábil.
**Consequência:** relatórios precisam considerar status `ATIVA`/`ESTORNADA` e nunca “apagar” linhas.

---

## Contabilidade

### D4 — Plano de contas do professor
**Decisão:** adotar a estrutura 1/2 = Ativo, 3 = Passivo, 4 = Patrimônio Líquido, 5 = Despesa/Custo, 6 = Receita, 7 = Apuração.
**Motivo:** manter compatibilidade com o sistema de referência e com a correção do professor.
**Consequência:** contas personalizadas precisam respeitar o primeiro dígito e o tipo.

### D5 — Partida dobrada e regime de competência
**Decisão:** toda operação exige débitos = créditos; receitas/despesas são reconhecidas na data de competência, não no caixa.
**Motivo:** regra contábil básica e requisito do trabalho.
**Consequência:** validação bloqueia lançamento desbalanceado tanto na UI quanto (futuramente) no servidor.

### D6 — Natureza da conta define o saldo
**Decisão:** conta devedora = D − C; conta credora = C − D. No Balanço, o Ativo usa D − C e o Passivo/PL usa C − D.
**Motivo:** lidar corretamente com contas redutoras, como `2.2.4 Depreciação Acumulada`.
**Consequência:** o Balanço não pode simplesmente somar saldos “positivos”.

### D7 — Layout da DRE idêntico ao do professor
**Decisão:** RECEITAS OPERACIONAIS → TOTAL DE RECEITAS (+) → DESPESAS OPERACIONAIS → TOTAL DE DESPESAS (−) → LUCRO/PREJUÍZO LÍQUIDO DO EXERCÍCIO.
**Motivo:** requisito de compatibilidade com a correção.
**Consequência:** a DRE ignora operações `SALDO_INICIAL` e `APURACAO` para continuar correta mesmo após o encerramento.

### D8 — Resultado pendente no Balanço
**Decisão:** enquanto a apuração não ocorre, o Balanço mostra uma linha sintética “Resultado do Exercício (a apurar)” no PL, calculada a partir dos saldos reais de 5.x/6.x.
**Motivo:** manter a equação Ativo = Passivo + PL antes do encerramento.
**Consequência:** após a apuração, essa linha naturalmente zera e o valor aparece em Lucros Acumulados (`4.0.3`).

### D9 — Venda gera 4 partidas quando há custo
**Decisão:** D Caixa/Clientes · C Receita de Vendas; D CMV · C Estoques.
**Motivo:** reconhecer receita e custo na mesma competência.
**Consequência:** venda de serviço gera apenas 2 partidas (sem CMV).

### D10 — Compra parcelada 12x curto prazo + excedente longo prazo
**Decisão:** em compras a prazo, as 12 primeiras parcelas vão para Fornecedores (circulante) e o excedente para Contas a Pagar de longo prazo.
**Motivo:** atender ao requisito do exemplo de 14x (12 CP + 2 LP).
**Consequência:** o passivo é dividido automaticamente e o documento guarda todas as parcelas.

### D11 — Estoque por custo médio ponderado
**Decisão:** entradas recalculam o custo médio; saídas usam o custo médio vigente e geram CMV.
**Motivo:** método adotado no cenário do professor e adequado ao controle gerencial.
**Consequência:** estoque físico deve conciliar com a conta contábil `1.0.4`; divergências geram ajuste.

### D12 — Apuração em uma única operação
**Decisão:** a apuração debita receitas, credita despesas/custos e transfere o líquido para `4.0.3 Lucros Acumulados`, tudo em uma operação `APURACAO`.
**Motivo:** simplificar o encerramento e manter rastreabilidade em um único lançamento.
**Consequência:** só pode existir uma apuração ativa por exercício; para refazer, estorna-se a anterior.

---

## Arquitetura e tecnologia

### D13 — Stack da demonstração
**Decisão:** Next.js 16.4.5 (App Router), React 19.3.1, TypeScript estrito, Tailwind 4.3.4, lucide-react.
**Motivo:** stack moderna, produtiva e adequada a um projeto educacional local.
**Consequência:** o build usa Turbopack; `tsconfig.json` é ajustado automaticamente pelo Next.

### D14 — Persistência mock em `localStorage`
**Decisão:** usar a chave `llfinance:mock:v1` com versão do estado = 1.
**Motivo:** permitir recarregar a página sem perder o que foi demonstrado.
**Consequência:** estados com versão diferente são ignorados de propósito; há exportação/importação JSON e reset.

### D15 — Motor contábil em funções puras
**Decisão:** concentrar saldos, razão, balancete, balanço, DRE e estoque em `src/lib/accounting.ts`, sem dependência de React.
**Motivo:** reutilizar exatamente a mesma lógica no servidor na Etapa 2 e facilitar testes unitários.
**Consequência:** o store apenas orquestra as ações; a matemática fica isolada.

### D16 — Gráficos em CSS
**Decisão:** o dashboard usa barras e indicadores em CSS, embora `recharts` esteja instalado.
**Motivo:** menos peso, mais controle visual e nenhuma necessidade de gráfico complexo nesta etapa.
**Consequência:** `recharts` pode ser removido se continuar sem uso.

### D17 — Cálculos de relatório sempre a partir das operações
**Decisão:** relatórios recalculam saldos a partir das operações ativas, em vez de manter saldos “congelados”.
**Motivo:** estornos e importações mudam o passado; recalcular garante consistência.
**Consequência:** o desempenho é adequado para o volume educacional; se crescer, avaliar cache ou saldos materializados.

---

## Pendências de decisão (para as próximas etapas)

- [ ] Autenticação: sessão própria com cookie `httpOnly` (proposta) vs. biblioteca externa.
- [ ] PDF: PDFKit no servidor (proposta) vs. impressão do navegador.
- [ ] Banco: SQLite (proposta para notebooks) vs. PostgreSQL.
- [ ] Escopo de obrigações fiscais: roteiro educativo vs. cálculo real por regime.
- [ ] Migração do `localStorage` para banco: big bang vs. tela a tela (proposta: tela a tela).
