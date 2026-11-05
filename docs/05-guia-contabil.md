# 05 — Guia Contábil do Projeto

> **Projeto:** LLFinance — Sistema Contábil Educacional  
> **Versão:** 1.0 — 05/11/2026  
> **Objetivo:** registrar as regras contábeis que o sistema deve aplicar, com exemplos numéricos que servem de teste.

---

## 1. Fundamentos

### 1.1 Patrimônio

**Patrimônio = Bens + Direitos − Obrigações.**

- **Bens:** caixa, estoque, veículos, máquinas, imóveis.
- **Direitos:** contas a receber de clientes, depósitos judiciais, aplicações.
- **Obrigações:** fornecedores, salários, impostos, empréstimos.

No balanço:

```text
ATIVO = PASSIVO + PATRIMÔNIO LÍQUIDO
```

- **Ativo:** bens e direitos (aplicação de recursos).
- **Passivo:** obrigações com terceiros (origem externa).
- **Patrimônio Líquido:** obrigação interna (capital dos sócios + resultados).

### 1.2 Partida dobrada

Todo débito tem um crédito de igual valor. Em cada operação:

```text
Σ débitos = Σ créditos
```

Se não fechar, o sistema **não grava**. Essa é a regra mais importante do projeto (RN01).

### 1.3 Regime de competência

A receita e a despesa são reconhecidas no período do **fato gerador**, não do pagamento/recebimento.

- Venda a prazo em dezembro: receita de dezembro, mesmo que o cliente pague em janeiro.
- Despesa de aluguel de dezembro paga em janeiro: despesa de dezembro.

### 1.4 Relevância e representação fidedigna

- **Relevância:** a informação deve influenciar decisões.
- **Representação fidedigna:** completa, neutra e livre de erros.
- Por isso o sistema mantém **trilha de auditoria** e **não apaga** lançamentos.

### 1.5 Usuários da contabilidade

- **Internos:** sócios, administradores, gestores.
- **Externos:** bancos, fornecedores, governo, investidores.

---

## 2. Plano de contas padrão

Adotamos o plano do sistema do professor (Contabiliês), com a seguinte lógica:

- **1 e 2** = Ativo (circulante e não circulante)
- **3** = Passivo (circulante e não circulante)
- **4** = Patrimônio Líquido
- **5** = Despesas e Custos
- **6** = Receitas
- **7** = Apuração do Resultado

| Código | Conta | Tipo | Grupo/Natureza |
|---|---|---|---|
| 1.0.1 | Caixa | Ativo | Circulante / devedora |
| 1.0.2 | Bancos Conta Movimento | Ativo | Circulante / devedora |
| 1.0.3 | Clientes | Ativo | Circulante / devedora |
| 1.0.4 | Estoques | Ativo | Circulante / devedora |
| 1.0.5 | Despesas Antecipadas | Ativo | Circulante / devedora |
| 2.0.1 | Clientes - Longo Prazo | Ativo | Realizável LP / devedora |
| 2.0.2 | Depósitos Judiciais | Ativo | Realizável LP / devedora |
| 2.1.1 | Participações Societárias | Ativo | Investimento / devedora |
| 2.1.2 | Imóveis para Renda | Ativo | Investimento / devedora |
| 2.2.1 | Máquinas e Equipamentos | Ativo | Imobilizado / devedora |
| 2.2.2 | Veículos | Ativo | Imobilizado / devedora |
| 2.2.3 | Móveis e Utensílios | Ativo | Imobilizado / devedora |
| 2.2.4 | Depreciação Acumulada | Ativo | Imobilizado / credora (contraconta) |
| 2.3.1 | Softwares | Ativo | Intangível / devedora |
| 2.3.2 | Marcas e Patentes | Ativo | Intangível / devedora |
| 3.0.1 | Fornecedores | Passivo | Circulante / credora |
| 3.0.2 | Salários a Pagar | Passivo | Circulante / credora |
| 3.0.3 | Impostos a Recolher | Passivo | Circulante / credora |
| 3.0.4 | Empréstimos Bancários CP | Passivo | Circulante / credora |
| 3.0.5 | Contas a Pagar | Passivo | Circulante / credora |
| 3.1.1 | Empréstimos Bancários LP | Passivo | Não Circulante / credora |
| 3.1.2 | Provisões Trabalhistas | Passivo | Não Circulante / credora |
| 3.1.3 | Contas a Pagar LP | Passivo | Não Circulante / credora |
| 4.0.1 | Capital Social | PL | Credora |
| 4.0.2 | Reservas de Lucros | PL | Credora |
| 4.0.3 | Lucros Acumulados | PL | Credora |
| 5.0.1 | CMV | Despesa | Devedora |
| 5.0.2 | CPV | Despesa | Devedora |
| 5.0.3 | CSP | Despesa | Devedora |
| 5.1.1 | Despesa com Salários | Despesa | Devedora |
| 5.1.2 | Despesa com Aluguel | Despesa | Devedora |
| 5.1.3 | Despesa com Energia Elétrica | Despesa | Devedora |
| 5.1.4 | Despesa Financeira | Despesa | Devedora |
| 5.1.5 | Despesa com Material de Escritório | Despesa | Devedora |
| 5.2.1 | Despesa com Depreciação | Despesa | Devedora |
| 5.3.0 | Despesa com IRPJ | Despesa | Devedora |
| 6.0.1 | Receita de Vendas | Receita | Credora |
| 6.0.2 | Receita de Serviços | Receita | Credora |
| 6.0.3 | Receita Financeira | Receita | Credora |
| 7.0.1 | Resultado do Exercício | Apuração | Credora (fechamento) |

### 2.1 Contas personalizadas

O sistema permite criar contas próprias, desde que:

- o código seja único na empresa;
- a conta pai exista e seja sintética;
- a conta folha seja analítica para receber lançamento;
- o tipo/natureza sejam coerentes com o grupo.

Exemplo: para o documento, a compra de 14x cita “fornecedores a longo prazo”. O plano padrão tem `3.1.3 Contas a Pagar LP`; se o professor preferir, o grupo pode criar `3.1.4 Fornecedores - Longo Prazo` como conta personalizada e usá-la no lançamento.

### 2.2 Contas sintéticas × analíticas

- **Sintética:** agrupa (ex.: `1.0 Ativo Circulante`). Não recebe lançamento.
- **Analítica:** recebe lançamento (ex.: `1.0.1 Caixa`).

O sistema deve impedir lançamento em conta sintética.

---

## 3. Natureza da conta e cálculo de saldo

| Tipo | Natureza | Aumenta com | Diminui com |
|---|---|---|---|
| Ativo | Devedora | Débito | Crédito |
| Despesa/Custo | Devedora | Débito | Crédito |
| Passivo | Credora | Crédito | Débito |
| Patrimônio Líquido | Credora | Crédito | Débito |
| Receita | Credora | Crédito | Débito |
| Apuração (7.0.1) | Credora (fechamento) | Crédito | Débito |

### 3.1 Fórmulas

Conta **devedora**:

```text
saldo = saldo_anterior + débitos − créditos
```

Conta **credora**:

```text
saldo = saldo_anterior + créditos − débitos
```

O documento diz “débito será somado e crédito será subtraído” (linha 139). Isso vale para contas devedoras. Para contas credoras, a lógica se inverte. O sistema **nunca** deve somar/subtrair cegamente: usa a natureza da conta.

### 3.2 Saldo devedor × credor no balancete

- Se o saldo de uma conta devedora ficar negativo, ela está com saldo credor (situação contra-natureza, normalmente erro).
- Se o saldo de uma conta credora ficar negativo, ela está com saldo devedor.
- O balancete deve mostrar a coluna D/C e sinalizar contra-natureza.

---

## 4. Lançamentos típicos

> Formato: **D** = débito; **C** = crédito. Todos os exemplos fecham débito = crédito.

### 4.1 Saldo inicial (integralização de capital)

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 1.0.1 Caixa | 50.000,00 | | |
| 4.0.1 Capital Social | | 50.000,00 | |
| **Totais** | **50.000,00** | **50.000,00** | |

- Tipo da operação: `SALDO_INICIAL`.
- Data: primeiro dia do exercício.
- Não entra na DRE; entra no BP, no Razão e no Balancete.

### 4.2 Compra à vista de mercadoria

Compra de 10.000,00 paga em dinheiro:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 1.0.4 Estoques | 10.000,00 | | |
| 1.0.1 Caixa | | 10.000,00 | |
| **Totais** | **10.000,00** | **10.000,00** | |

### 4.3 Compra a prazo em 14x (12x CP + 2x LP)

Compra de 14.000,00, em 14 parcelas de 1.000,00:

- 12 parcelas no curto prazo: 12.000,00 (Fornecedores).
- 2 parcelas no longo prazo: 2.000,00 (Fornecedores LP / Contas a Pagar LP).

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 1.0.4 Estoques | 14.000,00 | | |
| 3.0.1 Fornecedores (CP) | | 12.000,00 | |
| 3.1.3 Contas a Pagar LP | | 2.000,00 | |
| **Totais** | **14.000,00** | **14.000,00** | |

- Uma única operação, com duas contas credoras.
- As parcelas são criadas com vencimento e conta (CP/LP).
- Se houver dízima, a diferença de centavos vai para a última parcela.

### 4.4 Venda à vista com CMV

Venda de 5.000,00, custo da mercadoria 3.000,00:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 1.0.1 Caixa | 5.000,00 | | |
| 6.0.1 Receita de Vendas | | 5.000,00 | |
| 5.0.1 CMV | 3.000,00 | | |
| 1.0.4 Estoques | | 3.000,00 | |
| **Totais** | **8.000,00** | **8.000,00** | |

- **4 lançamentos** (4 linhas), como pede o documento.
- Lucro bruto = 5.000,00 − 3.000,00 = 2.000,00.
- O CMV vem do custo médio do estoque (Frente D).

### 4.5 Venda a prazo

Mesma venda, mas o cliente pagará depois:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 1.0.3 Clientes | 5.000,00 | | |
| 6.0.1 Receita de Vendas | | 5.000,00 | |
| 5.0.1 CMV | 3.000,00 | | |
| 1.0.4 Estoques | | 3.000,00 | |
| **Totais** | **8.000,00** | **8.000,00** | |

### 4.6 Venda de serviço (sem estoque)

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 1.0.1 Caixa (ou 1.0.3 Clientes) | 5.000,00 | | |
| 6.0.2 Receita de Serviços | | 5.000,00 | |
| **Totais** | **5.000,00** | **5.000,00** | |

### 4.7 Despesa de aluguel paga em dinheiro

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 5.1.2 Despesa com Aluguel | 1.000,00 | | |
| 1.0.1 Caixa | | 1.000,00 | |
| **Totais** | **1.000,00** | **1.000,00** | |

### 4.8 Despesa incorrida e não paga

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 5.1.3 Despesa com Energia Elétrica | 800,00 | | |
| 3.0.5 Contas a Pagar | | 800,00 | |
| **Totais** | **800,00** | **800,00** | |

### 4.9 Estorno

Estorno da venda à vista:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 6.0.1 Receita de Vendas | 5.000,00 | | |
| 1.0.1 Caixa | | 5.000,00 | |
| 1.0.4 Estoques | 3.000,00 | | |
| 5.0.1 CMV | | 3.000,00 | |
| **Totais** | **8.000,00** | **8.000,00** | |

- O original não é apagado: fica `ESTORNADA`.
- O estorno fica vinculado (`reversal_of_id`).
- A trilha mostra original → estorno → atual.

### 4.10 Ajuste de estoque (sobra)

Inventário encontrou 2 unidades a mais, custo médio 15,00:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 1.0.4 Estoques | 30,00 | | |
| 5.0.1 CMV (ou conta de ajuste) | | 30,00 | |
| **Totais** | **30,00** | **30,00** | |

> Para falta, inverter: D CMV / C Estoques. O importante é manter a conta de estoque reconciliada.

---

## 5. Livro Diário

### 5.1 O que é

Registro cronológico e completo das operações. É o livro principal; o Razão é extraído dele.

### 5.2 Campos obrigatórios

- Data da operação.
- Histórico (descrição).
- Conta debitada e conta creditada.
- Valor.
- ID/número da operação.
- Usuário responsável e data/hora do registro.
- Status (ativa/estornada/substituída).
- Referência ao documento (venda/compra).

### 5.3 Regras

- Numeração sequencial por empresa/exercício, sem lacunas.
- Imutável: não se edita nem apaga; estorna-se.
- Toda linha referencia a operação.
- Total de débitos = total de créditos por operação.
- PDF com cabeçalho, período e “Página X de Y”.

### 5.4 Layout do PDF (referência do professor)

| Ref. | Data | Histórico | Débito (+) | Crédito (−) | Valor |
|---|---|---|---|---|---|
| OP-2026-000001 | 02/01/2026 | Saldo inicial | 1.0.1 - Caixa | 4.0.1 - Capital Social | 50.000,00 |
| OP-2026-000002 | 05/01/2026 | Compra 14x | 1.0.4 - Estoques | 3.0.1 - Fornecedores | 14.000,00 |
| ... | | | | | |

---

## 6. Livro Razão

### 6.1 O que é

Extrato de **uma conta**, com saldo anterior, movimentos e saldo acumulado.

### 6.2 Fórmula

```text
saldo_anterior = movimentos anteriores ao período
saldo_linha = saldo_anterior + (débito se devedora / crédito se credora) − (o contrário)
saldo_final = último saldo_linha
```

### 6.3 Layout

| Data | Histórico | Débito (+) | Crédito (−) | Saldo |
|---|---|---|---:|---:|
| 01/01/2026 | Saldo anterior | | | 50.000,00 D |
| 02/01/2026 | Saldo inicial | 50.000,00 | | 50.000,00 D |
| 05/01/2026 | Compra 14x | | 14.000,00 | 36.000,00 D |
| 10/01/2026 | Venda | 5.000,00 | | 41.000,00 D |
| 15/01/2026 | Aluguel | | 1.000,00 | 40.000,00 D |
| **Saldo final** | | | | **40.000,00 D** |

> O sinal D/C depende da natureza. O sistema deve exibir “D” ou “C” explicitamente.

### 6.4 Regra de conferência

O saldo final do Razão de cada conta deve ser **igual** ao saldo apresentado no Balancete para a mesma conta e período.

---

## 7. Balancete de verificação

### 7.1 O que é

Relação de todas as contas com saldo anterior, débitos, créditos e saldo atual. Serve para conferir a partida dobrada.

### 7.2 Fórmula

```text
Σ saldos devedores = Σ saldos credores
Σ débitos do período = Σ créditos do período
```

### 7.3 Layout

| Código | Conta | Saldo anterior | Débitos | Créditos | Saldo atual | D/C |
|---|---|---:|---:|---:|---:|---|
| 1.0.1 | Caixa | 0,00 | 55.000,00 | 15.000,00 | 40.000,00 | D |
| 1.0.4 | Estoques | 0,00 | 14.000,00 | 3.000,00 | 11.000,00 | D |
| 3.0.1 | Fornecedores | 0,00 | 0,00 | 12.000,00 | 12.000,00 | C |
| 3.1.3 | Contas a Pagar LP | 0,00 | 0,00 | 2.000,00 | 2.000,00 | C |
| 4.0.1 | Capital Social | 0,00 | 0,00 | 50.000,00 | 50.000,00 | C |
| 6.0.1 | Receita de Vendas | 0,00 | 0,00 | 5.000,00 | 5.000,00 | C |
| 5.0.1 | CMV | 0,00 | 3.000,00 | 0,00 | 3.000,00 | D |
| 5.1.2 | Aluguel | 0,00 | 1.000,00 | 0,00 | 1.000,00 | D |
| **Totais** | | | **73.000,00** | **73.000,00** | | |

- O total de débitos e créditos do período fecha.
- O balancete **não** substitui o Diário; é uma conferência.

---

## 8. Balanço Patrimonial

### 8.1 Estrutura

```text
ATIVO
  Ativo Circulante
    Caixa, Bancos, Clientes, Estoques, Despesas Antecipadas
  Ativo Não Circulante
    Realizável a Longo Prazo
    Investimentos
    Imobilizado
    Intangível
TOTAL DO ATIVO

PASSIVO E PATRIMÔNIO LÍQUIDO
  Passivo Circulante
    Fornecedores, Salários, Impostos, Empréstimos CP, Contas a Pagar
  Passivo Não Circulante
    Empréstimos LP, Provisões, Contas a Pagar LP
  Patrimônio Líquido
    Capital Social, Reservas, Lucros/Prejuízos Acumulados
TOTAL DO PASSIVO E PL
```

### 8.2 Regra

```text
Ativo = Passivo + PL
```

Se não fechar, o sistema deve **alertar** e indicar a diferença.

### 8.3 Exemplo completo (após a apuração)

Cenário:

- Saldo inicial: Caixa 50.000 / Capital 50.000.
- Compra a prazo 14.000 (12 CP + 2 LP), sem entrada em caixa.
- Venda à vista 5.000, CMV 3.000.
- Aluguel 1.000.
- Apuração: lucro 1.000 para Lucros Acumulados.

**Ativo:**

| Conta | Valor |
|---|---:|
| Caixa (50.000 + 5.000 − 1.000) | 54.000,00 |
| Estoques (14.000 − 3.000) | 11.000,00 |
| **Total do Ativo** | **65.000,00** |

**Passivo e PL:**

| Conta | Valor |
|---|---:|
| Fornecedores CP | 12.000,00 |
| Contas a Pagar LP | 2.000,00 |
| Capital Social | 50.000,00 |
| Lucros Acumulados | 1.000,00 |
| **Total do Passivo e PL** | **65.000,00** |

**Confere:** 65.000 = 65.000.

### 8.4 Antes da apuração

Antes de apurar, o lucro de 1.000 ainda está nas contas de resultado (6.x e 5.x) e o PL oficial tem apenas 50.000. O BP “fecharia” em 64.000 contra 65.000. Por isso:

- O sistema deve **exigir ou sugerir a apuração** antes do BP final; ou
- exibir uma linha “Resultado do Exercício a Destinar (7.0.1)” no PL, com nota de apuração pendente, e o **Razonete da ARE** (como o professor faz).

Recomendação: gerar o BP final **após a apuração** e, enquanto pendente, mostrar o alerta e o Razonete da ARE.

---

## 9. DRE — Demonstração do Resultado do Exercício

### 9.1 Layout (idêntico ao professor)

```text
RECEITAS OPERACIONAIS
  6.0.1 - Receita de Vendas .............. 5.000,00
  6.0.2 - Receita de Serviços ............     0,00
  6.0.3 - Receita Financeira .............     0,00
TOTAL DE RECEITAS (+) ................... 5.000,00

DESPESAS OPERACIONAIS
  5.0.1 - CMV ............................ 3.000,00
  5.1.2 - Despesa com Aluguel ............ 1.000,00
  5.1.3 - Despesa com Energia Elétrica ...     0,00
  ...
TOTAL DE DESPESAS (-) ................... 4.000,00

LUCRO LÍQUIDO DO EXERCÍCIO .............. 1.000,00
```

Se as despesas forem maiores:

```text
PREJUÍZO LÍQUIDO DO EXERCÍCIO ........... (X,XX)
```

### 9.2 Fórmula

```text
Resultado = Total de Receitas − Total de Despesas
```

- Receitas: saldo credor das contas tipo Receita.
- Despesas: saldo devedor das contas tipo Despesa/Custo (inclui CMV, CPV, CSP).
- O CMV aparece em “Despesas Operacionais”, como no sistema do professor.

### 9.3 Regras importantes

1. **Não incluir** a operação `SALDO_INICIAL`.
2. **Não incluir** a operação de `APURACAO` (senão, depois do fechamento, a DRE ficaria zerada).
3. A DRE deve continuar correta antes e depois da apuração.
4. O sistema deve permitir DRE por período (mês, trimestre, ano).
5. O PDF deve ter o mesmo layout e os mesmos totais do professor.

### 9.4 Conferência com o professor

Para o cenário de teste:

```text
Receitas = 5.000,00
Despesas = 3.000,00 (CMV) + 1.000,00 (aluguel) = 4.000,00
Lucro = 1.000,00
```

Se o sistema do professor mostrar outro valor, comparar:

- se ele incluiu o saldo inicial indevidamente;
- se ele considerou CMV como custo separado;
- se ele não apurou o resultado;
- se há lançamento de imposto ou despesa esquecido.

---

## 10. Apuração do resultado

### 10.1 O que é

Encerrar as contas de resultado (receitas e despesas) e transferir o lucro/prejuízo para o PL.

### 10.2 Passos

1. Transferir as receitas para `7.0.1`:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 6.0.1 Receita de Vendas | 5.000,00 | | |
| 7.0.1 Resultado do Exercício | | 5.000,00 | |

2. Transferir as despesas para `7.0.1`:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 7.0.1 Resultado do Exercício | 4.000,00 | | |
| 5.0.1 CMV | | 3.000,00 | |
| 5.1.2 Aluguel | | 1.000,00 | |

3. Transferir o lucro para o PL:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 7.0.1 Resultado do Exercício | 1.000,00 | | |
| 4.0.3 Lucros Acumulados | | 1.000,00 | |

Se fosse prejuízo:

| Conta | D | C | Valor |
|---|---:|---:|---:|
| 4.0.3 Lucros Acumulados (ou 4.0.4 Prejuízos Acumulados) | 1.000,00 | | |
| 7.0.1 Resultado do Exercício | | 1.000,00 | |

### 10.3 Depois da apuração

- Contas 5.x e 6.x ficam com saldo zero.
- `7.0.1` fica com saldo zero.
- PL aumenta (lucro) ou diminui (prejuízo).
- A DRE do período continua sendo calculada pelos **movimentos** de receita/despesa, ignorando a apuração.

### 10.4 Idempotência

Não permitir apurar duas vezes o mesmo exercício. Se precisar corrigir, reabrir o período (com auditoria), estornar a apuração e refazer.

---

## 11. Estoque e custo médio

### 11.1 Fórmula do custo médio ponderado

```text
custo_médio_novo = (qtd_atual × custo_atual + qtd_entrada × custo_entrada)
                   ─────────────────────────────────────────────────────
                                 qtd_atual + qtd_entrada
```

### 11.2 Exemplo

| Movimento | Qtd | Custo unit. | Total | Qtd após | Custo médio após |
|---|---:|---:|---:|---:|---:|
| Saldo inicial | 10 | 10,00 | 100,00 | 10 | 10,00 |
| Compra | 10 | 20,00 | 200,00 | 20 | 15,00 |
| Venda | 5 | 15,00 | 75,00 | 15 | 15,00 |
| Compra | 5 | 30,00 | 150,00 | 20 | 18,75 |

- CMV da venda = 5 × 15,00 = 75,00.
- Estoque final = 20 × 18,75 = 375,00.
- Conferência: 100 + 200 − 75 + 150 = 375,00.

### 11.3 Regras

- Entrada de compra: atualiza quantidade e custo médio.
- Saída de venda: baixa quantidade e gera CMV pelo custo médio vigente.
- Ajuste de inventário: sobra/falta com justificativa e auditoria.
- Estoque não pode ficar negativo (ou exige autorização auditada).
- Kardex deve fechar com o saldo do produto.
- Reconciliação: saldo contábil de `1.0.4 Estoques` = valor do estoque (qtd × custo médio).

### 11.4 Integração contábil

- Compra: D `1.0.4 Estoques` / C `3.0.1 Fornecedores` (ou Caixa).
- Venda: D `5.0.1 CMV` / C `1.0.4 Estoques`.
- Ajuste de sobra: D `1.0.4 Estoques` / C `5.0.1 CMV` (ou conta específica).
- Ajuste de falta: D `5.0.1 CMV` / C `1.0.4 Estoques`.

> O sistema deve impedir que a contabilidade e o estoque se separem. Se a compra foi lançada mas o estoque não entrou, a reconciliação acusa.

---

## 12. Estorno e trilha de auditoria

### 12.1 Regra

**Nada é excluído definitivamente.**

- Cadastro: `deleted_at` + `deleted_by` (exclusão lógica).
- Lançamento: estorno (operação inversa) + status.
- Edição: estorno + nova operação.

### 12.2 Trilha

Cada operação guarda:

- `reversal_of_id` — qual operação ela estorna.
- `replaced_by_id` — qual operação substituiu a original.
- `edited_from_id` — de qual operação ela foi editada.
- `criado_por`, `criado_em`.
- `motivo_estorno`.
- `audit_log` com antes/depois.

### 12.3 O que a tela deve mostrar

```text
Original: OP-2026-000010 — Venda — R$ 5.000,00 — ATIVA
Estorno: OP-2026-000015 — Estorno — R$ 5.000,00 — ATIVA
Atual:   OP-2026-000016 — Venda corrigida — R$ 4.500,00 — ATIVA
```

Com usuário, data/hora e motivo em cada etapa.

---

## 13. Obrigações por natureza jurídica

> **Tabela educacional.** Não substitui contador; alíquotas, prazos e obrigações variam por atividade, estado e regime. O sistema **não calcula** tributos.

| Natureza | Característica | Obrigações típicas | Relatórios |
|---|---|---|---|
| **MEI** | Um titular; limite de faturamento de R$ 81.000,00/ano (conforme documento) | DAS mensal, DASN-SIMEI anual, controle de receitas | Sem relatórios contábeis formais; manter controle gerencial |
| **EI** | Um titular; sem limite; patrimônio pessoal responde pelas dívidas | IRPF, INSS, ISS/ICMS conforme atividade, contabilidade gerencial | DRE/BP gerenciais |
| **SLU** | Um sócio; responsabilidade limitada ao capital | Simples/Presumido/Real; IRPJ, CSLL, PIS, COFINS, ICMS/ISS, folha | DRE/BP, balancete |
| **LTDA** | Dois ou mais sócios; dívidas limitadas ao capital | Mesmas obrigações da SLU; livro Diário/Razão; DRE/BP | DRE/BP, balancete, livros |
| **S.A** | Capital dividido em ações; pode ser aberta ou fechada | CVM (se aberta), auditoria independente, assembleias, tributos | BP, DRE, DMPL, DFC, notas explicativas |
| **Cooperativa** | Lucro/sobras entre cooperados; regras próprias | Ato cooperado, assembleia, tributos específicos, INSS | DRE/BP, prestação de contas |
| **Associação** | Fim cultural/esportivo/científico; sem fim lucrativo | Imunidade/isenção se requisitos; prestação de contas | DRE/BP, relatório de atividades |
| **Fundação** | Fim filantrópico; sem sócios | Ministério Público, prestação de contas, imunidade/isenção se requisitos | DRE/BP, relatório de atividades |

### 13.1 O que o sistema faz

- Cria um **checklist** de obrigações conforme natureza/regime.
- Permite marcar pendente/pago/atrasado, com competência, vencimento, valor e observação.
- Alerta no dashboard.
- **Não** calcula imposto, não emite guia e não transmite obrigação.

### 13.2 O que o sistema não faz

- Cálculo oficial de IRPJ/CSLL/PIS/COFINS/ICMS/ISS.
- SPED, eSocial, NF-e, DCTF, ECF.
- Assinatura digital.
- Substituição do contador.

---

## 14. Checklist de fechamento

Antes de fechar o período:

- [ ] Saldos iniciais balanceados.
- [ ] Todas as operações do período com débito = crédito.
- [ ] Nenhuma conta sintética recebeu lançamento.
- [ ] Estoque reconciliado com a conta `1.0.4 Estoques`.
- [ ] Razão de cada conta confere com o Balancete.
- [ ] DRE gerada e conferida (receitas − despesas).
- [ ] Apuração do resultado realizada.
- [ ] BP fechando: Ativo = Passivo + PL.
- [ ] PDF completo gerado e arquivado.
- [ ] Backup exportado.
- [ ] Período fechado e bloqueado para novos lançamentos.
- [ ] Auditoria revisada (quem fez o quê).

---

## 15. Erros comuns a evitar

| Erro | Consequência | Como o sistema previne |
|---|---|---|
| Lançar receita como débito | DRE errada | Natureza da conta + validação visual |
| Não lançar o CMV | Lucro inflado; estoque errado | Venda automática com 4 linhas |
| Usar conta sintética | Lançamento inválido | Campo `analitica` obrigatório |
| Excluir lançamento | Perda de histórico | Estorno + auditoria |
| Misturar saldo inicial com operação normal | DRE distorcida | Tipo `SALDO_INICIAL` separado |
| Somar tudo como se fosse conta devedora | Saldo invertido | Cálculo pela natureza |
| Esquecer a apuração | BP não fecha | Alerta + Razonete da ARE |
| Gerar DRE depois da apuração sem excluir o encerramento | DRE zerada | Excluir operações `APURACAO` |
| Usar `float` para dinheiro | Centavos errados | Inteiros em centavos |
| Não conciliar estoque | Contabilidade × físico divergem | Reconciliação automática |
| Compra a prazo sem separar CP/LP | Passivo distorcido | Compra parcelada com duas contas |
| Lançar em período fechado | Relatório muda depois de fechado | Bloqueio por período |
| Esquecer o usuário na operação | Sem responsável | Sessão + auditoria |

---

## 16. Como comparar com o sistema do professor

1. Criar a **mesma empresa** e o **mesmo plano de contas** nos dois sistemas.
2. Lançar o **mesmo saldo inicial**.
3. Lançar a **mesma compra** (14.000 em 14x), a **mesma venda** (5.000, CMV 3.000) e a **mesma despesa** (1.000).
4. Comparar:
   - Livro Diário: mesmas linhas e valores.
   - Razão: mesmos saldos.
   - Balancete: mesmos totais.
   - DRE: mesmo layout e mesmo lucro (1.000).
   - BP: mesmos totais (após a apuração: Ativo 65.000, Passivo 14.000, PL 51.000).
5. Se divergir, verificar:
   - se o professor inclui saldo inicial na DRE;
   - se ele apura o resultado;
   - se o CMV foi lançado;
   - se a compra foi à vista ou a prazo;
   - se há impostos ou despesas extras.

### 16.1 Fixture de referência

```json
{
  "saldoInicial": { "caixa": 50000, "capital": 50000 },
  "compra": { "total": 14000, "parcelasCp": 12, "parcelasLp": 2 },
  "venda": { "receita": 5000, "cmv": 3000 },
  "despesaAluguel": 1000,
  "dre": { "receitas": 5000, "despesas": 4000, "lucro": 1000 },
  "balanco": { "ativo": 65000, "passivo": 14000, "pl": 51000 }
}
```

> Essa fixture deve virar teste automatizado (golden test) na Frente C.

---

## 17. Resumo das fórmulas

```text
Partida dobrada:       Σ débitos = Σ créditos
Conta devedora:        saldo = anterior + débitos − créditos
Conta credora:         saldo = anterior + créditos − débitos
Balancete:             Σ saldos devedores = Σ saldos credores
Balanço:               Ativo = Passivo + PL
DRE:                   Resultado = Receitas − Despesas
Apuração:              7.0.1 = Receitas − Despesas; PL += Resultado
Custo médio:           (qtd_atual × custo_atual + qtd_entrada × custo_entrada) / (qtd_atual + qtd_entrada)
CMV:                   qtd_vendida × custo_médio
Estoque:               qtd × custo_médio
Parcela:               total / n; diferença de centavos na última
```
