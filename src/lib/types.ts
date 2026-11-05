export type TipoConta =
  | "ATIVO"
  | "PASSIVO"
  | "PATRIMONIO_LIQUIDO"
  | "RECEITA"
  | "DESPESA"
  | "CUSTO"
  | "APURACAO";

export type Natureza = "DEVEDORA" | "CREDORA";

export type GrupoConta =
  | "CIRCULANTE"
  | "NAO_CIRCULANTE"
  | "REALIZAVEL_LP"
  | "INVESTIMENTO"
  | "IMOBILIZADO"
  | "INTANGIVEL"
  | "PATRIMONIO_LIQUIDO"
  | "RESULTADO"
  | "APURACAO";

export type TipoOperacao =
  | "MANUAL"
  | "VENDA"
  | "COMPRA"
  | "SALDO_INICIAL"
  | "ESTORNO"
  | "APURACAO"
  | "AJUSTE_ESTOQUE";

export type StatusOperacao = "ATIVA" | "ESTORNADA" | "SUBSTITUIDA";

export type TipoLinha = "DEBITO" | "CREDITO";

export type Papel = "ADMIN" | "CONTADOR" | "AUXILIAR" | "CONSULTA";

export type StatusObrigacao = "PENDENTE" | "PAGA" | "ATRASADA";

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  natureza: string;
  regime: string;
  endereco: string;
  cidade: string;
  uf: string;
  capitalSocialCents: number;
  abertura: string;
  exercicioInicio: string;
  exercicioFim: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  ultimoAcesso: string;
}

export interface Conta {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: Natureza;
  grupo: GrupoConta;
  analitica: boolean;
  ativa: boolean;
  padrao: boolean;
  descricao?: string;
}

export interface SaldoInicial {
  contaId: string;
  debitoCents: number;
  creditoCents: number;
}

export interface LinhaLancamento {
  id: string;
  contaId: string;
  tipo: TipoLinha;
  valorCents: number;
}

export interface Parcela {
  numero: number;
  vencimento: string;
  valorCents: number;
  contaId: string;
  tipo: "CP" | "LP";
}

export interface Documento {
  tipo: "VENDA" | "COMPRA";
  numero: string;
  parceiro: string;
  condicao: "AVISTA" | "PRAZO";
  parcelas?: Parcela[];
  itens?: Array<{
    produtoId: string;
    descricao: string;
    quantidade: number;
    valorUnitarioCents: number;
    custoUnitarioCents: number;
  }>;
}

export interface Operacao {
  id: string;
  numero: string;
  data: string;
  historico: string;
  tipo: TipoOperacao;
  status: StatusOperacao;
  linhas: LinhaLancamento[];
  usuario: string;
  criadoEm: string;
  reversalOfId?: string;
  replacedById?: string;
  editedFromId?: string;
  motivoEstorno?: string;
  documento?: Documento;
}

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  unidade: string;
  estoqueMinimo: number;
  ativo: boolean;
}

export type TipoMovimentoEstoque = "ENTRADA" | "SAIDA" | "AJUSTE";

export interface MovimentoEstoque {
  id: string;
  produtoId: string;
  tipo: TipoMovimentoEstoque;
  quantidade: number;
  custoUnitarioCents: number;
  data: string;
  operacaoId?: string;
  observacao?: string;
}

export interface Obrigacao {
  id: string;
  nome: string;
  competencia: string;
  vencimento: string;
  valorCents: number;
  status: StatusObrigacao;
  observacao?: string;
}

export interface Auditoria {
  id: string;
  data: string;
  usuario: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhe: string;
  antes?: string;
  depois?: string;
}

export interface Periodo {
  exercicio: string;
  inicio: string;
  fim: string;
  status: "ABERTO" | "FECHADO";
}

export interface Configuracoes {
  bloquearEstoqueNegativo: boolean;
}

export interface EstadoMock {
  versao: number;
  empresa: Empresa;
  usuarios: Usuario[];
  usuarioAtualId: string;
  contas: Conta[];
  saldosIniciais: SaldoInicial[];
  operacoes: Operacao[];
  produtos: Produto[];
  movimentosEstoque: MovimentoEstoque[];
  obrigacoes: Obrigacao[];
  auditoria: Auditoria[];
  periodo: Periodo;
  configuracoes: Configuracoes;
}

export interface SaldoConta {
  conta: Conta;
  saldoAnteriorCents: number;
  debitosCents: number;
  creditosCents: number;
  saldoAtualCents: number;
}

export interface LinhaBalancete extends SaldoConta {
  lado: "D" | "C";
  saldoNormalCents: number;
}

export interface LinhaRazao {
  data: string;
  operacaoId: string;
  numero: string;
  historico: string;
  debitoCents: number;
  creditoCents: number;
  saldoCents: number;
  status: StatusOperacao;
}

export interface RazaoConta {
  conta: Conta;
  saldoAnteriorCents: number;
  movimentos: LinhaRazao[];
  saldoFinalCents: number;
}

export interface LinhaDre {
  conta: Conta;
  valorCents: number;
}

export interface Dre {
  receitas: LinhaDre[];
  despesas: LinhaDre[];
  totalReceitasCents: number;
  totalDespesasCents: number;
  resultadoCents: number;
}

export interface LinhaBalanco {
  conta: Conta;
  valorCents: number;
  subgrupo?: string;
}

export interface GrupoBalanco {
  titulo: string;
  linhas: LinhaBalanco[];
  totalCents: number;
}

export interface Balanco {
  ativoCirculante: GrupoBalanco;
  ativoNaoCirculante: GrupoBalanco;
  passivoCirculante: GrupoBalanco;
  passivoNaoCirculante: GrupoBalanco;
  patrimonioLiquido: GrupoBalanco;
  totalAtivoCents: number;
  totalPassivoCents: number;
  totalPatrimonioCents: number;
  totalPassivoPlCents: number;
  resultadoPendenteCents: number;
  equilibrado: boolean;
}

export interface EstoqueCalculado {
  produto: Produto;
  quantidade: number;
  custoMedioCents: number;
  valorTotalCents: number;
  cmvTotalCents: number;
  ultimaMovimentacao?: string;
}
