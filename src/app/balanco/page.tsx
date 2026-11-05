"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Landmark, Printer, TriangleAlert } from "lucide-react";
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
  Td,
  Th,
  Tabela,
} from "@/components/ui";
import { gerarBalanco } from "@/lib/accounting";
import type { GrupoBalanco, LinhaBalanco } from "@/lib/types";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda } from "@/lib/utils";

export default function BalancoPage() {
  const { estado, empresa } = useApp();
  const [ate, setAte] = useState(estado.periodo.fim);

  const balanco = useMemo(
    () => gerarBalanco(estado.contas, estado.operacoes, { inicio: estado.periodo.inicio, fim: ate }),
    [estado.contas, estado.operacoes, estado.periodo.inicio, ate],
  );

  return (
    <div>
      <PageHeader
        etiqueta="Relatórios"
        titulo="Balanço Patrimonial"
        descricao="Posição patrimonial na data de corte. Ativo = Passivo + Patrimônio Líquido."
        acoes={
          <>
            <Badge tom={balanco.equilibrado ? "green" : "red"}>
              {balanco.equilibrado ? "Equilibrado" : "Não fecha"}
            </Badge>
            <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
              Imprimir / PDF
            </Botao>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Ativo total" valor={formatarMoeda(balanco.totalAtivoCents)} icone={Landmark} tom="indigo" />
        <StatCard titulo="Passivo exigível" valor={formatarMoeda(balanco.totalPassivoCents)} icone={Landmark} tom="amber" />
        <StatCard titulo="Patrimônio líquido" valor={formatarMoeda(balanco.totalPatrimonioCents)} icone={Landmark} tom="emerald" />
        <StatCard
          titulo="Passivo + PL"
          valor={formatarMoeda(balanco.totalPassivoPlCents)}
          hint={balanco.equilibrado ? "Igual ao Ativo" : "Divergência a investigar"}
          icone={balanco.equilibrado ? CheckCircle2 : TriangleAlert}
          tom={balanco.equilibrado ? "emerald" : "rose"}
        />
      </div>

      {balanco.resultadoPendenteCents !== 0 ? (
        <div className="mb-5 no-print">
          <Alerta tom="amber" titulo="Resultado do exercício ainda não apurado">
            O valor de {formatarMoeda(balanco.resultadoPendenteCents)} está apresentado no PL como
            “Resultado do Exercício (a apurar)”. Após a apuração, ele é transferido para Lucros
            Acumulados e essa linha desaparece.
          </Alerta>
        </div>
      ) : null}

      <Card className="mb-5 no-print">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <Campo label="Posição em" className="w-full sm:w-48">
            <CampoData valor={ate} onChange={setAte} />
          </Campo>
          <p className="pb-2 text-[11px] text-slate-400">
            Ativo e passivo acumulados desde o início do exercício até a data escolhida.
          </p>
        </div>
      </Card>

      <Card className="print-card">
        <div className="hidden border-b border-slate-100 px-5 py-4 print:block">
          <p className="text-sm font-semibold text-slate-900">{empresa.razaoSocial}</p>
          <p className="text-xs text-slate-500">
            CNPJ {empresa.cnpj} · Balanço Patrimonial · posição em {formatarData(ate)}
          </p>
        </div>
        <CardHeader
          titulo="Demonstração da posição patrimonial"
          descricao={`Posição em ${formatarData(ate)} · valores em R$`}
          icone={Landmark}
        />

        <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
          <div>
            <GrupoBalancoTabela
              titulo="ATIVO"
              grupos={[balanco.ativoCirculante, balanco.ativoNaoCirculante]}
              total={balanco.totalAtivoCents}
              totalRotulo="Total do Ativo"
              tom="indigo"
            />
          </div>
          <div>
            <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                PASSIVO E PATRIMÔNIO LÍQUIDO
              </h3>
            </div>
            <GrupoBalancoTabela
              titulo=""
              grupos={[balanco.passivoCirculante, balanco.passivoNaoCirculante]}
              total={balanco.totalPassivoCents}
              totalRotulo="Total do Passivo"
              tom="amber"
            />
            <GrupoBalancoTabela
              titulo=""
              grupos={[balanco.patrimonioLiquido]}
              total={balanco.totalPatrimonioCents}
              totalRotulo="Total do Patrimônio Líquido"
              tom="emerald"
            />
            <div className="flex items-center justify-between gap-3 border-t-2 border-slate-300 bg-slate-100/70 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Total do Passivo + PL
              </span>
              <span className="text-base font-bold tabular-nums text-slate-900">
                {formatarMoeda(balanco.totalPassivoPlCents)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            {balanco.equilibrado ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Ativo {formatarMoeda(balanco.totalAtivoCents)} = Passivo + PL{" "}
                {formatarMoeda(balanco.totalPassivoPlCents)}
              </>
            ) : (
              <>
                <TriangleAlert className="h-3.5 w-3.5 text-rose-600" />
                Divergência de {formatarMoeda(balanco.totalAtivoCents - balanco.totalPassivoPlCents)}
              </>
            )}
          </span>
          <span className="text-slate-400">Emitido em {formatarData(new Date().toISOString().slice(0, 10))}</span>
        </div>
      </Card>
    </div>
  );
}

function GrupoBalancoTabela({
  titulo,
  grupos,
  total,
  totalRotulo,
  tom,
}: {
  titulo: string;
  grupos: GrupoBalanco[];
  total: number;
  totalRotulo: string;
  tom: "indigo" | "amber" | "emerald";
}) {
  const cor = {
    indigo: "text-indigo-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
  }[tom];

  return (
    <div>
      {titulo ? (
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{titulo}</h3>
        </div>
      ) : null}
      {grupos.map((grupo) => (
        <div key={grupo.titulo + grupo.totalCents}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{grupo.titulo}</span>
            <span className={cn("text-[11px] font-semibold tabular-nums", cor)}>{formatarMoeda(grupo.totalCents)}</span>
          </div>
          <Tabela>
            <tbody>
              {grupo.linhas.length === 0 ? (
                <tr>
                  <Td colSpan={2} className="px-5 text-[11px] italic text-slate-400">
                    Sem saldos neste grupo.
                  </Td>
                </tr>
              ) : (
                agruparSubgrupos(grupo.linhas).map(([subgrupo, itens]) => (
                  <FragmentoSubgrupo key={subgrupo} subgrupo={subgrupo} itens={itens} />
                ))
              )}
            </tbody>
          </Tabela>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 border-t border-slate-300 bg-slate-50 px-5 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{totalRotulo}</span>
        <span className={cn("text-sm font-bold tabular-nums", cor)}>{formatarMoeda(total)}</span>
      </div>
    </div>
  );
}

function agruparSubgrupos(linhas: LinhaBalanco[]): Array<[string, LinhaBalanco[]]> {
  const mapa = new Map<string, LinhaBalanco[]>();
  for (const linha of linhas) {
    const chave = linha.subgrupo ?? linha.conta.grupo;
    const atual = mapa.get(chave) ?? [];
    atual.push(linha);
    mapa.set(chave, atual);
  }
  return [...mapa.entries()];
}

function FragmentoSubgrupo({ subgrupo, itens }: { subgrupo: string; itens: LinhaBalanco[] }) {
  const mostrarCabecalho = itens.length > 1 || subgrupo !== itens[0]?.conta.grupo;
  return (
    <>
      {mostrarCabecalho && subgrupo !== "PATRIMONIO_LIQUIDO" ? (
        <tr className="bg-white">
          <Td colSpan={2} className="py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {subgrupo.replaceAll("_", " ").toLowerCase()}
          </Td>
        </tr>
      ) : null}
      {itens.map((linha) => (
        <tr key={linha.conta.id} className="hover:bg-slate-50/60">
          <Td className="border-0 py-1.5 pl-8 text-xs text-slate-600">
            <span className="mr-1.5 font-mono text-[10px] text-slate-400">{linha.conta.codigo}</span>
            {linha.conta.nome}
          </Td>
          <Td alinhar="right" className="border-0 py-1.5 text-xs font-medium tabular-nums text-slate-800">
            {formatarMoeda(linha.valorCents)}
          </Td>
        </tr>
      ))}
    </>
  );
}
