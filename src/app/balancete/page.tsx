"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Printer, Scale, TriangleAlert } from "lucide-react";
import {
  Alerta,
  Badge,
  Botao,
  Campo,
  CampoData,
  Card,
  CardHeader,
  PageHeader,
  StatCard,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { gerarBalancete, resumoBalancete } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda, hojeISO, tipoLabel } from "@/lib/utils";

export default function BalancetePage() {
  const { estado, empresa } = useApp();
  const [de, setDe] = useState(estado.periodo.inicio);
  const [ate, setAte] = useState(estado.periodo.fim);

  const linhas = useMemo(
    () => gerarBalancete(estado.contas, estado.operacoes, { inicio: de, fim: ate }),
    [estado.contas, estado.operacoes, de, ate],
  );
  const resumo = useMemo(() => resumoBalancete(linhas), [linhas]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof linhas>();
    for (const linha of linhas) {
      const raiz = linha.conta.codigo[0];
      const rotulo =
        raiz === "1" || raiz === "2"
          ? "Ativo"
          : raiz === "3"
            ? "Passivo"
            : raiz === "4"
              ? "Patrimônio Líquido"
              : raiz === "5"
                ? "Custos e Despesas"
                : raiz === "6"
                  ? "Receitas"
                  : "Apuração";
      const atual = mapa.get(rotulo) ?? [];
      atual.push(linha);
      mapa.set(rotulo, atual);
    }
    return [...mapa.entries()];
  }, [linhas]);

  return (
    <div>
      <PageHeader
        etiqueta="Relatórios"
        titulo="Balancete de Verificação"
        descricao="Confere o método das partidas dobradas: débitos = créditos e saldos devedores = saldos credores."
        acoes={
          <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
            Imprimir / PDF
          </Botao>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Débitos do período" valor={formatarMoeda(resumo.totalDebitosCents)} icone={Scale} tom="indigo" />
        <StatCard titulo="Créditos do período" valor={formatarMoeda(resumo.totalCreditosCents)} icone={Scale} tom="emerald" />
        <StatCard titulo="Saldos devedores" valor={formatarMoeda(resumo.totalSaldosDevedoresCents)} icone={Scale} tom="sky" />
        <StatCard titulo="Saldos credores" valor={formatarMoeda(resumo.totalSaldosCredoresCents)} icone={Scale} tom="violet" />
      </div>

      <div className="mb-5">
        {resumo.fecha ? (
          <Alerta tom="green" titulo="Balancete fechado">
            Débitos e créditos conferem em {formatarMoeda(resumo.totalDebitosCents)}. O período está apto a
            ser fechado.
          </Alerta>
        ) : (
          <Alerta tom="red" titulo="Balancete não fecha">
            Há divergência entre os totais. Verifique os lançamentos antes de fechar o período.
          </Alerta>
        )}
      </div>

      <Card className="mb-5 no-print">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <Campo label="De" className="w-full sm:w-44">
            <CampoData valor={de} onChange={setDe} />
          </Campo>
          <Campo label="Até" className="w-full sm:w-44">
            <CampoData valor={ate} onChange={setAte} />
          </Campo>
          <div className="ml-auto flex items-center gap-2 pb-1">
            {resumo.fecha ? (
              <Badge tom="green"><CheckCircle2 className="h-3 w-3" /> Fechado</Badge>
            ) : (
              <Badge tom="red"><TriangleAlert className="h-3 w-3" /> Divergente</Badge>
            )}
          </div>
        </div>
      </Card>

      <Card className="print-card">
        <div className="hidden border-b border-slate-100 px-5 py-4 print:block">
          <p className="text-sm font-semibold text-slate-900">{empresa.razaoSocial}</p>
          <p className="text-xs text-slate-500">
            CNPJ {empresa.cnpj} · Balancete de Verificação · {formatarData(de)} a {formatarData(ate)}
          </p>
        </div>
        <CardHeader
          titulo="Balancete analítico"
          descricao={`${linhas.length} conta(s) com movimentação · emitido em ${formatarData(hojeISO())}`}
          icone={Scale}
        />

        <Tabela>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Conta</Th>
              <Th>Tipo</Th>
              <Th alinhar="right">Saldo anterior</Th>
              <Th alinhar="right">Débitos</Th>
              <Th alinhar="right">Créditos</Th>
              <Th alinhar="right">Saldo atual</Th>
              <Th alinhar="center">D/C</Th>
            </tr>
          </thead>
          <tbody>
            {grupos.map(([grupo, itens]) => (
              <GrupoBalancete key={grupo} grupo={grupo} itens={itens} />
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/80 font-semibold">
              <Td colSpan={3} className="text-slate-800">Totais gerais</Td>
              <Td alinhar="right" className="text-slate-800">—</Td>
              <Td alinhar="right" className="text-indigo-700">{formatarMoeda(resumo.totalDebitosCents)}</Td>
              <Td alinhar="right" className="text-emerald-700">{formatarMoeda(resumo.totalCreditosCents)}</Td>
              <Td alinhar="right" className="text-slate-900">—</Td>
              <Td />
            </tr>
            <tr className="bg-slate-50/80 text-xs">
              <Td colSpan={6} className="text-slate-600">Saldos devedores × saldos credores</Td>
              <Td alinhar="right" className="font-semibold text-slate-800">
                {formatarMoeda(resumo.totalSaldosDevedoresCents)} / {formatarMoeda(resumo.totalSaldosCredoresCents)}
              </Td>
              <Td alinhar="center">
                {resumo.fecha ? <Badge tom="green">OK</Badge> : <Badge tom="red">Diferença</Badge>}
              </Td>
            </tr>
          </tfoot>
        </Tabela>
      </Card>
    </div>
  );
}

function GrupoBalancete({
  grupo,
  itens,
}: {
  grupo: string;
  itens: Array<{
    conta: { id: string; codigo: string; nome: string; tipo: string };
    saldoAnteriorCents: number;
    debitosCents: number;
    creditosCents: number;
    saldoAtualCents: number;
    lado: "D" | "C";
    saldoNormalCents: number;
  }>;
}) {
  const totalDebitos = itens.reduce((t, item) => t + item.debitosCents, 0);
  const totalCreditos = itens.reduce((t, item) => t + item.creditosCents, 0);
  return (
    <>
      <tr className="bg-slate-50/60">
        <Td colSpan={8} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {grupo}
        </Td>
      </tr>
      {itens.map((linha) => (
        <tr key={linha.conta.id} className="hover:bg-slate-50/70">
          <Td className="font-mono text-[11px] text-slate-500">{linha.conta.codigo}</Td>
          <Td className="text-xs font-medium text-slate-800">{linha.conta.nome}</Td>
          <Td className="text-[10px] uppercase tracking-wide text-slate-400">{tipoLabel(linha.conta.tipo)}</Td>
          <Td alinhar="right" className="text-xs">{formatarMoeda(linha.saldoAnteriorCents)}</Td>
          <Td alinhar="right" className="text-xs">{formatarMoeda(linha.debitosCents)}</Td>
          <Td alinhar="right" className="text-xs">{formatarMoeda(linha.creditosCents)}</Td>
          <Td alinhar="right" className="text-xs font-semibold text-slate-800">{formatarMoeda(linha.saldoAtualCents)}</Td>
          <Td alinhar="center">
            <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold", linha.lado === "D" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700")}>
              {linha.lado}
            </span>
          </Td>
        </tr>
      ))}
      <tr className="border-b border-slate-200 bg-white">
        <Td colSpan={3} className="text-[11px] font-semibold text-slate-500">Subtotal {grupo}</Td>
        <Td alinhar="right" className="text-xs font-semibold">—</Td>
        <Td alinhar="right" className="text-xs font-semibold text-indigo-600">{formatarMoeda(totalDebitos)}</Td>
        <Td alinhar="right" className="text-xs font-semibold text-emerald-600">{formatarMoeda(totalCreditos)}</Td>
        <Td colSpan={2} />
      </tr>
    </>
  );
}
