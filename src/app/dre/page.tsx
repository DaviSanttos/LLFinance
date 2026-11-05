"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Printer, TrendingDown, TrendingUp } from "lucide-react";
import {
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
import { gerarDre } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda, hojeISO } from "@/lib/utils";

export default function DrePage() {
  const { estado, empresa } = useApp();
  const [de, setDe] = useState(estado.periodo.inicio);
  const [ate, setAte] = useState(estado.periodo.fim);

  const dre = useMemo(
    () => gerarDre(estado.contas, estado.operacoes, { inicio: de, fim: ate }),
    [estado.contas, estado.operacoes, de, ate],
  );

  const receitas = dre.receitas.filter((linha) => linha.valorCents !== 0);
  const despesas = dre.despesas.filter((linha) => linha.valorCents !== 0);
  const margem = dre.totalReceitasCents
    ? (dre.resultadoCents / dre.totalReceitasCents) * 100
    : 0;

  return (
    <div>
      <PageHeader
        etiqueta="Relatórios"
        titulo="Demonstração do Resultado do Exercício"
        descricao="Layout idêntico ao modelo do professor: receitas operacionais − despesas operacionais = lucro ou prejuízo líquido."
        acoes={
          <>
            <Badge tom={dre.resultadoCents >= 0 ? "green" : "red"}>
              {dre.resultadoCents >= 0 ? "Lucro" : "Prejuízo"}
            </Badge>
            <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
              Imprimir / PDF
            </Botao>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Receitas operacionais" valor={formatarMoeda(dre.totalReceitasCents)} icone={TrendingUp} tom="emerald" />
        <StatCard titulo="Despesas operacionais" valor={formatarMoeda(dre.totalDespesasCents)} icone={TrendingDown} tom="rose" />
        <StatCard
          titulo={dre.resultadoCents >= 0 ? "Lucro líquido" : "Prejuízo líquido"}
          valor={formatarMoeda(dre.resultadoCents)}
          icone={dre.resultadoCents >= 0 ? CheckCircle2 : TrendingDown}
          tom={dre.resultadoCents >= 0 ? "emerald" : "rose"}
        />
        <StatCard
          titulo="Margem líquida"
          valor={`${margem.toFixed(1).replace(".", ",")}%`}
          hint="Resultado sobre receitas"
          icone={TrendingUp}
          tom="sky"
        />
      </div>

      <Card className="mb-5 no-print">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <Campo label="De" className="w-full sm:w-44">
            <CampoData valor={de} onChange={setDe} />
          </Campo>
          <Campo label="Até" className="w-full sm:w-44">
            <CampoData valor={ate} onChange={setAte} />
          </Campo>
          <p className="ml-auto max-w-sm pb-1 text-[11px] leading-relaxed text-slate-400">
            Saldos iniciais e apurações são ignorados de propósito para que o DRE continue correto
            mesmo depois do encerramento.
          </p>
        </div>
      </Card>

      <Card className="print-card">
        <div className="hidden border-b border-slate-100 px-5 py-4 print:block">
          <p className="text-sm font-semibold text-slate-900">{empresa.razaoSocial}</p>
          <p className="text-xs text-slate-500">
            CNPJ {empresa.cnpj} · DRE · {formatarData(de)} a {formatarData(ate)}
          </p>
        </div>
        <CardHeader
          titulo="DRE — Demonstração do Resultado do Exercício"
          descricao={`Período de ${formatarData(de)} a ${formatarData(ate)} · emitido em ${formatarData(hojeISO())}`}
          icone={TrendingUp}
        />

        <div className="px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Receitas operacionais
          </p>
          <Tabela className="mt-2">
            <tbody>
              {receitas.length === 0 ? (
                <tr>
                  <Td className="text-xs italic text-slate-400">Nenhuma receita no período.</Td>
                </tr>
              ) : (
                receitas.map((linha) => (
                  <tr key={linha.conta.id}>
                    <Td className="border-0 py-1.5 pl-2 text-xs text-slate-600">
                      <span className="mr-1.5 font-mono text-[10px] text-slate-400">{linha.conta.codigo}</span>
                      {linha.conta.nome}
                    </Td>
                    <Td alinhar="right" className="border-0 py-1.5 text-xs font-medium tabular-nums text-slate-800">
                      {formatarMoeda(linha.valorCents)}
                    </Td>
                  </tr>
                ))
              )}
              <tr className="border-t border-slate-200">
                <Td className="py-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                  Total de Receitas (+)
                </Td>
                <Td alinhar="right" className="py-2 text-sm font-bold tabular-nums text-emerald-700">
                  {formatarMoeda(dre.totalReceitasCents)}
                </Td>
              </tr>
            </tbody>
          </Tabela>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Despesas operacionais
          </p>
          <Tabela className="mt-2">
            <tbody>
              {despesas.length === 0 ? (
                <tr>
                  <Td className="text-xs italic text-slate-400">Nenhuma despesa no período.</Td>
                </tr>
              ) : (
                despesas.map((linha) => (
                  <tr key={linha.conta.id}>
                    <Td className="border-0 py-1.5 pl-2 text-xs text-slate-600">
                      <span className="mr-1.5 font-mono text-[10px] text-slate-400">{linha.conta.codigo}</span>
                      {linha.conta.nome}
                    </Td>
                    <Td alinhar="right" className="border-0 py-1.5 text-xs font-medium tabular-nums text-slate-800">
                      {formatarMoeda(linha.valorCents)}
                    </Td>
                  </tr>
                ))
              )}
              <tr className="border-t border-slate-200">
                <Td className="py-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                  Total de Despesas (−)
                </Td>
                <Td alinhar="right" className="py-2 text-sm font-bold tabular-nums text-rose-700">
                  {formatarMoeda(dre.totalDespesasCents)}
                </Td>
              </tr>
            </tbody>
          </Tabela>

          <div
            className={cn(
              "mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4",
              dre.resultadoCents >= 0 ? "bg-emerald-50" : "bg-rose-50",
            )}
          >
            <div>
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  dre.resultadoCents >= 0 ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {dre.resultadoCents >= 0
                  ? "Lucro Líquido do Exercício"
                  : "Prejuízo Líquido do Exercício"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Receitas {formatarMoeda(dre.totalReceitasCents)} − Despesas{" "}
                {formatarMoeda(dre.totalDespesasCents)}
              </p>
            </div>
            <span
              className={cn(
                "text-2xl font-bold tabular-nums",
                dre.resultadoCents >= 0 ? "text-emerald-700" : "text-rose-700",
              )}
            >
              {formatarMoeda(dre.resultadoCents)}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-[10px] leading-relaxed text-slate-400">
          Estrutura conforme o modelo do professor: RECEITAS OPERACIONAIS → TOTAL DE RECEITAS (+) →
          DESPESAS OPERACIONAIS → TOTAL DE DESPESAS (−) → LUCRO/PREJUÍZO LÍQUIDO DO EXERCÍCIO.
          Operações de saldo inicial e apuração não entram no cálculo.
        </div>
      </Card>
    </div>
  );
}
