# LLFinance — Sistema Contábil Educacional

Sistema contábil web para abrir uma empresa do zero, cadastrar o plano de contas, lançar saldos iniciais, registrar operações, controlar estoque e emitir os livros e demonstrações contábeis — com trilha de auditoria e persistência para retomada.

Projeto construído a partir do documento `Contabilidade.txt` e do sistema de referência do professor (Contabiliês): <https://sistemadecontabilidade.netlify.app/>.

## Objetivo

Entregar um sistema que permita ao aluno:

1. Cadastrar a empresa (CNPJ, natureza jurídica, regime e obrigações).
2. Carregar ou criar o plano de contas.
3. Informar saldos iniciais balanceados.
4. Lançar operações com partida dobrada.
5. Gerar Livro Diário, Livro Razão, Balancete, Balanço Patrimonial e DRE.
6. Controlar estoque e apurar o resultado.
7. Manter tudo salvo, auditável e eternamente rastreável (nada é excluído de forma definitiva).

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/01-levantamento-requisitos.md`](docs/01-levantamento-requisitos.md) | Escopo, regras contábeis, requisitos funcionais e não funcionais, rastreabilidade |
| [`docs/02-arquitetura-e-modelo-de-dados.md`](docs/02-arquitetura-e-modelo-de-dados.md) | Stack, arquitetura, modelo de dados, contratos, segurança, PDF e testes |
| [`docs/03-divisao-4-pessoas.md`](docs/03-divisao-4-pessoas.md) | **Divisão do trabalho em 4 frentes ponta a ponta**, RACI, integração e cronograma |
| [`docs/04-backlog-e-cronograma.md`](docs/04-backlog-e-cronograma.md) | Backlog por sprint, critérios de aceite, roteiro de demonstração e plano de testes |
| [`docs/05-guia-contabil.md`](docs/05-guia-contabil.md) | Regras contábeis aplicadas, plano de contas, lançamentos exemplo, BP, DRE e estoque |

## As 4 frentes

| Frente | Responsável | Entrega principal |
|---|---|---|
| **A — Fundação & Cadastros** | Pessoa A | Empresa, plano de contas, saldos iniciais, usuários, auditoria e design system |
| **B — Lançamentos & Diário** | Pessoa B | Motor de partida dobrada, balancete de lançamento, Livro Diário, venda automática, compra parcelada, estorno e apuração |
| **C — Livros & Demonstrações** | Pessoa C | Livro Razão, balancete de verificação, Balanço Patrimonial, DRE e PDF completo |
| **D — Estoque, Tributação & Qualidade** | Pessoa D | Controle de estoque, custo médio/CMV, obrigações por natureza, dashboard, testes E2E e entrega |

Cada frente é uma **fatia vertical**: banco + serviço + API + tela + testes + documentação. As quatro se conectam por contratos definidos na semana 1.

## Stack proposta

- **Next.js (App Router) + TypeScript + React** — aplicação web local, sem depender de internet.
- **Tailwind CSS** — interface em português, responsiva e imprimível.
- **Prisma + SQLite** — persistência em arquivo, ideal para os notebooks do instituto; troca para PostgreSQL se necessário.
- **Zod** — validação compartilhada entre cliente e servidor.
- **Sessão própria com cookie `httpOnly` + `bcryptjs`** — login e perfis sem complexidade desnecessária.
- **PDFKit** — geração dos livros e relatórios em PDF no servidor.
- **Vitest + Playwright** — testes unitários, de integração e ponta a ponta.
- **SheetJS (`xlsx`)** — importação/exportação do plano de contas e relatórios.

## Como este repositório está organizado

```text
LLFinance/
├─ docs/                  # levantamento, arquitetura, divisão, backlog e guia contábil
├─ acompanhamento/        # STATUS, ETAPAS, DIARIO e DECISOES (ponto de retomada)
├─ src/
│  ├─ app/                # rotas e telas (App Router)
│  ├─ components/         # design system e shell de navegação
│  └─ lib/                # tipos, utils, motor contábil, mocks e store
├─ README.md
└─ package.json
```

A estrutura definitiva com `prisma/`, `src/core/` e `src/modules/` será criada na Etapa 2, quando os mocks forem substituídos pela persistência real.

## Status

- [x] Leitura e interpretação do documento do professor.
- [x] Levantamento de requisitos e regras contábeis.
- [x] Modelo de dados e arquitetura.
- [x] Divisão em 4 frentes ponta a ponta.
- [x] **Etapa 1 — protótipo navegável com dados mockados** (todas as telas, motor contábil e persistência local).
- [x] `npm run typecheck` e `npm run build` sem erros.
- [ ] Aprovação visual do usuário.
- [ ] Etapa 2 — persistência real com Prisma + SQLite.

O acompanhamento detalhado fica em [`acompanhamento/STATUS.md`](acompanhamento/STATUS.md). Para retomar o trabalho, leia primeiro [`acompanhamento/README.md`](acompanhamento/README.md).

## Aviso

Projeto **educacional**. O sistema não substitui um contador, não calcula tributos oficiais e não emite guias, SPED, NF-e ou obrigações acessórias. A tabela de obrigações é um roteiro de estudo e deve ser validada por um profissional.
