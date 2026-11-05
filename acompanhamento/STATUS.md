# STATUS — LLFinance

> Atualizado em **05/11/2026**.
> Este arquivo responde: “onde paramos e o que faço agora?”.

## 1. Fase atual

**Etapa 1 — Protótipo navegável com dados mockados.**

Objetivo da etapa: permitir que o usuário navegue por **todas** as telas, veja o visual final e aprove o layout antes de investir na implementação real (banco, API, autenticação, PDF no servidor).

Situação: **implementação concluída e compilando**. Falta apenas a **aprovação visual do usuário** para iniciar a Etapa 2.

## 2. Validações executadas

| Verificação | Comando | Resultado |
|---|---|---|
| Tipagem estrita | `npm run typecheck` | ✅ sem erros |
| Build de produção | `npm run build` | ✅ 23 rotas geradas |
| Smoke HTTP das 21 rotas + `/diario/[id]` | `next start` + requisições locais | ✅ todas 200 |
| Aprovação visual | revisão manual no `npm run dev` | ⏳ pendente do usuário |

O build confirmou as rotas:

```text
/                       /empresa              /plano-contas
/saldos-iniciais        /lancamentos          /lancamentos/novo
/vendas                 /compras              /diario
/diario/[id]            /apuracao             /razao
/balancete              /balanco              /dre
/relatorios             /relatorios/completo  /estoque
/obrigacoes             /auditoria            /usuarios
/configuracoes
```

## 3. O que já está pronto

### Infraestrutura
- Next.js 16.4.5 (App Router), React 19.3.1, TypeScript estrito, Tailwind CSS 4.3.4, lucide-react.
- Design system próprio em `src/components/ui.tsx`.
- Shell com sidebar, topbar, seletor de sessão, toasts e modo impressão em `src/components/AppShell.tsx`.
- Estado global em `src/lib/store.tsx`, persistido em `localStorage` na chave `llfinance:mock:v1`.
- Motor contábil em `src/lib/accounting.ts` (validação, saldos, razão, balancete, balanço, DRE, estoque).
- Cenário inicial em `src/lib/mock-data.ts`, com 41 contas, 6 operações, estoque, obrigações, 4 usuários e auditoria.

### Telas
- Dashboard com indicadores, gráficos em CSS e atalhos.
- Empresa, Plano de Contas e Saldos Iniciais.
- Lançamentos (lista e novo), Vendas, Compras.
- Livro Diário e detalhe da operação com estorno auditado.
- Apuração do Resultado.
- Livro Razão, Balancete, Balanço Patrimonial e DRE.
- Central de Relatórios e Relatório Completo imprimível (capa + 8 seções).
- Estoque, Obrigações, Auditoria, Usuários e Configurações.

### Regras contábeis implementadas
- Partida dobrada obrigatória; bloqueio de lançamento desbalanceado.
- Regime de competência.
- Natureza da conta (devedora/credora) no cálculo dos saldos.
- Venda com 4 partidas (receita + CMV) quando há custo.
- Compra em 14x dividida em 12x circulante + 2x longo prazo.
- Estorno imutável: operação original permanece com status `ESTORNADA`.
- Apuração zera contas 5.x/6.x e transfere o resultado para `4.0.3`.
- DRE ignora `SALDO_INICIAL` e `APURACAO` para continuar correta após o encerramento.
- Balanço exibe “Resultado do Exercício (a apurar)” no PL enquanto a apuração não ocorre.
- Estoque por custo médio ponderado, conciliado com a conta `1.0.4`.

## 4. Valores de referência do cenário mock

| Indicador | Valor |
|---|---|
| Saldo inicial (Caixa / Capital) | R$ 50.000,00 |
| Compra | R$ 14.000,00 em 14x (R$ 12.000,00 CP + R$ 2.000,00 LP) |
| Estoque inicial | 10 unidades a R$ 1.400,00 |
| Venda | 5 unidades a R$ 2.000,00 = R$ 10.000,00 |
| CMV | R$ 7.000,00 |
| Aluguel | R$ 1.000,00 |
| Material | R$ 500,00 (estornado) |
| Resultado | R$ 2.000,00 |
| Caixa final | R$ 59.000,00 |
| Estoque final | R$ 7.000,00 |
| Ativo total | R$ 66.000,00 |
| Passivo exigível | R$ 14.000,00 |
| PL antes da apuração | R$ 50.000,00 + R$ 2.000,00 a apurar |
| PL depois da apuração | R$ 52.000,00 |

O cenário inicial deixa a apuração **pendente** de propósito, para o usuário executá-la na tela `/apuracao`.

## 5. Pendências desta etapa

- [ ] Aprovação visual do usuário (layout, cores, densidade das tabelas, textos).
- [ ] Ajustes visuais solicitados após a aprovação.
- [ ] Revisão de responsividade em telas pequenas (tablet/celular).
- [ ] Revisão de impressão/PDF no navegador (Chrome e Edge).

## 6. Próximo passo (Etapa 2)

1. Criar `prisma/schema.prisma` com Empresa, Usuário, Conta, SaldoInicial, Operação, Linha, Produto, MovimentoEstoque, Obrigação, Auditoria e Período.
2. Criar seed que replique exatamente o cenário mock atual.
3. Implementar camada de serviços no servidor reutilizando as funções puras de `src/lib/accounting.ts`.
4. Criar rotas de API e trocar o store mock por chamadas reais, tela a tela.
5. Introduzir autenticação e autorização por papel.
6. Só então substituir o `localStorage` e remover a etiqueta de “dados mockados”.

## 7. Arquivos-chave

| Arquivo | Papel |
|---|---|
| `src/lib/types.ts` | Contratos de domínio |
| `src/lib/mock-data.ts` | Cenário inicial e mapa `CONTA` |
| `src/lib/accounting.ts` | Motor contábil puro |
| `src/lib/store.tsx` | Estado global e ações de negócio |
| `src/components/ui.tsx` | Design system |
| `src/components/AppShell.tsx` | Navegação e sessão |
| `src/app/*` | Telas |
| `docs/05-guia-contabil.md` | Regras e valores esperados |
| `C:\Users\aluno\Downloads\Contabilidade.txt` | Enunciado original |

## 8. Observações importantes

- O diretório **não é um repositório git**. Não há commits; todas as alterações estão no disco.
- `recharts` está instalado, mas os gráficos do dashboard são feitos em CSS para evitar dependência desnecessária.
- Next.js ajustou automaticamente `tsconfig.json` no build (`jsx: react-jsx` e include de `.next/dev/types/**/*.ts`). Isso é esperado.
- A versão do estado é `1`; backups com versão diferente são ignorados de propósito para evitar dados incompatíveis.
