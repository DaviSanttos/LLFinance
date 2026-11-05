/* eslint-disable @typescript-eslint/no-explicit-any */

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numero = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numeroInteiro = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

export function formatarMoeda(cents: number): string {
  return moeda.format((Number(cents) || 0) / 100);
}

export function formatarMoedaCompacta(cents: number): string {
  const valor = Math.abs(cents) / 100;
  if (valor >= 1_000_000) return `${negativo(cents)}R$ ${numero.format(valor / 1_000_000)} mi`;
  if (valor >= 1_000) return `${negativo(cents)}R$ ${numero.format(valor / 1_000)} mil`;
  return formatarMoeda(cents);
}

function negativo(cents: number) {
  return cents < 0 ? "-" : "";
}

export function formatarNumero(valor: number, casas = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(Number(valor) || 0);
}

export function formatarQuantidade(valor: number): string {
  if (Number.isInteger(valor)) return numeroInteiro.format(valor);
  return numero.format(valor);
}

export function formatarPercentual(parte: number, total: number): string {
  if (!total) return "0,0%";
  return `${numero.format((parte / total) * 100)}%`;
}

/** Converte texto em reais para centavos. Aceita "1.234,56", "1234.56", "R$ 10". */
export function parseMoeda(texto: string): number {
  const limpo = String(texto ?? "")
    .replace(/[^\d,.-]/g, "")
    .trim();
  if (!limpo) return 0;
  let normalizado = limpo;
  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else {
    const partes = limpo.split(".");
    if (partes.length > 2) normalizado = partes.join("");
  }
  const valor = Number(normalizado);
  if (!Number.isFinite(valor)) return 0;
  return Math.round(valor * 100);
}

export function centavosParaTexto(cents: number): string {
  if (!cents) return "";
  return numero.format(cents / 100);
}

export function formatarData(iso?: string): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso?: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return formatarData(iso);
  return `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function agoraISO(): string {
  return new Date().toISOString();
}

export function adicionarMeses(iso: string, meses: number): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  const base = new Date(Date.UTC(ano, mes - 1 + meses, dia));
  const ultimoDia = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(dia, ultimoDia));
  return base.toISOString().slice(0, 10);
}

export function diferencaEmDias(isoA: string, isoB: string): number {
  const a = new Date(`${isoA}T00:00:00Z`).getTime();
  const b = new Date(`${isoB}T00:00:00Z`).getTime();
  return Math.round((a - b) / 86_400_000);
}

export function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function uid(prefixo = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefixo}-${crypto.randomUUID()}`;
  }
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validarCNPJ(valor: string): boolean {
  const cnpj = String(valor ?? "").replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

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

  const dv1 = calcular(cnpj.slice(0, 12));
  const dv2 = calcular(cnpj.slice(0, 13));
  return dv1 === Number(cnpj[12]) && dv2 === Number(cnpj[13]);
}

export function formatarCNPJ(valor: string): string {
  const cnpj = String(valor ?? "").replace(/\D/g, "").padEnd(14, "0").slice(0, 14);
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function baixarArquivo(nome: string, conteudo: string, tipo = "application/json") {
  const blob = new Blob([conteudo], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function lerArquivoTexto(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result ?? ""));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsText(arquivo, "utf-8");
  });
}

export function grupoLabel(grupo: string): string {
  const mapa: Record<string, string> = {
    CIRCULANTE: "Circulante",
    NAO_CIRCULANTE: "Não circulante",
    REALIZAVEL_LP: "Realizável a longo prazo",
    INVESTIMENTO: "Investimentos",
    IMOBILIZADO: "Imobilizado",
    INTANGIVEL: "Intangível",
    PATRIMONIO_LIQUIDO: "Patrimônio líquido",
    RESULTADO: "Resultado",
    APURACAO: "Apuração",
  };
  return mapa[grupo] ?? grupo;
}

export function tipoLabel(tipo: string): string {
  const mapa: Record<string, string> = {
    ATIVO: "Ativo",
    PASSIVO: "Passivo",
    PATRIMONIO_LIQUIDO: "Patrimônio líquido",
    RECEITA: "Receita",
    DESPESA: "Despesa",
    CUSTO: "Custo",
    APURACAO: "Apuração",
  };
  return mapa[tipo] ?? tipo;
}

export function operacaoLabel(tipo: string): string {
  const mapa: Record<string, string> = {
    MANUAL: "Manual",
    VENDA: "Venda",
    COMPRA: "Compra",
    SALDO_INICIAL: "Saldo inicial",
    ESTORNO: "Estorno",
    APURACAO: "Apuração",
    AJUSTE_ESTOQUE: "Ajuste de estoque",
  };
  return mapa[tipo] ?? tipo;
}

export function papelLabel(papel: string): string {
  const mapa: Record<string, string> = {
    ADMIN: "Administrador",
    CONTADOR: "Contador",
    AUXILIAR: "Auxiliar",
    CONSULTA: "Consulta",
  };
  return mapa[papel] ?? papel;
}

export function statusObrigacaoLabel(status: string): string {
  const mapa: Record<string, string> = {
    PENDENTE: "Pendente",
    PAGA: "Paga",
    ATRASADA: "Atrasada",
  };
  return mapa[status] ?? status;
}

export function primeiroDiaDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function mesesDoPeriodo(inicio: string, fim: string): string[] {
  const meses: string[] = [];
  let atual = primeiroDiaDoMes(inicio);
  const limite = primeiroDiaDoMes(fim);
  while (atual <= limite && meses.length < 60) {
    meses.push(atual.slice(0, 7));
    const [ano, mes] = atual.split("-").map(Number);
    atual = new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 10);
  }
  return meses;
}

export function nomeMes(chave: string): string {
  const [ano, mes] = chave.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, 1));
  return data
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" })
    .replace(".", "")
    .replace(" de ", "/");
}

export function normalizar(texto: string): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function soma<T>(lista: T[], seletor: (item: T) => number): number {
  return lista.reduce((total, item) => total + (seletor(item) || 0), 0);
}

export function unicoPor<T>(lista: T[], chave: (item: T) => string): T[] {
  const vistos = new Set<string>();
  return lista.filter((item) => {
    const k = chave(item);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

export function agruparPor<T>(lista: T[], chave: (item: T) => string): Record<string, T[]> {
  return lista.reduce<Record<string, T[]>>((acc, item) => {
    const k = chave(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

export function textoOuTraco(valor?: string | null): string {
  return valor && String(valor).trim() ? valor : "—";
}

export function mensagemErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === "string") return erro;
  return "Ocorreu um erro inesperado.";
}

export type AnyRecord = Record<string, any>;
