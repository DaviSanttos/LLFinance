import type {
  Auditoria,
  Conta,
  EstadoMock,
  MovimentoEstoque,
  Obrigacao,
  Operacao,
  Produto,
  SaldoInicial,
} from "./types";
import { adicionarMeses } from "./utils";

export function idConta(codigo: string): string {
  return `conta-${codigo.replaceAll(".", "-")}`;
}

export const CONTA = {
  caixa: idConta("1.0.1"),
  bancos: idConta("1.0.2"),
  clientes: idConta("1.0.3"),
  estoques: idConta("1.0.4"),
  despesasAntecipadas: idConta("1.0.5"),
  aplicacoes: idConta("1.0.6"),
  clientesLP: idConta("2.0.1"),
  depositosJudiciais: idConta("2.0.2"),
  participacoes: idConta("2.1.1"),
  imoveis: idConta("2.1.2"),
  maquinas: idConta("2.2.1"),
  veiculos: idConta("2.2.2"),
  moveis: idConta("2.2.3"),
  depreciacao: idConta("2.2.4"),
  softwares: idConta("2.3.1"),
  marcas: idConta("2.3.2"),
  fornecedores: idConta("3.0.1"),
  salariosPagar: idConta("3.0.2"),
  impostos: idConta("3.0.3"),
  emprestimosCP: idConta("3.0.4"),
  contasPagar: idConta("3.0.5"),
  emprestimosLP: idConta("3.1.1"),
  provisoes: idConta("3.1.2"),
  contasPagarLP: idConta("3.1.3"),
  capital: idConta("4.0.1"),
  reservas: idConta("4.0.2"),
  lucros: idConta("4.0.3"),
  cmv: idConta("5.0.1"),
  cpv: idConta("5.0.2"),
  csp: idConta("5.0.3"),
  salarios: idConta("5.1.1"),
  aluguel: idConta("5.1.2"),
  energia: idConta("5.1.3"),
  financeira: idConta("5.1.4"),
  material: idConta("5.1.5"),
  depreciacaoDespesa: idConta("5.2.1"),
  irpj: idConta("5.3.0"),
  receitaVendas: idConta("6.0.1"),
  receitaServicos: idConta("6.0.2"),
  receitaFinanceira: idConta("6.0.3"),
  apuracao: idConta("7.0.1"),
} as const;

type ContaBase = Pick<Conta, "codigo" | "nome" | "tipo" | "natureza" | "grupo"> & {
  padrao?: boolean;
};

const CONTAS_BASE: ContaBase[] = [
  // Ativo circulante
  { codigo: "1.0.1", nome: "Caixa", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "CIRCULANTE" },
  { codigo: "1.0.2", nome: "Bancos Conta Movimento", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "CIRCULANTE" },
  { codigo: "1.0.3", nome: "Clientes", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "CIRCULANTE" },
  { codigo: "1.0.4", nome: "Estoques", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "CIRCULANTE" },
  { codigo: "1.0.5", nome: "Despesas Antecipadas", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "CIRCULANTE" },
  { codigo: "1.0.6", nome: "Aplicações Financeiras", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "CIRCULANTE", padrao: false },
  // Ativo não circulante
  { codigo: "2.0.1", nome: "Clientes - Longo Prazo", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "REALIZAVEL_LP" },
  { codigo: "2.0.2", nome: "Depósitos Judiciais", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "REALIZAVEL_LP" },
  { codigo: "2.1.1", nome: "Participações Societárias", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "INVESTIMENTO" },
  { codigo: "2.1.2", nome: "Imóveis para Renda", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "INVESTIMENTO" },
  { codigo: "2.2.1", nome: "Máquinas e Equipamentos", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "IMOBILIZADO" },
  { codigo: "2.2.2", nome: "Veículos", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "IMOBILIZADO" },
  { codigo: "2.2.3", nome: "Móveis e Utensílios", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "IMOBILIZADO" },
  { codigo: "2.2.4", nome: "Depreciação Acumulada", tipo: "ATIVO", natureza: "CREDORA", grupo: "IMOBILIZADO" },
  { codigo: "2.3.1", nome: "Softwares", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "INTANGIVEL" },
  { codigo: "2.3.2", nome: "Marcas e Patentes", tipo: "ATIVO", natureza: "DEVEDORA", grupo: "INTANGIVEL" },
  // Passivo
  { codigo: "3.0.1", nome: "Fornecedores", tipo: "PASSIVO", natureza: "CREDORA", grupo: "CIRCULANTE" },
  { codigo: "3.0.2", nome: "Salários a Pagar", tipo: "PASSIVO", natureza: "CREDORA", grupo: "CIRCULANTE" },
  { codigo: "3.0.3", nome: "Impostos a Recolher", tipo: "PASSIVO", natureza: "CREDORA", grupo: "CIRCULANTE" },
  { codigo: "3.0.4", nome: "Empréstimos Bancários CP", tipo: "PASSIVO", natureza: "CREDORA", grupo: "CIRCULANTE" },
  { codigo: "3.0.5", nome: "Contas a Pagar", tipo: "PASSIVO", natureza: "CREDORA", grupo: "CIRCULANTE" },
  { codigo: "3.1.1", nome: "Empréstimos Bancários LP", tipo: "PASSIVO", natureza: "CREDORA", grupo: "NAO_CIRCULANTE" },
  { codigo: "3.1.2", nome: "Provisões Trabalhistas", tipo: "PASSIVO", natureza: "CREDORA", grupo: "NAO_CIRCULANTE" },
  { codigo: "3.1.3", nome: "Contas a Pagar LP", tipo: "PASSIVO", natureza: "CREDORA", grupo: "NAO_CIRCULANTE" },
  // Patrimônio líquido
  { codigo: "4.0.1", nome: "Capital Social", tipo: "PATRIMONIO_LIQUIDO", natureza: "CREDORA", grupo: "PATRIMONIO_LIQUIDO" },
  { codigo: "4.0.2", nome: "Reservas de Lucros", tipo: "PATRIMONIO_LIQUIDO", natureza: "CREDORA", grupo: "PATRIMONIO_LIQUIDO" },
  { codigo: "4.0.3", nome: "Lucros Acumulados", tipo: "PATRIMONIO_LIQUIDO", natureza: "CREDORA", grupo: "PATRIMONIO_LIQUIDO" },
  // Custos e despesas
  { codigo: "5.0.1", nome: "CMV", tipo: "CUSTO", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.0.2", nome: "CPV", tipo: "CUSTO", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.0.3", nome: "CSP", tipo: "CUSTO", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.1.1", nome: "Despesa com Salários", tipo: "DESPESA", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.1.2", nome: "Despesa com Aluguel", tipo: "DESPESA", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.1.3", nome: "Despesa com Energia Elétrica", tipo: "DESPESA", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.1.4", nome: "Despesa Financeira", tipo: "DESPESA", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.1.5", nome: "Despesa com Material de Escritório", tipo: "DESPESA", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.2.1", nome: "Despesa com Depreciação", tipo: "DESPESA", natureza: "DEVEDORA", grupo: "RESULTADO" },
  { codigo: "5.3.0", nome: "Despesa com IRPJ", tipo: "DESPESA", natureza: "DEVEDORA", grupo: "RESULTADO" },
  // Receitas
  { codigo: "6.0.1", nome: "Receita de Vendas", tipo: "RECEITA", natureza: "CREDORA", grupo: "RESULTADO" },
  { codigo: "6.0.2", nome: "Receita de Serviços", tipo: "RECEITA", natureza: "CREDORA", grupo: "RESULTADO" },
  { codigo: "6.0.3", nome: "Receita Financeira", tipo: "RECEITA", natureza: "CREDORA", grupo: "RESULTADO" },
  // Apuração
  { codigo: "7.0.1", nome: "Resultado do Exercício", tipo: "APURACAO", natureza: "CREDORA", grupo: "APURACAO" },
];

export const CONTAS: Conta[] = CONTAS_BASE.map((base) => ({
  id: idConta(base.codigo),
  codigo: base.codigo,
  nome: base.nome,
  tipo: base.tipo,
  natureza: base.natureza,
  grupo: base.grupo,
  analitica: true,
  ativa: true,
  padrao: base.padrao ?? true,
}));

export const PRODUTOS: Produto[] = [
  {
    id: "prod-mer-001",
    nome: "Mercadoria para Revenda",
    sku: "MER-001",
    unidade: "UN",
    estoqueMinimo: 5,
    ativo: true,
  },
  {
    id: "prod-can-002",
    nome: "Caneca Personalizada",
    sku: "CAN-002",
    unidade: "UN",
    estoqueMinimo: 10,
    ativo: true,
  },
];

const SALDOS_INICIAIS: SaldoInicial[] = [
  { contaId: CONTA.caixa, debitoCents: 5_000_000, creditoCents: 0 },
  { contaId: CONTA.capital, debitoCents: 0, creditoCents: 5_000_000 },
];

function parcela(
  numero: number,
  vencimento: string,
  valorCents: number,
  contaId: string,
  tipo: "CP" | "LP",
) {
  return { numero, vencimento, valorCents, contaId, tipo };
}

const COMPRA_TOTAL = 1_400_000;
const COMPRA_PARCELAS = 14;
const COMPRA_VALOR_PARCELA = COMPRA_TOTAL / COMPRA_PARCELAS;

const parcelasCompra = Array.from({ length: COMPRA_PARCELAS }, (_, indice) => {
  const numero = indice + 1;
  const tipo = numero <= 12 ? ("CP" as const) : ("LP" as const);
  return parcela(
    numero,
    adicionarMeses("2026-10-05", numero),
    COMPRA_VALOR_PARCELA,
    tipo === "CP" ? CONTA.fornecedores : CONTA.contasPagarLP,
    tipo,
  );
});

const OPERACOES: Operacao[] = [
  {
    id: "op-2026-000001",
    numero: "OP-2026-000001",
    data: "2026-01-02",
    historico: "Integralização do capital social inicial",
    tipo: "SALDO_INICIAL",
    status: "ATIVA",
    usuario: "Marina Alves",
    criadoEm: "2026-01-02T09:15:00.000Z",
    linhas: [
      { id: "lin-0001-1", contaId: CONTA.caixa, tipo: "DEBITO", valorCents: 5_000_000 },
      { id: "lin-0001-2", contaId: CONTA.capital, tipo: "CREDITO", valorCents: 5_000_000 },
    ],
  },
  {
    id: "op-2026-000002",
    numero: "OP-2026-000002",
    data: "2026-10-05",
    historico: "Compra de mercadoria em 14x — 10 unidades a R$ 1.400,00",
    tipo: "COMPRA",
    status: "ATIVA",
    usuario: "Marina Alves",
    criadoEm: "2026-10-05T10:32:00.000Z",
    linhas: [
      { id: "lin-0002-1", contaId: CONTA.estoques, tipo: "DEBITO", valorCents: 1_400_000 },
      { id: "lin-0002-2", contaId: CONTA.fornecedores, tipo: "CREDITO", valorCents: 1_200_000 },
      { id: "lin-0002-3", contaId: CONTA.contasPagarLP, tipo: "CREDITO", valorCents: 200_000 },
    ],
    documento: {
      tipo: "COMPRA",
      numero: "COMPRA-2026-0001",
      parceiro: "Distribuidora Central Ltda.",
      condicao: "PRAZO",
      parcelas: parcelasCompra,
      itens: [
        {
          produtoId: "prod-mer-001",
          descricao: "Mercadoria para Revenda",
          quantidade: 10,
          valorUnitarioCents: 140_000,
          custoUnitarioCents: 140_000,
        },
      ],
    },
  },
  {
    id: "op-2026-000003",
    numero: "OP-2026-000003",
    data: "2026-10-15",
    historico: "Venda de 5 unidades a R$ 2.000,00 — à vista",
    tipo: "VENDA",
    status: "ATIVA",
    usuario: "Rafael Souza",
    criadoEm: "2026-10-15T16:05:00.000Z",
    linhas: [
      { id: "lin-0003-1", contaId: CONTA.caixa, tipo: "DEBITO", valorCents: 1_000_000 },
      { id: "lin-0003-2", contaId: CONTA.receitaVendas, tipo: "CREDITO", valorCents: 1_000_000 },
      { id: "lin-0003-3", contaId: CONTA.cmv, tipo: "DEBITO", valorCents: 700_000 },
      { id: "lin-0003-4", contaId: CONTA.estoques, tipo: "CREDITO", valorCents: 700_000 },
    ],
    documento: {
      tipo: "VENDA",
      numero: "VENDA-2026-0001",
      parceiro: "Cliente Balcão",
      condicao: "AVISTA",
      itens: [
        {
          produtoId: "prod-mer-001",
          descricao: "Mercadoria para Revenda",
          quantidade: 5,
          valorUnitarioCents: 200_000,
          custoUnitarioCents: 140_000,
        },
      ],
    },
  },
  {
    id: "op-2026-000004",
    numero: "OP-2026-000004",
    data: "2026-10-31",
    historico: "Pagamento do aluguel de outubro/2026",
    tipo: "MANUAL",
    status: "ATIVA",
    usuario: "Camila Nunes",
    criadoEm: "2026-10-31T11:20:00.000Z",
    linhas: [
      { id: "lin-0004-1", contaId: CONTA.aluguel, tipo: "DEBITO", valorCents: 100_000 },
      { id: "lin-0004-2", contaId: CONTA.caixa, tipo: "CREDITO", valorCents: 100_000 },
    ],
  },
  {
    id: "op-2026-000005",
    numero: "OP-2026-000005",
    data: "2026-11-03",
    historico: "Compra de material de escritório",
    tipo: "MANUAL",
    status: "ESTORNADA",
    usuario: "Camila Nunes",
    criadoEm: "2026-11-03T09:40:00.000Z",
    linhas: [
      { id: "lin-0005-1", contaId: CONTA.material, tipo: "DEBITO", valorCents: 50_000 },
      { id: "lin-0005-2", contaId: CONTA.caixa, tipo: "CREDITO", valorCents: 50_000 },
    ],
  },
  {
    id: "op-2026-000006",
    numero: "OP-2026-000006",
    data: "2026-11-03",
    historico: "Estorno: compra de material lançada em duplicidade",
    tipo: "ESTORNO",
    status: "ATIVA",
    usuario: "Marina Alves",
    criadoEm: "2026-11-03T14:12:00.000Z",
    reversalOfId: "op-2026-000005",
    motivoEstorno: "Lançamento em duplicidade — nota fiscal cancelada.",
    linhas: [
      { id: "lin-0006-1", contaId: CONTA.caixa, tipo: "DEBITO", valorCents: 50_000 },
      { id: "lin-0006-2", contaId: CONTA.material, tipo: "CREDITO", valorCents: 50_000 },
    ],
  },
];

const MOVIMENTOS_ESTOQUE: MovimentoEstoque[] = [
  {
    id: "mov-0001",
    produtoId: "prod-mer-001",
    tipo: "ENTRADA",
    quantidade: 10,
    custoUnitarioCents: 140_000,
    data: "2026-10-05",
    operacaoId: "op-2026-000002",
    observacao: "Entrada pela compra OP-2026-000002",
  },
  {
    id: "mov-0002",
    produtoId: "prod-mer-001",
    tipo: "SAIDA",
    quantidade: 5,
    custoUnitarioCents: 140_000,
    data: "2026-10-15",
    operacaoId: "op-2026-000003",
    observacao: "Saída pela venda OP-2026-000003",
  },
];

const OBRIGACOES: Obrigacao[] = [
  {
    id: "obr-0001",
    nome: "DAS — Simples Nacional",
    competencia: "2026-10",
    vencimento: "2026-11-20",
    valorCents: 0,
    status: "PENDENTE",
    observacao: "Valor a apurar com o contador.",
  },
  {
    id: "obr-0002",
    nome: "INSS / FGTS sobre a folha",
    competencia: "2026-10",
    vencimento: "2026-11-07",
    valorCents: 0,
    status: "PENDENTE",
    observacao: "Conferir a folha de outubro.",
  },
  {
    id: "obr-0003",
    nome: "PIS / COFINS",
    competencia: "2026-10",
    vencimento: "2026-11-25",
    valorCents: 0,
    status: "PENDENTE",
  },
  {
    id: "obr-0004",
    nome: "ICMS — apuração de setembro",
    competencia: "2026-09",
    vencimento: "2026-10-20",
    valorCents: 0,
    status: "ATRASADA",
    observacao: "Regularizar junto à SEFAZ.",
  },
  {
    id: "obr-0005",
    nome: "IRPJ — 3º trimestre",
    competencia: "2026-09-30",
    vencimento: "2026-10-31",
    valorCents: 0,
    status: "PAGA",
  },
  {
    id: "obr-0006",
    nome: "CSLL — 3º trimestre",
    competencia: "2026-09-30",
    vencimento: "2026-10-31",
    valorCents: 0,
    status: "PAGA",
  },
  {
    id: "obr-0007",
    nome: "DCTFWeb",
    competencia: "2026-10",
    vencimento: "2026-11-15",
    valorCents: 0,
    status: "PENDENTE",
  },
  {
    id: "obr-0008",
    nome: "Folha de pagamento",
    competencia: "2026-10",
    vencimento: "2026-11-05",
    valorCents: 0,
    status: "PENDENTE",
    observacao: "Pagamento previsto para hoje.",
  },
];

function auditoriaDeOperacao(operacao: Operacao): Auditoria {
  return {
    id: `aud-${operacao.id}`,
    data: operacao.criadoEm,
    usuario: operacao.usuario,
    acao: operacao.tipo === "ESTORNO" ? "ESTORNAR" : "CRIAR",
    entidade: "Operação",
    entidadeId: operacao.id,
    detalhe:
      operacao.tipo === "ESTORNO"
        ? `${operacao.numero} — estorno de ${operacao.reversalOfId} — ${operacao.motivoEstorno ?? ""}`
        : `${operacao.numero} — ${operacao.historico}`,
    depois: `${operacao.tipo} · ${operacao.status}`,
  };
}

const AUDITORIA: Auditoria[] = [
  {
    id: "aud-0001",
    data: "2026-01-02T08:00:00.000Z",
    usuario: "Marina Alves",
    acao: "CRIAR",
    entidade: "Empresa",
    entidadeId: "empresa-ll",
    detalhe: "Empresa LL Comércio de Materiais Ltda. criada com CNPJ 11.222.333/0001-81.",
    depois: "LTDA · Simples Nacional",
  },
  {
    id: "aud-0002",
    data: "2026-01-02T08:10:00.000Z",
    usuario: "Marina Alves",
    acao: "CRIAR",
    entidade: "Plano de Contas",
    entidadeId: "plano-padrao",
    detalhe: "Plano de contas padrão carregado (40 contas) + 1 conta personalizada.",
    depois: "41 contas ativas",
  },
  {
    id: "aud-0003",
    data: "2026-01-02T09:15:00.000Z",
    usuario: "Marina Alves",
    acao: "CRIAR",
    entidade: "Saldo Inicial",
    entidadeId: "op-2026-000001",
    detalhe: "Saldo inicial de R$ 50.000,00 — Caixa × Capital Social.",
    depois: "Balanceado",
  },
  ...OPERACOES.map(auditoriaDeOperacao),
  {
    id: "aud-login-0",
    data: "2026-11-05T11:40:00.000Z",
    usuario: "Marina Alves",
    acao: "LOGIN",
    entidade: "Sessão",
    entidadeId: "ses-marina",
    detalhe: "Acesso ao sistema.",
  },
];

export function criarEstadoInicial(): EstadoMock {
  return structuredClone({
    versao: 1,
    empresa: {
      id: "empresa-ll",
      razaoSocial: "LL Comércio de Materiais Ltda.",
      nomeFantasia: "LL Finance Demo",
      cnpj: "11.222.333/0001-81",
      natureza: "LTDA",
      regime: "Simples Nacional",
      endereco: "Av. Paulista, 1000 — Sala 12",
      cidade: "São Paulo",
      uf: "SP",
      capitalSocialCents: 5_000_000,
      abertura: "2020-03-12",
      exercicioInicio: "2026-01-01",
      exercicioFim: "2026-12-31",
    },
    usuarios: [
      {
        id: "user-marina",
        nome: "Marina Alves",
        email: "marina@llfinance.com.br",
        papel: "ADMIN",
        ativo: true,
        ultimoAcesso: "2026-11-05T11:40:00.000Z",
      },
      {
        id: "user-rafael",
        nome: "Rafael Souza",
        email: "rafael@llfinance.com.br",
        papel: "CONTADOR",
        ativo: true,
        ultimoAcesso: "2026-11-05T08:15:00.000Z",
      },
      {
        id: "user-camila",
        nome: "Camila Nunes",
        email: "camila@llfinance.com.br",
        papel: "AUXILIAR",
        ativo: true,
        ultimoAcesso: "2026-11-04T17:22:00.000Z",
      },
      {
        id: "user-paulo",
        nome: "Paulo Lima",
        email: "paulo@llfinance.com.br",
        papel: "CONSULTA",
        ativo: true,
        ultimoAcesso: "2026-11-03T09:05:00.000Z",
      },
    ],
    usuarioAtualId: "user-marina",
    contas: CONTAS,
    saldosIniciais: SALDOS_INICIAIS,
    operacoes: OPERACOES,
    produtos: PRODUTOS,
    movimentosEstoque: MOVIMENTOS_ESTOQUE,
    obrigacoes: OBRIGACOES,
    auditoria: AUDITORIA,
    periodo: {
      exercicio: "2026",
      inicio: "2026-01-01",
      fim: "2026-12-31",
      status: "ABERTO",
    },
    configuracoes: {
      bloquearEstoqueNegativo: true,
    },
  } as EstadoMock);
}
