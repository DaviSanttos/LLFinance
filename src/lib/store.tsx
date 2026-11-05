"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  custoMedioAtual,
  gerarBalancete,
  gerarDre,
  proximoNumeroOperacao,
  resumoBalancete,
  validarOperacao,
  valorOperacao,
  type EntradaOperacao,
} from "./accounting";
import { CONTA, criarEstadoInicial } from "./mock-data";
import type {
  Auditoria,
  Configuracoes,
  Conta,
  Documento,
  Empresa,
  EstadoMock,
  GrupoConta,
  Natureza,
  Obrigacao,
  Operacao,
  Papel,
  Parcela,
  Produto,
  TipoConta,
  TipoLinha,
  TipoOperacao,
  Usuario,
} from "./types";
import {
  adicionarMeses,
  agoraISO,
  formatarMoeda,
  hojeISO,
  uid,
} from "./utils";

const CHAVE_STORAGE = "llfinance:mock:v1";
const VERSAO_ESTADO = 1;

export type TipoToast = "sucesso" | "erro" | "info" | "aviso";

export interface Toast {
  id: string;
  mensagem: string;
  tipo: TipoToast;
}

export interface ResultadoAcao<T = undefined> {
  ok: boolean;
  erro?: string;
  data?: T;
}

export interface NovaOperacaoInput {
  data: string;
  historico: string;
  tipo?: TipoOperacao;
  linhas: Array<{ contaId: string; tipo: TipoLinha; valorCents: number }>;
  documento?: Documento;
}

export interface VendaInput {
  data: string;
  modo: "MERCADORIA" | "SERVICO";
  condicao: "AVISTA" | "PRAZO";
  parceiro: string;
  produtoId?: string;
  quantidade?: number;
  valorUnitarioCents?: number;
  descricaoServico?: string;
}

export interface CompraInput {
  data: string;
  fornecedor: string;
  produtoId: string;
  quantidade: number;
  custoUnitarioCents: number;
  condicao: "AVISTA" | "PRAZO";
  parcelas: number;
  destino: "ESTOQUE" | "DESPESA";
  contaDespesaId?: string;
}

export interface AjusteEstoqueInput {
  produtoId: string;
  direcao: "ENTRADA" | "SAIDA";
  quantidade: number;
  custoUnitarioCents?: number;
  observacao?: string;
}

export interface NovaContaInput {
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: Natureza;
  grupo: GrupoConta;
  analitica: boolean;
}

export interface NovaObrigacaoInput {
  nome: string;
  competencia: string;
  vencimento: string;
  valorCents: number;
  observacao?: string;
}

interface AppContexto {
  estado: EstadoMock;
  hidratado: boolean;
  empresa: Empresa;
  usuarioAtual: Usuario;
  toasts: Toast[];
  totalNotificacoes: number;
  notificar: (mensagem: string, tipo?: TipoToast) => void;
  fecharToast: (id: string) => void;
  criarOperacao: (input: NovaOperacaoInput) => ResultadoAcao<Operacao>;
  estornarOperacao: (id: string, motivo: string) => ResultadoAcao<Operacao>;
  apurarResultado: () => ResultadoAcao<Operacao>;
  registrarVenda: (input: VendaInput) => ResultadoAcao<Operacao>;
  registrarCompra: (input: CompraInput) => ResultadoAcao<Operacao>;
  ajustarEstoque: (input: AjusteEstoqueInput) => ResultadoAcao<Operacao>;
  salvarSaldosIniciais: (
    linhas: Array<{ contaId: string; debitoCents: number; creditoCents: number }>,
  ) => ResultadoAcao;
  criarConta: (input: NovaContaInput) => ResultadoAcao<Conta>;
  alternarContaAtiva: (id: string) => ResultadoAcao;
  adicionarProduto: (input: {
    nome: string;
    sku: string;
    unidade: string;
    estoqueMinimo: number;
  }) => ResultadoAcao<Produto>;
  alternarObrigacao: (id: string) => ResultadoAcao;
  adicionarObrigacao: (input: NovaObrigacaoInput) => ResultadoAcao<Obrigacao>;
  atualizarEmpresa: (input: Partial<Empresa>) => ResultadoAcao;
  criarUsuario: (input: {
    nome: string;
    email: string;
    papel: Papel;
  }) => ResultadoAcao<Usuario>;
  alternarUsuarioAtivo: (id: string) => ResultadoAcao;
  selecionarUsuario: (id: string) => void;
  fecharPeriodo: () => ResultadoAcao;
  reabrirPeriodo: () => ResultadoAcao;
  atualizarConfiguracoes: (input: Partial<Configuracoes>) => ResultadoAcao;
  resetarDemo: () => void;
  exportarDados: () => string;
  importarDados: (json: string) => ResultadoAcao;
}

const AppContext = createContext<AppContexto | null>(null);

function criarAuditoria(
  usuario: string,
  acao: string,
  entidade: string,
  entidadeId: string,
  detalhe: string,
  antes?: string,
  depois?: string,
): Auditoria {
  return {
    id: uid("aud"),
    data: agoraISO(),
    usuario,
    acao,
    entidade,
    entidadeId,
    detalhe,
    antes,
    depois,
  };
}

function acrescentarAuditoria(estado: EstadoMock, item: Auditoria): EstadoMock {
  return { ...estado, auditoria: [item, ...estado.auditoria] };
}

function montarOperacao(
  estado: EstadoMock,
  usuario: string,
  input: NovaOperacaoInput,
  tipo: TipoOperacao,
): Operacao {
  const numero = proximoNumeroOperacao(estado.operacoes, estado.periodo.exercicio);
  return {
    id: uid("op"),
    numero,
    data: input.data,
    historico: input.historico.trim(),
    tipo,
    status: "ATIVA",
    usuario,
    criadoEm: agoraISO(),
    documento: input.documento,
    linhas: input.linhas.map((linha) => ({
      id: uid("lin"),
      contaId: linha.contaId,
      tipo: linha.tipo,
      valorCents: linha.valorCents,
    })),
  };
}

function montarEstorno(
  estado: EstadoMock,
  usuario: string,
  original: Operacao,
  motivo: string,
): Operacao {
  const numero = proximoNumeroOperacao(estado.operacoes, estado.periodo.exercicio);
  return {
    id: uid("op"),
    numero,
    data: dataDentroDoExercicio(estado, hojeISO()),
    historico: `Estorno de ${original.numero} — ${original.historico}`,
    tipo: "ESTORNO",
    status: "ATIVA",
    usuario,
    criadoEm: agoraISO(),
    reversalOfId: original.id,
    motivoEstorno: motivo,
    linhas: original.linhas.map((linha) => ({
      id: uid("lin"),
      contaId: linha.contaId,
      tipo: linha.tipo === "DEBITO" ? "CREDITO" : "DEBITO",
      valorCents: linha.valorCents,
    })),
  };
}

function dataDentroDoExercicio(estado: EstadoMock, data: string) {
  if (data < estado.periodo.inicio) return estado.periodo.inicio;
  if (data > estado.periodo.fim) return estado.periodo.fim;
  return data;
}

function proximoNumeroDocumento(estado: EstadoMock, tipo: "VENDA" | "COMPRA"): string {
  const prefixo = tipo === "VENDA" ? "VENDA" : "COMPRA";
  const quantidade = estado.operacoes.filter((op) => op.documento?.tipo === tipo).length + 1;
  return `${prefixo}-${estado.periodo.exercicio}-${String(quantidade).padStart(4, "0")}`;
}

function validarCNPJBasico(cnpj: string): boolean {
  const digitos = cnpj.replace(/\D/g, "");
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) return false;
  const calcular = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return (
    calcular(digitos.slice(0, 12)) === Number(digitos[12]) &&
    calcular(digitos.slice(0, 13)) === Number(digitos[13])
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoMock>(() => criarEstadoInicial());
  const [hidratado, setHidratado] = useState(false);
  const estadoRef = useRef(estado);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [totalNotificacoes, setTotalNotificacoes] = useState(0);

  const aplicar = useCallback((novo: EstadoMock) => {
    estadoRef.current = novo;
    setEstado(novo);
  }, []);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_STORAGE);
      if (bruto) {
        const carregado = JSON.parse(bruto) as EstadoMock;
        if (carregado?.versao === VERSAO_ESTADO && carregado.empresa && carregado.contas) {
          estadoRef.current = carregado;
          setEstado(carregado);
        }
      }
    } catch {
      // Dados corrompidos: segue com a demonstração.
    } finally {
      setHidratado(true);
    }
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    try {
      window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
    } catch {
      // Sem espaço ou modo privado: a demonstração continua em memória.
    }
  }, [estado, hidratado]);

  const notificar = useCallback((mensagem: string, tipo: TipoToast = "sucesso") => {
    const item: Toast = { id: uid("toast"), mensagem, tipo };
    setToasts((atuais) => [...atuais, item]);
    setTotalNotificacoes((total) => total + 1);
    window.setTimeout(() => {
      setToasts((atuais) => atuais.filter((toast) => toast.id !== item.id));
    }, 4200);
  }, []);

  const fecharToast = useCallback((id: string) => {
    setToasts((atuais) => atuais.filter((toast) => toast.id !== id));
  }, []);

  const usuarioAtual = useMemo(
    () =>
      estado.usuarios.find((usuario) => usuario.id === estado.usuarioAtualId) ??
      estado.usuarios[0],
    [estado.usuarios, estado.usuarioAtualId],
  );

  const criarOperacao = useCallback(
    (input: NovaOperacaoInput): ResultadoAcao<Operacao> => {
      const atual = estadoRef.current;
      const entrada: EntradaOperacao = {
        data: input.data,
        historico: input.historico,
        tipo: input.tipo ?? "MANUAL",
        linhas: input.linhas,
      };
      const validacao = validarOperacao(entrada, atual.contas, atual.operacoes, atual.periodo);
      if (!validacao.ok) return { ok: false, erro: validacao.erro };

      const operacao = montarOperacao(atual, usuarioAtual.nome, input, input.tipo ?? "MANUAL");
      let novo: EstadoMock = {
        ...atual,
        operacoes: [...atual.operacoes, operacao],
      };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "CRIAR",
          "Operação",
          operacao.id,
          `${operacao.numero} — ${operacao.historico}`,
          undefined,
          `${operacao.tipo} · ${formatarMoeda(valorOperacao(operacao))}`,
        ),
      );
      aplicar(novo);
      return { ok: true, data: operacao };
    },
    [aplicar, usuarioAtual.nome],
  );

  const estornarOperacao = useCallback(
    (id: string, motivo: string): ResultadoAcao<Operacao> => {
      const atual = estadoRef.current;
      const original = atual.operacoes.find((op) => op.id === id);
      if (!original) return { ok: false, erro: "Operação não encontrada." };
      if (original.status !== "ATIVA") {
        return { ok: false, erro: "Só é possível estornar uma operação ativa." };
      }
      if (!motivo.trim()) return { ok: false, erro: "Informe o motivo do estorno." };
      if (atual.periodo.status === "FECHADO") {
        return { ok: false, erro: "O exercício está fechado. Reabra o período para estornar." };
      }

      const estorno = montarEstorno(atual, usuarioAtual.nome, original, motivo.trim());
      const operacoes = atual.operacoes.map((op) =>
        op.id === original.id ? { ...op, status: "ESTORNADA" as const } : op,
      );
      let novo: EstadoMock = {
        ...atual,
        operacoes: [...operacoes, estorno],
      };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "ESTORNAR",
          "Operação",
          original.id,
          `${original.numero} estornada por ${estorno.numero}. Motivo: ${motivo.trim()}`,
          "ATIVA",
          "ESTORNADA",
        ),
      );
      aplicar(novo);
      return { ok: true, data: estorno };
    },
    [aplicar, usuarioAtual.nome],
  );

  const apurarResultado = useCallback((): ResultadoAcao<Operacao> => {
    const atual = estadoRef.current;
    if (atual.periodo.status === "FECHADO") {
      return { ok: false, erro: "O exercício está fechado. Reabra o período para apurar." };
    }
    const jaApurado = atual.operacoes.some(
      (op) => op.tipo === "APURACAO" && op.status !== "ESTORNADA",
    );
    if (jaApurado) {
      return {
        ok: false,
        erro: "O resultado deste exercício já foi apurado. Estorne a apuração para refazer.",
      };
    }

    const dre = gerarDre(atual.contas, atual.operacoes, {
      inicio: atual.periodo.inicio,
      fim: atual.periodo.fim,
    });
    if (dre.totalReceitasCents === 0 && dre.totalDespesasCents === 0) {
      return { ok: false, erro: "Não há receitas nem despesas para apurar neste exercício." };
    }

    const linhas: NovaOperacaoInput["linhas"] = [];
    let totalReceitas = 0;
    let totalDespesas = 0;

    for (const linha of dre.receitas) {
      if (linha.valorCents === 0) continue;
      totalReceitas += Math.abs(linha.valorCents);
      if (linha.valorCents > 0) {
        linhas.push({ contaId: linha.conta.id, tipo: "DEBITO", valorCents: linha.valorCents });
      } else {
        linhas.push({ contaId: linha.conta.id, tipo: "CREDITO", valorCents: -linha.valorCents });
      }
    }
    for (const linha of dre.despesas) {
      if (linha.valorCents === 0) continue;
      totalDespesas += Math.abs(linha.valorCents);
      if (linha.valorCents > 0) {
        linhas.push({ contaId: linha.conta.id, tipo: "CREDITO", valorCents: linha.valorCents });
      } else {
        linhas.push({ contaId: linha.conta.id, tipo: "DEBITO", valorCents: -linha.valorCents });
      }
    }

    if (totalReceitas > 0) {
      linhas.push({ contaId: CONTA.apuracao, tipo: "CREDITO", valorCents: totalReceitas });
    }
    if (totalDespesas > 0) {
      linhas.push({ contaId: CONTA.apuracao, tipo: "DEBITO", valorCents: totalDespesas });
    }

    const resultado = dre.totalReceitasCents - dre.totalDespesasCents;
    if (resultado > 0) {
      linhas.push({ contaId: CONTA.apuracao, tipo: "DEBITO", valorCents: resultado });
      linhas.push({ contaId: CONTA.lucros, tipo: "CREDITO", valorCents: resultado });
    } else if (resultado < 0) {
      linhas.push({ contaId: CONTA.lucros, tipo: "DEBITO", valorCents: -resultado });
      linhas.push({ contaId: CONTA.apuracao, tipo: "CREDITO", valorCents: -resultado });
    }
    const data = dataDentroDoExercicio(atual, hojeISO());
    const entrada: EntradaOperacao = {
      data,
      historico: `Apuração do resultado do exercício ${atual.periodo.exercicio}`,
      tipo: "APURACAO",
      linhas,
    };
    const validacao = validarOperacao(entrada, atual.contas, atual.operacoes, atual.periodo);
    if (!validacao.ok) return { ok: false, erro: validacao.erro };

    const operacao = montarOperacao(atual, usuarioAtual.nome, entrada, "APURACAO");
    let novo: EstadoMock = { ...atual, operacoes: [...atual.operacoes, operacao] };
    novo = acrescentarAuditoria(
      novo,
      criarAuditoria(
        usuarioAtual.nome,
        "APURAR",
        "Operação",
        operacao.id,
        `${operacao.numero} — resultado de ${formatarMoeda(resultado)} transferido ao patrimônio líquido.`,
        undefined,
        resultado >= 0 ? "Lucro" : "Prejuízo",
      ),
    );
    aplicar(novo);
    return { ok: true, data: operacao };
  }, [aplicar, usuarioAtual.nome]);

  const registrarVenda = useCallback(
    (input: VendaInput): ResultadoAcao<Operacao> => {
      const atual = estadoRef.current;
      if (atual.periodo.status === "FECHADO") {
        return { ok: false, erro: "O exercício está fechado." };
      }
      const data = input.data || hojeISO();
      const parceiro = input.parceiro?.trim() || "Cliente Balcão";
      const contaRecebimento = input.condicao === "AVISTA" ? CONTA.caixa : CONTA.clientes;
      const linhas: NovaOperacaoInput["linhas"] = [];
      let documento: Documento | undefined;
      let valor: number;
      let historico: string;

      if (input.modo === "SERVICO") {
        valor = input.valorUnitarioCents ?? 0;
        if (valor <= 0) return { ok: false, erro: "Informe o valor do serviço." };
        linhas.push({ contaId: contaRecebimento, tipo: "DEBITO", valorCents: valor });
        linhas.push({ contaId: CONTA.receitaServicos, tipo: "CREDITO", valorCents: valor });
        documento = {
          tipo: "VENDA",
          numero: proximoNumeroDocumento(atual, "VENDA"),
          parceiro,
          condicao: input.condicao,
          itens: [
            {
              produtoId: "servico",
              descricao: input.descricaoServico?.trim() || "Prestação de serviço",
              quantidade: 1,
              valorUnitarioCents: valor,
              custoUnitarioCents: 0,
            },
          ],
        };
        historico = `Venda de serviço — ${input.descricaoServico?.trim() || "prestação de serviço"}`;
      } else {
        const produto = atual.produtos.find((item) => item.id === input.produtoId);
        if (!produto) return { ok: false, erro: "Selecione um produto." };
        const quantidade = input.quantidade ?? 0;
        const preco = input.valorUnitarioCents ?? 0;
        if (!Number.isFinite(quantidade) || quantidade <= 0) {
          return { ok: false, erro: "Informe uma quantidade maior que zero." };
        }
        if (preco <= 0) return { ok: false, erro: "Informe um preço de venda maior que zero." };

        const estoque = custoMedioAtual(produto.id, atual.produtos, atual.movimentosEstoque);
        if (atual.configuracoes.bloquearEstoqueNegativo && quantidade > estoque.quantidade) {
          return {
            ok: false,
            erro: `Estoque insuficiente: há ${estoque.quantidade} unidade(s) de ${produto.nome}.`,
          };
        }

        valor = Math.round(quantidade * preco);
        const cmv = Math.round(quantidade * estoque.custoMedioCents);
        linhas.push({ contaId: contaRecebimento, tipo: "DEBITO", valorCents: valor });
        linhas.push({ contaId: CONTA.receitaVendas, tipo: "CREDITO", valorCents: valor });
        if (cmv > 0) {
          linhas.push({ contaId: CONTA.cmv, tipo: "DEBITO", valorCents: cmv });
          linhas.push({ contaId: CONTA.estoques, tipo: "CREDITO", valorCents: cmv });
        }
        documento = {
          tipo: "VENDA",
          numero: proximoNumeroDocumento(atual, "VENDA"),
          parceiro,
          condicao: input.condicao,
          itens: [
            {
              produtoId: produto.id,
              descricao: produto.nome,
              quantidade,
              valorUnitarioCents: preco,
              custoUnitarioCents: estoque.custoMedioCents,
            },
          ],
        };
        historico = `Venda de ${quantidade} ${produto.unidade} de ${produto.nome} — ${
          input.condicao === "AVISTA" ? "à vista" : "a prazo"
        }`;
      }

      const entrada: EntradaOperacao = { data, historico, tipo: "VENDA", linhas };
      const validacao = validarOperacao(entrada, atual.contas, atual.operacoes, atual.periodo);
      if (!validacao.ok) return { ok: false, erro: validacao.erro };

      const operacao = montarOperacao(
        atual,
        usuarioAtual.nome,
        { ...entrada, documento },
        "VENDA",
      );

      const movimentos =
        input.modo === "MERCADORIA" && input.produtoId
          ? [
              ...atual.movimentosEstoque,
              {
                id: uid("mov"),
                produtoId: input.produtoId,
                tipo: "SAIDA" as const,
                quantidade: input.quantidade ?? 0,
                custoUnitarioCents:
                  documento?.itens?.[0]?.custoUnitarioCents ?? 0,
                data,
                operacaoId: operacao.id,
                observacao: `Saída pela venda ${operacao.numero}`,
              },
            ]
          : atual.movimentosEstoque;

      let novo: EstadoMock = {
        ...atual,
        operacoes: [...atual.operacoes, operacao],
        movimentosEstoque: movimentos,
      };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "VENDER",
          "Operação",
          operacao.id,
          `${operacao.numero} — ${historico}`,
          undefined,
          formatarMoeda(valor),
        ),
      );
      aplicar(novo);
      return { ok: true, data: operacao };
    },
    [aplicar, usuarioAtual.nome],
  );

  const registrarCompra = useCallback(
    (input: CompraInput): ResultadoAcao<Operacao> => {
      const atual = estadoRef.current;
      if (atual.periodo.status === "FECHADO") {
        return { ok: false, erro: "O exercício está fechado." };
      }
      const produto = atual.produtos.find((item) => item.id === input.produtoId);
      if (!produto) return { ok: false, erro: "Selecione um produto." };
      if (input.quantidade <= 0) {
        return { ok: false, erro: "Informe uma quantidade maior que zero." };
      }
      if (input.custoUnitarioCents <= 0) {
        return { ok: false, erro: "Informe um custo unitário maior que zero." };
      }
      const total = Math.round(input.quantidade * input.custoUnitarioCents);
      const data = input.data || hojeISO();
      const parcelas = Math.max(1, Math.floor(input.parcelas || 1));
      const contaDestino =
        input.destino === "ESTOQUE" ? CONTA.estoques : input.contaDespesaId || CONTA.material;
      const destino = atual.contas.find((conta) => conta.id === contaDestino);
      if (!destino) return { ok: false, erro: "Conta de destino inválida." };

      const linhas: NovaOperacaoInput["linhas"] = [
        { contaId: contaDestino, tipo: "DEBITO", valorCents: total },
      ];
      let documento: Documento = {
        tipo: "COMPRA",
        numero: proximoNumeroDocumento(atual, "COMPRA"),
        parceiro: input.fornecedor?.trim() || "Fornecedor",
        condicao: input.condicao,
        itens: [
          {
            produtoId: produto.id,
            descricao: produto.nome,
            quantidade: input.quantidade,
            valorUnitarioCents: input.custoUnitarioCents,
            custoUnitarioCents: input.custoUnitarioCents,
          },
        ],
      };

      if (input.condicao === "AVISTA") {
        linhas.push({ contaId: CONTA.caixa, tipo: "CREDITO", valorCents: total });
      } else {
        const quantidadeCp = Math.min(parcelas, 12);
        const quantidadeLp = Math.max(0, parcelas - 12);
        const valorCp =
          quantidadeLp === 0 ? total : Math.round((total * quantidadeCp) / parcelas);
        const valorLp = total - valorCp;
        if (valorCp > 0) {
          linhas.push({ contaId: CONTA.fornecedores, tipo: "CREDITO", valorCents: valorCp });
        }
        if (valorLp > 0) {
          linhas.push({ contaId: CONTA.contasPagarLP, tipo: "CREDITO", valorCents: valorLp });
        }
        const parcelasDoc: Parcela[] = [];
        let acumulado = 0;
        for (let indice = 1; indice <= parcelas; indice++) {
          const ultima = indice === parcelas;
          const valorParcela = ultima
            ? total - acumulado
            : Math.round(total / parcelas);
          acumulado += valorParcela;
          const tipo = indice <= 12 ? "CP" : "LP";
          parcelasDoc.push({
            numero: indice,
            vencimento: adicionarMeses(data, indice),
            valorCents: valorParcela,
            contaId: tipo === "CP" ? CONTA.fornecedores : CONTA.contasPagarLP,
            tipo,
          });
        }
        documento = { ...documento, parcelas: parcelasDoc };
      }

      const historico = `Compra de ${input.quantidade} ${produto.unidade} de ${produto.nome} — ${
        input.condicao === "AVISTA" ? "à vista" : `${parcelas}x`
      }`;
      const entrada: EntradaOperacao = { data, historico, tipo: "COMPRA", linhas };
      const validacao = validarOperacao(entrada, atual.contas, atual.operacoes, atual.periodo);
      if (!validacao.ok) return { ok: false, erro: validacao.erro };

      const operacao = montarOperacao(
        atual,
        usuarioAtual.nome,
        { ...entrada, documento },
        "COMPRA",
      );
      const movimentos =
        input.destino === "ESTOQUE"
          ? [
              ...atual.movimentosEstoque,
              {
                id: uid("mov"),
                produtoId: produto.id,
                tipo: "ENTRADA" as const,
                quantidade: input.quantidade,
                custoUnitarioCents: input.custoUnitarioCents,
                data,
                operacaoId: operacao.id,
                observacao: `Entrada pela compra ${operacao.numero}`,
              },
            ]
          : atual.movimentosEstoque;

      let novo: EstadoMock = {
        ...atual,
        operacoes: [...atual.operacoes, operacao],
        movimentosEstoque: movimentos,
      };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "COMPRAR",
          "Operação",
          operacao.id,
          `${operacao.numero} — ${historico}`,
          undefined,
          formatarMoeda(total),
        ),
      );
      aplicar(novo);
      return { ok: true, data: operacao };
    },
    [aplicar, usuarioAtual.nome],
  );

  const ajustarEstoque = useCallback(
    (input: AjusteEstoqueInput): ResultadoAcao<Operacao> => {
      const atual = estadoRef.current;
      if (atual.periodo.status === "FECHADO") {
        return { ok: false, erro: "O exercício está fechado." };
      }
      const produto = atual.produtos.find((item) => item.id === input.produtoId);
      if (!produto) return { ok: false, erro: "Produto não encontrado." };
      if (input.quantidade <= 0) {
        return { ok: false, erro: "Informe uma quantidade maior que zero." };
      }
      const estoque = custoMedioAtual(produto.id, atual.produtos, atual.movimentosEstoque);
      if (
        input.direcao === "SAIDA" &&
        atual.configuracoes.bloquearEstoqueNegativo &&
        input.quantidade > estoque.quantidade
      ) {
        return {
          ok: false,
          erro: `Estoque insuficiente: há ${estoque.quantidade} unidade(s) disponíveis.`,
        };
      }
      const custo =
        input.custoUnitarioCents && input.custoUnitarioCents > 0
          ? input.custoUnitarioCents
          : estoque.custoMedioCents;
      const valor = Math.round(input.quantidade * custo);
      if (valor <= 0) {
        return {
          ok: false,
          erro: "Informe o custo unitário do ajuste (não há custo médio para este produto).",
        };
      }
      const data = dataDentroDoExercicio(atual, hojeISO());
      const linhas: NovaOperacaoInput["linhas"] =
        input.direcao === "ENTRADA"
          ? [
              { contaId: CONTA.estoques, tipo: "DEBITO", valorCents: valor },
              { contaId: CONTA.cmv, tipo: "CREDITO", valorCents: valor },
            ]
          : [
              { contaId: CONTA.cmv, tipo: "DEBITO", valorCents: valor },
              { contaId: CONTA.estoques, tipo: "CREDITO", valorCents: valor },
            ];
      const historico = `Ajuste de estoque (${input.direcao === "ENTRADA" ? "sobra" : "falta"}) — ${
        input.quantidade
      } ${produto.unidade} de ${produto.nome}${input.observacao ? ` — ${input.observacao}` : ""}`;
      const entrada: EntradaOperacao = { data, historico, tipo: "AJUSTE_ESTOQUE", linhas };
      const validacao = validarOperacao(entrada, atual.contas, atual.operacoes, atual.periodo);
      if (!validacao.ok) return { ok: false, erro: validacao.erro };

      const operacao = montarOperacao(atual, usuarioAtual.nome, entrada, "AJUSTE_ESTOQUE");
      const movimento = {
        id: uid("mov"),
        produtoId: produto.id,
        tipo: "AJUSTE" as const,
        quantidade: input.direcao === "ENTRADA" ? input.quantidade : -input.quantidade,
        custoUnitarioCents: custo,
        data,
        operacaoId: operacao.id,
        observacao: input.observacao,
      };
      let novo: EstadoMock = {
        ...atual,
        operacoes: [...atual.operacoes, operacao],
        movimentosEstoque: [...atual.movimentosEstoque, movimento],
      };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "AJUSTAR_ESTOQUE",
          "Produto",
          produto.id,
          `${historico} — ${formatarMoeda(valor)}`,
          undefined,
          `${estoque.quantidade} → ${
            input.direcao === "ENTRADA"
              ? estoque.quantidade + input.quantidade
              : estoque.quantidade - input.quantidade
          } un.`,
        ),
      );
      aplicar(novo);
      return { ok: true, data: operacao };
    },
    [aplicar, usuarioAtual.nome],
  );

  const salvarSaldosIniciais = useCallback(
    (linhas: Array<{ contaId: string; debitoCents: number; creditoCents: number }>): ResultadoAcao => {
      const atual = estadoRef.current;
      if (atual.periodo.status === "FECHADO") {
        return { ok: false, erro: "O exercício está fechado." };
      }
      const validas = linhas
        .map((linha) => ({
          contaId: linha.contaId,
          debitoCents: Math.max(0, Math.round(linha.debitoCents || 0)),
          creditoCents: Math.max(0, Math.round(linha.creditoCents || 0)),
        }))
        .filter((linha) => linha.debitoCents > 0 || linha.creditoCents > 0);

      if (validas.length === 0) {
        return { ok: false, erro: "Preencha ao menos uma conta com saldo inicial." };
      }
      const contaDupla = validas.find(
        (linha) => linha.debitoCents > 0 && linha.creditoCents > 0,
      );
      if (contaDupla) {
        return { ok: false, erro: "Cada conta deve ter apenas débito ou crédito, não os dois." };
      }
      for (const linha of validas) {
        const conta = atual.contas.find((item) => item.id === linha.contaId);
        if (!conta) return { ok: false, erro: "Há uma conta inexistente no saldo inicial." };
        if (!conta.analitica) {
          return { ok: false, erro: `A conta ${conta.codigo} é sintética e não recebe saldo.` };
        }
      }
      const totalDebitos = validas.reduce((total, linha) => total + linha.debitoCents, 0);
      const totalCreditos = validas.reduce((total, linha) => total + linha.creditoCents, 0);
      if (totalDebitos !== totalCreditos) {
        return {
          ok: false,
          erro: `O saldo inicial não fecha: débitos ${formatarMoeda(totalDebitos)} × créditos ${formatarMoeda(totalCreditos)}.`,
        };
      }

      let operacoes = [...atual.operacoes];
      const ativas = operacoes.filter(
        (op) => op.tipo === "SALDO_INICIAL" && op.status === "ATIVA",
      );
      const agora = agoraISO();
      for (const original of ativas) {
        const estorno: Operacao = {
          id: uid("op"),
          numero: proximoNumeroOperacao(operacoes, atual.periodo.exercicio),
          data: dataDentroDoExercicio(atual, hojeISO()),
          historico: `Estorno de ${original.numero} — substituição do saldo inicial`,
          tipo: "ESTORNO",
          status: "ATIVA",
          usuario: usuarioAtual.nome,
          criadoEm: agora,
          reversalOfId: original.id,
          motivoEstorno: "Substituição do saldo inicial",
          linhas: original.linhas.map((linha) => ({
            id: uid("lin"),
            contaId: linha.contaId,
            tipo: linha.tipo === "DEBITO" ? "CREDITO" : "DEBITO",
            valorCents: linha.valorCents,
          })),
        };
        operacoes = operacoes
          .map((op) =>
            op.id === original.id ? { ...op, status: "ESTORNADA" as const } : op,
          )
          .concat(estorno);
      }

      const novaEntrada: NovaOperacaoInput = {
        data: atual.periodo.inicio,
        historico: "Saldo inicial do exercício",
        tipo: "SALDO_INICIAL",
        linhas: validas.flatMap((linha) => {
          const resultado: NovaOperacaoInput["linhas"] = [];
          if (linha.debitoCents > 0) {
            resultado.push({ contaId: linha.contaId, tipo: "DEBITO", valorCents: linha.debitoCents });
          }
          if (linha.creditoCents > 0) {
            resultado.push({
              contaId: linha.contaId,
              tipo: "CREDITO",
              valorCents: linha.creditoCents,
            });
          }
          return resultado;
        }),
      };

      const novaOperacao: Operacao = {
        id: uid("op"),
        numero: proximoNumeroOperacao(operacoes, atual.periodo.exercicio),
        data: novaEntrada.data,
        historico: novaEntrada.historico,
        tipo: "SALDO_INICIAL",
        status: "ATIVA",
        usuario: usuarioAtual.nome,
        criadoEm: agora,
        linhas: novaEntrada.linhas.map((linha) => ({ id: uid("lin"), ...linha })),
      };

      let novo: EstadoMock = {
        ...atual,
        saldosIniciais: validas,
        operacoes: [...operacoes, novaOperacao],
      };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "SALVAR_SALDO_INICIAL",
          "Saldo Inicial",
          novaOperacao.id,
          `${novaOperacao.numero} — ${validas.length} conta(s), total ${formatarMoeda(totalDebitos)}.`,
          ativas.length ? "Saldo inicial anterior estornado" : undefined,
          "Balanceado",
        ),
      );
      aplicar(novo);
      return { ok: true };
    },
    [aplicar, usuarioAtual.nome],
  );

  const criarConta = useCallback(
    (input: NovaContaInput): ResultadoAcao<Conta> => {
      const atual = estadoRef.current;
      const codigo = input.codigo.trim();
      if (!/^\d(\.\d{1,2}){1,2}$/.test(codigo)) {
        return { ok: false, erro: "Use um código no formato 1.0.1 ou 3.1.4." };
      }
      if (!input.nome.trim()) return { ok: false, erro: "Informe o nome da conta." };
      if (atual.contas.some((conta) => conta.codigo === codigo)) {
        return { ok: false, erro: "Já existe uma conta com este código." };
      }
      const raiz = codigo[0];
      const tipoPorRaiz: Record<string, TipoConta[]> = {
        "1": ["ATIVO"],
        "2": ["ATIVO"],
        "3": ["PASSIVO"],
        "4": ["PATRIMONIO_LIQUIDO"],
        "5": ["DESPESA", "CUSTO"],
        "6": ["RECEITA"],
        "7": ["APURACAO"],
      };
      if (!tipoPorRaiz[raiz]?.includes(input.tipo)) {
        return {
          ok: false,
          erro: "O tipo da conta não é compatível com o primeiro dígito do código (1/2 Ativo, 3 Passivo, 4 PL, 5 Despesa, 6 Receita, 7 Apuração).",
        };
      }
      const naturezaEsperada: Natureza =
        input.tipo === "ATIVO" || input.tipo === "DESPESA" || input.tipo === "CUSTO"
          ? "DEVEDORA"
          : "CREDORA";
      if (input.natureza !== naturezaEsperada) {
        return {
          ok: false,
          erro: `Para o tipo ${input.tipo}, a natureza deve ser ${naturezaEsperada.toLowerCase()}.`,
        };
      }
      const conta: Conta = {
        id: uid("conta"),
        codigo,
        nome: input.nome.trim(),
        tipo: input.tipo,
        natureza: input.natureza,
        grupo: input.grupo,
        analitica: input.analitica,
        ativa: true,
        padrao: false,
      };
      let novo: EstadoMock = { ...atual, contas: [...atual.contas, conta] };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "CRIAR",
          "Conta",
          conta.id,
          `${conta.codigo} — ${conta.nome}`,
          undefined,
          conta.analitica ? "Analítica" : "Sintética",
        ),
      );
      aplicar(novo);
      return { ok: true, data: conta };
    },
    [aplicar, usuarioAtual.nome],
  );

  const alternarContaAtiva = useCallback(
    (id: string): ResultadoAcao => {
      const atual = estadoRef.current;
      const conta = atual.contas.find((item) => item.id === id);
      if (!conta) return { ok: false, erro: "Conta não encontrada." };
      if (conta.ativa) {
        const usada = atual.operacoes.some((op) =>
          op.linhas.some((linha) => linha.contaId === id),
        );
        if (usada) {
          return {
            ok: false,
            erro: "Esta conta possui lançamentos e não pode ser inativada. Crie uma conta nova ou estorne os lançamentos.",
          };
        }
      }
      const contas = atual.contas.map((item) =>
        item.id === id ? { ...item, ativa: !item.ativa } : item,
      );
      let novo: EstadoMock = { ...atual, contas };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          conta.ativa ? "INATIVAR" : "REATIVAR",
          "Conta",
          conta.id,
          `${conta.codigo} — ${conta.nome}`,
          conta.ativa ? "Ativa" : "Inativa",
          conta.ativa ? "Inativa" : "Ativa",
        ),
      );
      aplicar(novo);
      return { ok: true };
    },
    [aplicar, usuarioAtual.nome],
  );

  const adicionarProduto = useCallback(
    (input: {
      nome: string;
      sku: string;
      unidade: string;
      estoqueMinimo: number;
    }): ResultadoAcao<Produto> => {
      const atual = estadoRef.current;
      if (!input.nome.trim()) return { ok: false, erro: "Informe o nome do produto." };
      if (!input.sku.trim()) return { ok: false, erro: "Informe o SKU." };
      if (atual.produtos.some((produto) => produto.sku === input.sku.trim())) {
        return { ok: false, erro: "Já existe um produto com este SKU." };
      }
      const produto: Produto = {
        id: uid("prod"),
        nome: input.nome.trim(),
        sku: input.sku.trim().toUpperCase(),
        unidade: input.unidade.trim().toUpperCase() || "UN",
        estoqueMinimo: Math.max(0, Math.floor(input.estoqueMinimo || 0)),
        ativo: true,
      };
      let novo: EstadoMock = { ...atual, produtos: [...atual.produtos, produto] };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "CRIAR",
          "Produto",
          produto.id,
          `${produto.sku} — ${produto.nome}`,
          undefined,
          produto.unidade,
        ),
      );
      aplicar(novo);
      return { ok: true, data: produto };
    },
    [aplicar, usuarioAtual.nome],
  );

  const alternarObrigacao = useCallback(
    (id: string): ResultadoAcao => {
      const atual = estadoRef.current;
      const obrigacao = atual.obrigacoes.find((item) => item.id === id);
      if (!obrigacao) return { ok: false, erro: "Obrigação não encontrada." };
      const novoStatus = obrigacao.status === "PAGA" ? "PENDENTE" : "PAGA";
      const obrigacoes = atual.obrigacoes.map((item) =>
        item.id === id ? { ...item, status: novoStatus as Obrigacao["status"] } : item,
      );
      let novo: EstadoMock = { ...atual, obrigacoes };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "ALTERAR_STATUS",
          "Obrigação",
          obrigacao.id,
          `${obrigacao.nome} — ${obrigacao.competencia}`,
          obrigacao.status,
          novoStatus,
        ),
      );
      aplicar(novo);
      return { ok: true };
    },
    [aplicar, usuarioAtual.nome],
  );

  const adicionarObrigacao = useCallback(
    (input: NovaObrigacaoInput): ResultadoAcao<Obrigacao> => {
      const atual = estadoRef.current;
      if (!input.nome.trim()) return { ok: false, erro: "Informe o nome da obrigação." };
      if (!input.vencimento) return { ok: false, erro: "Informe o vencimento." };
      const obrigacao: Obrigacao = {
        id: uid("obr"),
        nome: input.nome.trim(),
        competencia: input.competencia || hojeISO().slice(0, 7),
        vencimento: input.vencimento,
        valorCents: Math.max(0, Math.round(input.valorCents || 0)),
        status: "PENDENTE",
        observacao: input.observacao?.trim(),
      };
      let novo: EstadoMock = { ...atual, obrigacoes: [...atual.obrigacoes, obrigacao] };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "CRIAR",
          "Obrigação",
          obrigacao.id,
          `${obrigacao.nome} — vence em ${obrigacao.vencimento}`,
        ),
      );
      aplicar(novo);
      return { ok: true, data: obrigacao };
    },
    [aplicar, usuarioAtual.nome],
  );

  const atualizarEmpresa = useCallback(
    (input: Partial<Empresa>): ResultadoAcao => {
      const atual = estadoRef.current;
      if (input.cnpj && !validarCNPJBasico(input.cnpj)) {
        return { ok: false, erro: "CNPJ inválido. Confira os 14 dígitos e os verificadores." };
      }
      if (input.exercicioInicio && input.exercicioFim && input.exercicioInicio > input.exercicioFim) {
        return { ok: false, erro: "O início do exercício deve ser anterior ao fim." };
      }
      const empresa = { ...atual.empresa, ...input };
      let novo: EstadoMock = {
        ...atual,
        empresa,
        periodo: {
          ...atual.periodo,
          inicio: empresa.exercicioInicio,
          fim: empresa.exercicioFim,
          exercicio: empresa.exercicioInicio.slice(0, 4),
        },
      };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "EDITAR",
          "Empresa",
          empresa.id,
          `Dados da empresa atualizados — ${empresa.razaoSocial}`,
          atual.empresa.razaoSocial,
          empresa.razaoSocial,
        ),
      );
      aplicar(novo);
      return { ok: true };
    },
    [aplicar, usuarioAtual.nome],
  );

  const criarUsuario = useCallback(
    (input: { nome: string; email: string; papel: Papel }): ResultadoAcao<Usuario> => {
      const atual = estadoRef.current;
      if (!input.nome.trim()) return { ok: false, erro: "Informe o nome." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        return { ok: false, erro: "Informe um e-mail válido." };
      }
      if (atual.usuarios.some((usuario) => usuario.email === input.email.toLowerCase())) {
        return { ok: false, erro: "Já existe um usuário com este e-mail." };
      }
      const usuario: Usuario = {
        id: uid("user"),
        nome: input.nome.trim(),
        email: input.email.toLowerCase().trim(),
        papel: input.papel,
        ativo: true,
        ultimoAcesso: agoraISO(),
      };
      let novo: EstadoMock = { ...atual, usuarios: [...atual.usuarios, usuario] };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "CRIAR",
          "Usuário",
          usuario.id,
          `${usuario.nome} — ${usuario.email}`,
          undefined,
          usuario.papel,
        ),
      );
      aplicar(novo);
      return { ok: true, data: usuario };
    },
    [aplicar, usuarioAtual.nome],
  );

  const alternarUsuarioAtivo = useCallback(
    (id: string): ResultadoAcao => {
      const atual = estadoRef.current;
      const usuario = atual.usuarios.find((item) => item.id === id);
      if (!usuario) return { ok: false, erro: "Usuário não encontrado." };
      if (usuario.id === atual.usuarioAtualId && usuario.ativo) {
        return { ok: false, erro: "Não é possível desativar o usuário da sessão atual." };
      }
      const usuarios = atual.usuarios.map((item) =>
        item.id === id ? { ...item, ativo: !item.ativo } : item,
      );
      let novo: EstadoMock = { ...atual, usuarios };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          usuario.ativo ? "INATIVAR" : "REATIVAR",
          "Usuário",
          usuario.id,
          usuario.nome,
          usuario.ativo ? "Ativo" : "Inativo",
          usuario.ativo ? "Inativo" : "Ativo",
        ),
      );
      aplicar(novo);
      return { ok: true };
    },
    [aplicar, usuarioAtual.nome],
  );

  const selecionarUsuario = useCallback(
    (id: string) => {
      const atual = estadoRef.current;
      const usuario = atual.usuarios.find((item) => item.id === id);
      if (!usuario || !usuario.ativo) return;
      const usuarios = atual.usuarios.map((item) =>
        item.id === id ? { ...item, ultimoAcesso: agoraISO() } : item,
      );
      let novo: EstadoMock = { ...atual, usuarios, usuarioAtualId: id };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuario.nome,
          "LOGIN",
          "Sessão",
          usuario.id,
          `Sessão iniciada como ${usuario.papel}.`,
        ),
      );
      aplicar(novo);
    },
    [aplicar],
  );

  const fecharPeriodo = useCallback((): ResultadoAcao => {
    const atual = estadoRef.current;
    if (atual.periodo.status === "FECHADO") {
      return { ok: false, erro: "O período já está fechado." };
    }
    const linhas = gerarBalancete(atual.contas, atual.operacoes, {
      inicio: atual.periodo.inicio,
      fim: atual.periodo.fim,
    });
    const resumo = resumoBalancete(linhas);
    if (!resumo.fecha) {
      return {
        ok: false,
        erro: "O balancete não fecha. Corrija os lançamentos antes de fechar o período.",
      };
    }
    let novo: EstadoMock = {
      ...atual,
      periodo: { ...atual.periodo, status: "FECHADO" },
    };
    novo = acrescentarAuditoria(
      novo,
      criarAuditoria(
        usuarioAtual.nome,
        "FECHAR_PERIODO",
        "Período",
        atual.periodo.exercicio,
        `Exercício ${atual.periodo.exercicio} fechado.`,
        "ABERTO",
        "FECHADO",
      ),
    );
    aplicar(novo);
    return { ok: true };
  }, [aplicar, usuarioAtual.nome]);

  const reabrirPeriodo = useCallback((): ResultadoAcao => {
    const atual = estadoRef.current;
    if (atual.periodo.status === "ABERTO") {
      return { ok: false, erro: "O período já está aberto." };
    }
    if (usuarioAtual.papel !== "ADMIN") {
      return { ok: false, erro: "Somente um administrador pode reabrir o período." };
    }
    let novo: EstadoMock = {
      ...atual,
      periodo: { ...atual.periodo, status: "ABERTO" },
    };
    novo = acrescentarAuditoria(
      novo,
      criarAuditoria(
        usuarioAtual.nome,
        "REABRIR_PERIODO",
        "Período",
        atual.periodo.exercicio,
        `Exercício ${atual.periodo.exercicio} reaberto.`,
        "FECHADO",
        "ABERTO",
      ),
    );
    aplicar(novo);
    return { ok: true };
  }, [aplicar, usuarioAtual.nome, usuarioAtual.papel]);

  const atualizarConfiguracoes = useCallback(
    (input: Partial<Configuracoes>): ResultadoAcao => {
      const atual = estadoRef.current;
      const configuracoes = { ...atual.configuracoes, ...input };
      let novo: EstadoMock = { ...atual, configuracoes };
      novo = acrescentarAuditoria(
        novo,
        criarAuditoria(
          usuarioAtual.nome,
          "EDITAR",
          "Configuração",
          "config-geral",
          `Bloquear estoque negativo: ${configuracoes.bloquearEstoqueNegativo ? "sim" : "não"}.`,
          String(atual.configuracoes.bloquearEstoqueNegativo),
          String(configuracoes.bloquearEstoqueNegativo),
        ),
      );
      aplicar(novo);
      return { ok: true };
    },
    [aplicar, usuarioAtual.nome],
  );

  const resetarDemo = useCallback(() => {
    const novo = criarEstadoInicial();
    aplicar(novo);
    try {
      window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novo));
    } catch {
      // ignora
    }
  }, [aplicar]);

  const exportarDados = useCallback(() => {
    return JSON.stringify(estadoRef.current, null, 2);
  }, []);

  const importarDados = useCallback(
    (json: string): ResultadoAcao => {
      try {
        const dados = JSON.parse(json) as EstadoMock;
        if (!dados?.empresa || !Array.isArray(dados.contas) || !Array.isArray(dados.operacoes)) {
          return { ok: false, erro: "O arquivo não parece ser um backup válido do LLFinance." };
        }
        const base = criarEstadoInicial();
        const novo: EstadoMock = {
          ...base,
          ...dados,
          versao: VERSAO_ESTADO,
          configuracoes: { ...base.configuracoes, ...(dados.configuracoes ?? {}) },
        };
        const usuario =
          novo.usuarios.find((item) => item.id === novo.usuarioAtualId) ?? novo.usuarios[0];
        const comAuditoria = acrescentarAuditoria(
          novo,
          criarAuditoria(
            usuario.nome,
            "IMPORTAR",
            "Backup",
            "arquivo",
            "Backup restaurado a partir de arquivo JSON.",
          ),
        );
        aplicar(comAuditoria);
        return { ok: true };
      } catch {
        return { ok: false, erro: "Não foi possível ler o arquivo JSON." };
      }
    },
    [aplicar],
  );

  const valor = useMemo<AppContexto>(
    () => ({
      estado,
      hidratado,
      empresa: estado.empresa,
      usuarioAtual,
      toasts,
      totalNotificacoes,
      notificar,
      fecharToast,
      criarOperacao,
      estornarOperacao,
      apurarResultado,
      registrarVenda,
      registrarCompra,
      ajustarEstoque,
      salvarSaldosIniciais,
      criarConta,
      alternarContaAtiva,
      adicionarProduto,
      alternarObrigacao,
      adicionarObrigacao,
      atualizarEmpresa,
      criarUsuario,
      alternarUsuarioAtivo,
      selecionarUsuario,
      fecharPeriodo,
      reabrirPeriodo,
      atualizarConfiguracoes,
      resetarDemo,
      exportarDados,
      importarDados,
    }),
    [
      estado,
      hidratado,
      usuarioAtual,
      toasts,
      totalNotificacoes,
      notificar,
      fecharToast,
      criarOperacao,
      estornarOperacao,
      apurarResultado,
      registrarVenda,
      registrarCompra,
      ajustarEstoque,
      salvarSaldosIniciais,
      criarConta,
      alternarContaAtiva,
      adicionarProduto,
      alternarObrigacao,
      adicionarObrigacao,
      atualizarEmpresa,
      criarUsuario,
      alternarUsuarioAtivo,
      selecionarUsuario,
      fecharPeriodo,
      reabrirPeriodo,
      atualizarConfiguracoes,
      resetarDemo,
      exportarDados,
      importarDados,
    ],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp(): AppContexto {
  const contexto = useContext(AppContext);
  if (!contexto) throw new Error("useApp deve ser usado dentro de <AppProvider>.");
  return contexto;
}
