"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BookText,
  Boxes,
  CalendarClock,
  Download,
  FileText,
  Landmark,
  Printer,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Botao,
  Card,
  CardHeader,
  Campo,
  CampoData,
  LinkBotao,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { calcularEstoque, gerarBalanco, gerarDre, gerarRazao } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { baixarArquivo, formatarData, formatarMoeda, hojeISO, soma } from "@/lib/utils";

const RELATORIOS = [
  {
    href: "/diario",
    titulo: "Livro Diário",
    descricao: "Todas as operações em ordem cronológica, com partidas e documentos.",
    icone: BookText,
    tom: "indigo" as const,
  },
  {
    href: "/razao",
    titulo: "Livro Razão",
    descricao: "Movimentação analítica conta a conta, com saldo acumulado.",
    icone: BookOpen,
    tom: "violet" as const,
  },
  {
    href: "/balancete",
    titulo: "Balancete de Verificação",
    descricao: "Saldos devedores e credores com conferência da partida dobrada.",
    icone: Scale,
    tom: "sky" as const,
  },
  {
    href: "/balanco",
    titulo: "Balanço Patrimonial",
    descricao: "Ativo, passivo e patrimônio líquido na data de corte.",
    icone: Landmark,
    tom: "emerald" as const,
  },
  {
    href: "/dre",
    titulo: "DRE",
    descricao: "Resultado do exercício no layout do professor.",
    icone: TrendingUp,
    tom: "amber" as const,
  },
  {
    href: "/estoque",
    titulo: "Estoque",
    descricao: "Posição física, custo médio e movimentações por produto.",
    icone: Boxes,
    tom: "rose" as const,
  },
];

export default function RelatoriosPage() {
  const { estado, empresa, exportarDados, notificar } = useApp();
  const [de, setDe] = useState(estado.periodo.inicio);
  const [ate, setAte] = useState(estado.periodo.fim);

  const { dre, balanco, estoque } = useMemo(() => {
    const periodo = { inicio: de, fim: ate };
    return {
      dre: gerarDre(estado.contas, estado.operacoes, periodo),
      balanco: gerarBalanco(estado.contas, estado.operacoes, periodo),
      estoque: calcularEstoque(estado.produtos, estado.movimentosEstoque),
    };
  }, [estado, de, ate]);

  const totalEstoque = soma(estoque, (item) => item.valorTotalCents);
  const contasComMovimento = useMemo(
    () =>
      estado.contas.filter((conta) =>
        estado.operacoes.some((op) => op.linhas.some((linha) => linha.contaId === conta.id)),
      ).length,
    [estado.contas, estado.operacoes],
  );

  function exportar() {
    baixarArquivo(`llfinance-backup-${hojeISO()}.json`, exportarDados());
    notificar("Backup JSON exportado.");
  }

  return (
    <div>
      <PageHeader
        etiqueta="Relatórios"
        titulo="Central de Relatórios"
        descricao="Acesse cada demonstração ou gere a impressão completa de todos os livros em um único PDF."
        acoes={
          <>
            <Botao variante="secondary" icone={Download} onClick={exportar}>
              Exportar backup
            </Botao>
            <LinkBotao href="/relatorios/completo" icone={FileText}>
              Relatório completo
            </LinkBotao>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Ativo total" valor={formatarMoeda(balanco.totalAtivoCents)} icone={Landmark} tom="indigo" />
        <StatCard titulo="Resultado" valor={formatarMoeda(dre.resultadoCents)} hint={dre.resultadoCents >= 0 ? "Lucro" : "Prejuízo"} icone={TrendingUp} tom={dre.resultadoCents >= 0 ? "emerald" : "rose"} />
        <StatCard titulo="Estoque" valor={formatarMoeda(totalEstoque)} icone={Boxes} tom="violet" />
        <StatCard titulo="Contas com movimento" valor={String(contasComMovimento)} icone={BookOpen} tom="sky" />
      </div>

      <Card className="mb-5 no-print">
        <CardHeader titulo="Período dos relatórios" descricao="O filtro abaixo é usado no relatório completo e nos atalhos." />
        <div className="flex flex-wrap items-end gap-3 p-5">
          <Campo label="De" className="w-full sm:w-44">
            <CampoData valor={de} onChange={setDe} />
          </Campo>
          <Campo label="Até" className="w-full sm:w-44">
            <CampoData valor={ate} onChange={setAte} />
          </Campo>
          <div className="ml-auto flex flex-wrap gap-2">
            <Badge tom="slate">Exercício {estado.periodo.exercicio}</Badge>
            <Badge tom={estado.periodo.status === "ABERTO" ? "green" : "red"}>
              {estado.periodo.status}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RELATORIOS.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="h-full p-5 transition group-hover:border-indigo-200 group-hover:shadow-md">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    item.tom === "indigo"
                      ? "bg-indigo-50 text-indigo-600"
                      : item.tom === "violet"
                        ? "bg-violet-50 text-violet-600"
                        : item.tom === "sky"
                          ? "bg-sky-50 text-sky-600"
                          : item.tom === "emerald"
                            ? "bg-emerald-50 text-emerald-600"
                            : item.tom === "amber"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-rose-50 text-rose-600"
                  }`}
                >
                  <item.icone className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.titulo}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.descricao}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader
          titulo="Pacote completo"
          descricao="Um único documento com capa, DRE, Balanço, Balancete, Diário, Razão de todas as contas, Estoque, Obrigações e Auditoria."
          icone={FileText}
          acao={
            <div className="flex gap-2">
              <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
                Imprimir página
              </Botao>
              <LinkBotao href="/relatorios/completo" icone={ArrowRight}>
                Abrir completo
              </LinkBotao>
            </div>
          }
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <ItemPacote icone={TrendingUp} titulo="DRE" valor={formatarMoeda(dre.resultadoCents)} />
          <ItemPacote icone={Landmark} titulo="Balanço" valor={formatarMoeda(balanco.totalAtivoCents)} />
          <ItemPacote icone={ShieldCheck} titulo="Auditoria" valor={`${estado.auditoria.length} eventos`} />
          <ItemPacote icone={CalendarClock} titulo="Obrigações" valor={`${estado.obrigacoes.filter((o) => o.status !== "PAGA").length} abertas`} />
        </div>
        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] text-slate-500">
          Empresa: <strong className="text-slate-700">{empresa.razaoSocial}</strong> · CNPJ {empresa.cnpj} ·
          emitido em {formatarData(hojeISO())}
        </div>
      </Card>
    </div>
  );
}

function ItemPacote({
  icone: Icone,
  titulo,
  valor,
}: {
  icone: typeof Wallet;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5">
      <Icone className="h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">{titulo}</p>
        <p className="truncate text-xs font-semibold text-slate-700">{valor}</p>
      </div>
    </div>
  );
}
