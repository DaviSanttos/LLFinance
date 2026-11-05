"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookText, Printer, SearchX } from "lucide-react";
import {
  Badge,
  BadgeStatus,
  Botao,
  Busca,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { totalOperacao, valorOperacao } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda, normalizar, operacaoLabel } from "@/lib/utils";

export default function DiarioPage() {
  const { estado, empresa } = useApp();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [somenteAtivas, setSomenteAtivas] = useState(false);
  const [de, setDe] = useState(estado.periodo.inicio);
  const [ate, setAte] = useState(estado.periodo.fim);

  const contaPorId = useMemo(
    () => new Map(estado.contas.map((conta) => [conta.id, conta])),
    [estado.contas],
  );

  const operacoes = useMemo(() => {
    const termo = normalizar(busca);
    return [...estado.operacoes]
      .filter((op) => {
        if (somenteAtivas && op.status !== "ATIVA") return false;
        if (tipo && op.tipo !== tipo) return false;
        if (de && op.data < de) return false;
        if (ate && op.data > ate) return false;
        if (!termo) return true;
        return (
          normalizar(op.historico).includes(termo) ||
          normalizar(op.numero).includes(termo) ||
          normalizar(op.documento?.parceiro ?? "").includes(termo)
        );
      })
      .sort((a, b) => a.data.localeCompare(b.data) || a.numero.localeCompare(b.numero));
  }, [estado.operacoes, busca, tipo, somenteAtivas, de, ate]);

  const totalDebitos = operacoes
    .filter((op) => op.status === "ATIVA")
    .reduce((total, op) => total + totalOperacao(op), 0);

  const tipos = [...new Set(estado.operacoes.map((op) => op.tipo))];

  return (
    <div>
      <PageHeader
        etiqueta="Relatórios"
        titulo="Livro Diário"
        descricao="Registro cronológico de todas as operações, com partidas, documento de origem e status."
        acoes={
          <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
            Imprimir / PDF
          </Botao>
        }
      />

      <Card className="print-card">
        <div className="hidden border-b border-slate-100 px-5 py-4 print:block">
          <p className="text-sm font-semibold text-slate-900">{empresa.razaoSocial}</p>
          <p className="text-xs text-slate-500">
            CNPJ {empresa.cnpj} · Livro Diário · Exercício {estado.periodo.exercicio}
          </p>
        </div>
        <CardHeader
          titulo="Lançamentos do período"
          descricao={`${operacoes.length} operação(ões) · débitos ativos de ${formatarMoeda(totalDebitos)}`}
          icone={BookText}
          className="no-print"
        />
        <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-5 py-3 no-print">
          <Busca valor={busca} onChange={setBusca} placeholder="Histórico, número ou parceiro…" className="w-full sm:w-64" />
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full sm:w-44">
            <option value="">Todos os tipos</option>
            {tipos.map((item) => (
              <option key={item} value={item}>{operacaoLabel(item)}</option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <input type="checkbox" checked={somenteAtivas} onChange={(e) => setSomenteAtivas(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Somente ativas
          </label>
          <label className="text-[11px] font-medium text-slate-500">
            De
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="mt-1 block h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label className="text-[11px] font-medium text-slate-500">
            Até
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="mt-1 block h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
        </div>

        {operacoes.length === 0 ? (
          <EmptyState titulo="Nenhum lançamento no período" descricao="Altere os filtros para visualizar outras operações." icone={SearchX} />
        ) : (
          <div className="divide-y divide-slate-100">
            {operacoes.map((operacao) => (
              <article key={operacao.id} className="px-5 py-4 print-compact print-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">{operacao.numero}</span>
                      <Badge tom={operacao.tipo === "VENDA" ? "blue" : operacao.tipo === "COMPRA" ? "purple" : "slate"}>
                        {operacaoLabel(operacao.tipo)}
                      </Badge>
                      <BadgeStatus status={operacao.status} />
                      <span className="text-[11px] text-slate-400">{formatarData(operacao.data)}</span>
                    </div>
                    <p className={cn("mt-1 text-sm font-semibold text-slate-800", operacao.status === "ESTORNADA" && "line-through decoration-rose-300")}>
                      {operacao.historico}
                    </p>
                    {operacao.documento ? (
                      <p className="text-[11px] text-slate-400">
                        {operacao.documento.numero} · {operacao.documento.parceiro} ·{" "}
                        {operacao.documento.condicao === "AVISTA" ? "à vista" : "a prazo"}
                      </p>
                    ) : null}
                    {operacao.motivoEstorno ? (
                      <p className="mt-1 text-[11px] text-rose-600">Motivo do estorno: {operacao.motivoEstorno}</p>
                    ) : null}
                    {operacao.reversalOfId ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Estorno de{" "}
                        <Link href={`/diario/${operacao.reversalOfId}`} className="font-semibold text-indigo-600 hover:underline">
                          operação original
                        </Link>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-semibold tabular-nums", operacao.status === "ESTORNADA" ? "text-slate-400" : "text-slate-800")}>
                      {formatarMoeda(valorOperacao(operacao))}
                    </span>
                    <Link href={`/diario/${operacao.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 no-print">
                      Detalhe <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="mt-2 overflow-hidden rounded-xl border border-slate-100">
                  <Tabela>
                    <thead>
                      <tr>
                        <Th>Conta</Th>
                        <Th>Código</Th>
                        <Th alinhar="right">Débito</Th>
                        <Th alinhar="right">Crédito</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {operacao.linhas.map((linha) => {
                        const conta = contaPorId.get(linha.contaId);
                        return (
                          <tr key={linha.id}>
                            <Td className={cn("text-xs", operacao.status === "ESTORNADA" && "text-slate-400")}>{conta?.nome ?? linha.contaId}</Td>
                            <Td className="font-mono text-[10px] text-slate-400">{conta?.codigo}</Td>
                            <Td alinhar="right" className={cn("text-xs", linha.tipo === "CREDITO" && "text-slate-300")}>
                              {linha.tipo === "DEBITO" ? formatarMoeda(linha.valorCents) : "—"}
                            </Td>
                            <Td alinhar="right" className={cn("text-xs", linha.tipo === "DEBITO" && "text-slate-300")}>
                              {linha.tipo === "CREDITO" ? formatarMoeda(linha.valorCents) : "—"}
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Tabela>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-[11px] text-slate-500">
          <span>Total de débitos das operações ativas</span>
          <span className="text-sm font-semibold tabular-nums text-slate-800">{formatarMoeda(totalDebitos)}</span>
        </div>
      </Card>
    </div>
  );
}
