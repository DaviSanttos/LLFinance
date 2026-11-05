import type {
  Balanco,
  Conta,
  Dre,
  EstoqueCalculado,
  GrupoBalanco,
  LinhaBalancete,
  LinhaBalanco,
  LinhaDre,
  LinhaRazao,
  MovimentoEstoque,
  Operacao,
  Periodo,
  Produto,
  RazaoConta,
  SaldoConta,
  TipoLinha,
  TipoOperacao,
} from "./types";

export interface FiltroPeriodo {
  inicio?: string;
  fim?: string;
}

export interface EntradaOperacao {
  data: string;
  historico: string;
  tipo: TipoOperacao;
  linhas: Array<{ contaId: string; tipo: TipoLinha; valorCents: number }>;
}

export interface ResultadoValidacao {
  ok: boolean;
  erro?: string;
}

export interface ResumoBalancete {
  totalDebitosCents: number;
  totalCreditosCents: number;
  totalSaldosDevedoresCents: number;
  totalSaldosCredoresCents: number;
  fecha: boolean;
}

interface Acumulado {
  debitosCents: number;
  creditosCents: number;
}

const TIPOS_RESULTADO_EXCLUIDOS: TipoOperacao[] = ["SALDO_INICIAL", "APURACAO"];

export function inPeriodo(data: string, filtro?: FiltroPeriodo): boolean {
  if (!data) return false;
  const dia = data.slice(0, 10);
  if (filtro?.inicio && dia < filtro.inicio) return false;
  if (filtro?.fim && dia > filtro.fim) return false;
  return true;
}

export function antesDoPeriodo(data: string, filtro?: FiltroPeriodo): boolean {
  if (!filtro?.inicio) return false;
  return data.slice(0, 10) < filtro.inicio;
}

/** Saldo pela natureza da conta: devedora => D - C; credora => C - D. */
export function saldoNatural(conta: Conta, debitosCents: number, creditosCents: number): number {
  return conta.natureza === "DEVEDORA"
    ? debitosCents - creditosCents
    : creditosCents - debitosCents;
}

/** Lado do saldo real (D ou C), considerando o sinal. */
export function ladoSaldo(conta: Conta, saldoCents: number): "D" | "C" {
  if (saldoCents === 0) return conta.natureza === "DEVEDORA" ? "D" : "C";
  const positivo = saldoCents > 0;
  if (conta.natureza === "DEVEDORA") return positivo ? "D" : "C";
  return positivo ? "C" : "D";
}

function acumular(
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
  ignorarTipos: TipoOperacao[] = [],
): Map<string, Acumulado> {
  const mapa = new Map<string, Acumulado>();
  for (const operacao of operacoes) {
    if (!inPeriodo(operacao.data, filtro)) continue;
    if (ignorarTipos.includes(operacao.tipo)) continue;
    for (const linha of operacao.linhas) {
      const atual = mapa.get(linha.contaId) ?? { debitosCents: 0, creditosCents: 0 };
      if (linha.tipo === "DEBITO") atual.debitosCents += linha.valorCents;
      else atual.creditosCents += linha.valorCents;
      mapa.set(linha.contaId, atual);
    }
  }
  return mapa;
}

/**
 * Saldos de todas as contas no período.
 * `saldoAnteriorCents` considera tudo que aconteceu antes de `filtro.inicio`;
 * `debitosCents` / `creditosCents` são apenas do período;
 * `saldoAtualCents` é o saldo acumulado (anterior + período) pela natureza.
 */
export function calcularSaldos(
  contas: Conta[],
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
): SaldoConta[] {
  const anteriores = filtro?.inicio
    ? acumular(
        operacoes.filter((op) => antesDoPeriodo(op.data, filtro)),
        undefined,
      )
    : new Map<string, Acumulado>();
  const periodo = acumular(operacoes, filtro);

  return contas.map((conta) => {
    const ant = anteriores.get(conta.id) ?? { debitosCents: 0, creditosCents: 0 };
    const at = periodo.get(conta.id) ?? { debitosCents: 0, creditosCents: 0 };
    const saldoAnteriorCents = saldoNatural(conta, ant.debitosCents, ant.creditosCents);
    const saldoAtualCents =
      saldoAnteriorCents + saldoNatural(conta, at.debitosCents, at.creditosCents);
    return {
      conta,
      saldoAnteriorCents,
      debitosCents: at.debitosCents,
      creditosCents: at.creditosCents,
      saldoAtualCents,
    };
  });
}

export function gerarBalancete(
  contas: Conta[],
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
): LinhaBalancete[] {
  return calcularSaldos(contas, operacoes, filtro)
    .filter(
      (linha) =>
        linha.saldoAnteriorCents !== 0 ||
        linha.debitosCents !== 0 ||
        linha.creditosCents !== 0 ||
        linha.saldoAtualCents !== 0,
    )
    .map((linha) => ({
      ...linha,
      lado: ladoSaldo(linha.conta, linha.saldoAtualCents),
      saldoNormalCents: Math.abs(linha.saldoAtualCents),
    }))
    .sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo, "pt-BR"));
}

export function resumoBalancete(linhas: LinhaBalancete[]): ResumoBalancete {
  let totalDebitosCents = 0;
  let totalCreditosCents = 0;
  let totalSaldosDevedoresCents = 0;
  let totalSaldosCredoresCents = 0;
  for (const linha of linhas) {
    totalDebitosCents += linha.debitosCents;
    totalCreditosCents += linha.creditosCents;
    if (linha.saldoAtualCents === 0) continue;
    if (linha.lado === "D") totalSaldosDevedoresCents += Math.abs(linha.saldoAtualCents);
    else totalSaldosCredoresCents += Math.abs(linha.saldoAtualCents);
  }
  return {
    totalDebitosCents,
    totalCreditosCents,
    totalSaldosDevedoresCents,
    totalSaldosCredoresCents,
    fecha:
      totalDebitosCents === totalCreditosCents &&
      totalSaldosDevedoresCents === totalSaldosCredoresCents,
  };
}

export function gerarRazao(
  conta: Conta,
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
): RazaoConta {
  const anteriores = filtro?.inicio
    ? acumular(
        operacoes.filter((op) => antesDoPeriodo(op.data, filtro)),
        undefined,
      ).get(conta.id)
    : undefined;
  const saldoAnteriorCents = anteriores
    ? saldoNatural(conta, anteriores.debitosCents, anteriores.creditosCents)
    : 0;

  const ordenadas = [...operacoes]
    .filter((op) => inPeriodo(op.data, filtro))
    .sort((a, b) => {
      const porData = a.data.localeCompare(b.data);
      if (porData !== 0) return porData;
      return a.numero.localeCompare(b.numero);
    });

  let saldo = saldoAnteriorCents;
  const movimentos: LinhaRazao[] = [];
  for (const operacao of ordenadas) {
    for (const linha of operacao.linhas) {
      if (linha.contaId !== conta.id) continue;
      const debito = linha.tipo === "DEBITO" ? linha.valorCents : 0;
      const credito = linha.tipo === "CREDITO" ? linha.valorCents : 0;
      saldo += conta.natureza === "DEVEDORA" ? debito - credito : credito - debito;
      movimentos.push({
        data: operacao.data,
        operacaoId: operacao.id,
        numero: operacao.numero,
        historico: operacao.historico,
        debitoCents: debito,
        creditoCents: credito,
        saldoCents: saldo,
        status: operacao.status,
      });
    }
  }

  return { conta, saldoAnteriorCents, movimentos, saldoFinalCents: saldo };
}

/**
 * DRE no layout do professor.
 * Ignora SALDO_INICIAL e APURACAO para continuar correta depois do fechamento.
 */
export function gerarDre(
  contas: Conta[],
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
): Dre {
  const acumulado = acumular(operacoes, filtro, TIPOS_RESULTADO_EXCLUIDOS);

  const montar = (tipos: Conta["tipo"][]): LinhaDre[] =>
    contas
      .filter((conta) => tipos.includes(conta.tipo))
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR"))
      .map((conta) => {
        const mov = acumulado.get(conta.id) ?? { debitosCents: 0, creditosCents: 0 };
        const valorCents =
          conta.tipo === "RECEITA"
            ? mov.creditosCents - mov.debitosCents
            : mov.debitosCents - mov.creditosCents;
        return { conta, valorCents };
      });

  const receitas = montar(["RECEITA"]);
  const despesas = montar(["DESPESA", "CUSTO"]);
  const totalReceitasCents = receitas.reduce((total, linha) => total + linha.valorCents, 0);
  const totalDespesasCents = despesas.reduce((total, linha) => total + linha.valorCents, 0);

  return {
    receitas,
    despesas,
    totalReceitasCents,
    totalDespesasCents,
    resultadoCents: totalReceitasCents - totalDespesasCents,
  };
}

const SUBGRUPOS_ATIVO: Record<string, string> = {
  CIRCULANTE: "Ativo Circulante",
  REALIZAVEL_LP: "Realizável a Longo Prazo",
  INVESTIMENTO: "Investimentos",
  IMOBILIZADO: "Imobilizado",
  INTANGIVEL: "Intangível",
  NAO_CIRCULANTE: "Ativo Não Circulante",
};

const SUBGRUPOS_PASSIVO: Record<string, string> = {
  CIRCULANTE: "Passivo Circulante",
  NAO_CIRCULANTE: "Passivo Não Circulante",
};

function montarGrupo(
  titulo: string,
  contas: Conta[],
  operacoes: Operacao[],
  lado: "ATIVO" | "PASSIVO" | "PL",
  mapaSubgrupos?: Record<string, string>,
): GrupoBalanco {
  const linhas: LinhaBalanco[] = [];
  for (const conta of contas) {
    let debitos = 0;
    let creditos = 0;
    for (const operacao of operacoes) {
      for (const linha of operacao.linhas) {
        if (linha.contaId !== conta.id) continue;
        if (linha.tipo === "DEBITO") debitos += linha.valorCents;
        else creditos += linha.valorCents;
      }
    }
    const valorCents =
      lado === "ATIVO" ? debitos - creditos : creditos - debitos;
    if (valorCents === 0) continue;
    linhas.push({
      conta,
      valorCents,
      subgrupo: mapaSubgrupos?.[conta.grupo] ?? conta.grupo,
    });
  }
  linhas.sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo, "pt-BR"));
  return {
    titulo,
    linhas,
    totalCents: linhas.reduce((total, linha) => total + linha.valorCents, 0),
  };
}

export function gerarBalanco(
  contas: Conta[],
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
): Balanco {
  const noPeriodo = operacoes.filter((op) => inPeriodo(op.data, filtro));

  const ativoCirculante = montarGrupo(
    "Ativo Circulante",
    contas.filter((c) => c.tipo === "ATIVO" && c.grupo === "CIRCULANTE"),
    noPeriodo,
    "ATIVO",
    SUBGRUPOS_ATIVO,
  );
  const ativoNaoCirculante = montarGrupo(
    "Ativo Não Circulante",
    contas.filter(
      (c) =>
        c.tipo === "ATIVO" &&
        c.grupo !== "CIRCULANTE" &&
        ["REALIZAVEL_LP", "INVESTIMENTO", "IMOBILIZADO", "INTANGIVEL", "NAO_CIRCULANTE"].includes(
          c.grupo,
        ),
    ),
    noPeriodo,
    "ATIVO",
    SUBGRUPOS_ATIVO,
  );

  const passivoCirculante = montarGrupo(
    "Passivo Circulante",
    contas.filter((c) => c.tipo === "PASSIVO" && c.grupo === "CIRCULANTE"),
    noPeriodo,
    "PASSIVO",
    SUBGRUPOS_PASSIVO,
  );
  const passivoNaoCirculante = montarGrupo(
    "Passivo Não Circulante",
    contas.filter((c) => c.tipo === "PASSIVO" && c.grupo !== "CIRCULANTE"),
    noPeriodo,
    "PASSIVO",
    SUBGRUPOS_PASSIVO,
  );
  const patrimonioLiquido = montarGrupo(
    "Patrimônio Líquido",
    contas.filter((c) => c.tipo === "PATRIMONIO_LIQUIDO"),
    noPeriodo,
    "PL",
  );

  // Resultado que ainda está nas contas 5.x/6.x (antes da apuração).
  // Depois da apuração esses saldos são zerados, então isso vira 0 naturalmente.
  const resultadoPendenteCents = contas.reduce((total, conta) => {
    let debitos = 0;
    let creditos = 0;
    for (const operacao of noPeriodo) {
      for (const linha of operacao.linhas) {
        if (linha.contaId !== conta.id) continue;
        if (linha.tipo === "DEBITO") debitos += linha.valorCents;
        else creditos += linha.valorCents;
      }
    }
    if (conta.tipo === "RECEITA") return total + (creditos - debitos);
    if (conta.tipo === "DESPESA" || conta.tipo === "CUSTO") return total + (debitos - creditos);
    return total;
  }, 0);

  if (resultadoPendenteCents !== 0) {
    const contaResultado: Conta = {
      id: "conta-resultado-pendente",
      codigo: "7.0.1",
      nome: "Resultado do Exercício (a apurar)",
      tipo: "APURACAO",
      natureza: "CREDORA",
      grupo: "APURACAO",
      analitica: true,
      ativa: true,
      padrao: true,
    };
    patrimonioLiquido.linhas.push({
      conta: contaResultado,
      valorCents: resultadoPendenteCents,
      subgrupo: "Patrimônio Líquido",
    });
    patrimonioLiquido.totalCents += resultadoPendenteCents;
  }

  const totalAtivoCents = ativoCirculante.totalCents + ativoNaoCirculante.totalCents;
  const totalPassivoCents = passivoCirculante.totalCents + passivoNaoCirculante.totalCents;
  const totalPatrimonioCents = patrimonioLiquido.totalCents;
  const totalPassivoPlCents = totalPassivoCents + totalPatrimonioCents;

  return {
    ativoCirculante,
    ativoNaoCirculante,
    passivoCirculante,
    passivoNaoCirculante,
    patrimonioLiquido,
    totalAtivoCents,
    totalPassivoCents,
    totalPatrimonioCents,
    totalPassivoPlCents,
    resultadoPendenteCents,
    equilibrado: totalAtivoCents === totalPassivoPlCents,
  };
}

export function calcularEstoque(
  produtos: Produto[],
  movimentos: MovimentoEstoque[],
): EstoqueCalculado[] {
  return produtos.map((produto) => {
    const movs = movimentos
      .filter((mov) => mov.produtoId === produto.id)
      .sort((a, b) => {
        const porData = a.data.localeCompare(b.data);
        return porData !== 0 ? porData : a.id.localeCompare(b.id);
      });

    let quantidade = 0;
    let valorCents = 0;
    let cmvTotalCents = 0;

    for (const mov of movs) {
      const qtd = Math.abs(mov.quantidade);
      const entrada =
        mov.tipo === "ENTRADA" || (mov.tipo === "AJUSTE" && mov.quantidade > 0);
      if (entrada) {
        valorCents += qtd * mov.custoUnitarioCents;
        quantidade += qtd;
      } else {
        const custoMedio = quantidade > 0 ? valorCents / quantidade : mov.custoUnitarioCents;
        cmvTotalCents += qtd * custoMedio;
        valorCents -= qtd * custoMedio;
        quantidade -= qtd;
      }
    }

    const ultimo = movs.at(-1);
    const custoMedioCents = quantidade > 0 ? Math.round(valorCents / quantidade) : 0;

    return {
      produto,
      quantidade,
      custoMedioCents,
      valorTotalCents: Math.round(valorCents),
      cmvTotalCents: Math.round(cmvTotalCents),
      ultimaMovimentacao: ultimo?.data,
    };
  });
}

export function custoMedioAtual(
  produtoId: string,
  produtos: Produto[],
  movimentos: MovimentoEstoque[],
): { quantidade: number; custoMedioCents: number; valorTotalCents: number } {
  const calculado = calcularEstoque(produtos, movimentos).find(
    (item) => item.produto.id === produtoId,
  );
  return {
    quantidade: calculado?.quantidade ?? 0,
    custoMedioCents: calculado?.custoMedioCents ?? 0,
    valorTotalCents: calculado?.valorTotalCents ?? 0,
  };
}

export function proximoNumeroOperacao(operacoes: Operacao[], exercicio: string): string {
  let maior = 0;
  for (const operacao of operacoes) {
    const partes = operacao.numero.split("-");
    const sequencial = Number(partes.at(-1));
    if (Number.isFinite(sequencial) && sequencial > maior) maior = sequencial;
  }
  return `OP-${exercicio}-${String(maior + 1).padStart(6, "0")}`;
}

export function validarOperacao(
  entrada: EntradaOperacao,
  contas: Conta[],
  operacoes: Operacao[],
  periodo: Periodo,
): ResultadoValidacao {
  if (!entrada.historico?.trim()) {
    return { ok: false, erro: "Informe o histórico do lançamento." };
  }
  if (!entrada.data) {
    return { ok: false, erro: "Informe a data do lançamento." };
  }
  if (entrada.data < periodo.inicio || entrada.data > periodo.fim) {
    return {
      ok: false,
      erro: `A data precisa estar dentro do exercício (${periodo.inicio} a ${periodo.fim}).`,
    };
  }
  if (periodo.status === "FECHADO") {
    return { ok: false, erro: "O exercício está fechado. Reabra o período para lançar." };
  }
  if (!entrada.linhas || entrada.linhas.length < 2) {
    return { ok: false, erro: "O lançamento precisa ter pelo menos duas linhas." };
  }

  const mapa = new Map(contas.map((conta) => [conta.id, conta]));
  let debitos = 0;
  let creditos = 0;
  let temDebito = false;
  let temCredito = false;

  for (const linha of entrada.linhas) {
    const conta = mapa.get(linha.contaId);
    if (!conta) return { ok: false, erro: "Há uma linha com conta inexistente." };
    if (!conta.analitica) {
      return { ok: false, erro: `A conta ${conta.codigo} é sintética e não recebe lançamento.` };
    }
    if (!conta.ativa) {
      return { ok: false, erro: `A conta ${conta.codigo} está inativa.` };
    }
    if (!Number.isInteger(linha.valorCents) || linha.valorCents <= 0) {
      return { ok: false, erro: `Informe um valor maior que zero na conta ${conta.codigo}.` };
    }
    if (linha.tipo === "DEBITO") {
      debitos += linha.valorCents;
      temDebito = true;
    } else {
      creditos += linha.valorCents;
      temCredito = true;
    }
  }

  if (!temDebito || !temCredito) {
    return { ok: false, erro: "O lançamento precisa ter pelo menos um débito e um crédito." };
  }
  if (debitos !== creditos) {
    const diferenca = Math.abs(debitos - creditos);
    return {
      ok: false,
      erro: `O lançamento não fecha: débitos e créditos diferem em ${(diferenca / 100).toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" },
      )}.`,
    };
  }

  return { ok: true };
}

export function totalOperacao(operacao: Operacao): number {
  return operacao.linhas
    .filter((linha) => linha.tipo === "DEBITO")
    .reduce((total, linha) => total + linha.valorCents, 0);
}

/** Valor "de face" da operação: usa o documento quando existe, senão o total de débitos. */
export function valorOperacao(operacao: Operacao): number {
  if (operacao.documento?.itens?.length) {
    return operacao.documento.itens.reduce(
      (total, item) => total + item.quantidade * item.valorUnitarioCents,
      0,
    );
  }
  if (operacao.documento?.parcelas?.length) {
    return operacao.documento.parcelas.reduce((total, parcela) => total + parcela.valorCents, 0);
  }
  return totalOperacao(operacao);
}

export function contasUsadas(operacoes: Operacao[]): string[] {
  const ids = new Set<string>();
  for (const operacao of operacoes) {
    for (const linha of operacao.linhas) ids.add(linha.contaId);
  }
  return [...ids];
}

export interface SerieMensal {
  mes: string;
  receitasCents: number;
  despesasCents: number;
  resultadoCents: number;
}

export function serieMensal(
  contas: Conta[],
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
): SerieMensal[] {
  const mapaContas = new Map(contas.map((conta) => [conta.id, conta]));
  const mapa = new Map<string, { receitasCents: number; despesasCents: number }>();

  for (const operacao of operacoes) {
    if (!inPeriodo(operacao.data, filtro)) continue;
    if (TIPOS_RESULTADO_EXCLUIDOS.includes(operacao.tipo)) continue;
    const mes = operacao.data.slice(0, 7);
    const atual = mapa.get(mes) ?? { receitasCents: 0, despesasCents: 0 };
    for (const linha of operacao.linhas) {
      const conta = mapaContas.get(linha.contaId);
      if (!conta) continue;
      if (conta.tipo === "RECEITA") {
        atual.receitasCents +=
          linha.tipo === "CREDITO" ? linha.valorCents : -linha.valorCents;
      } else if (conta.tipo === "DESPESA" || conta.tipo === "CUSTO") {
        atual.despesasCents +=
          linha.tipo === "DEBITO" ? linha.valorCents : -linha.valorCents;
      }
    }
    mapa.set(mes, atual);
  }

  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valores]) => ({
      mes,
      ...valores,
      resultadoCents: valores.receitasCents - valores.despesasCents,
    }));
}

export function contasComSaldo(
  contas: Conta[],
  operacoes: Operacao[],
  filtro?: FiltroPeriodo,
): SaldoConta[] {
  return calcularSaldos(contas, operacoes, filtro).filter(
    (linha) => linha.saldoAtualCents !== 0,
  );
}

export function proximoVencimento(obrigacoes: Array<{ status: string; vencimento: string }>) {
  return obrigacoes
    .filter((item) => item.status !== "PAGA")
    .map((item) => item.vencimento)
    .sort()[0];
}
