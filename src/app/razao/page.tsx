"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Printer, SearchX } from "lucide-react";
import {
  Badge,
  Botao,
  Campo,
  CampoData,
  Card,
  CardHeader,
  EmptyState,
  Input,
  LinhaResumo,
  PageHeader,
  Select,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { gerarRazao } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { formatarData, formatarMoeda, hojeISO, tipoLabel } from "@/lib/utils";

function RazaoConteudo() {
  const searchParams = useSearchParams();
  const { estado, empresa } = useApp();
  const [contaId, setContaId] = useState(searchParams.get("conta") ?? "");
  const [de, setDe] = useState(estado.periodo.inicio);
  const [ate, setAte] = useState(estado.periodo.fim);
  const [busca, setBusca] = useState("");

  const contas = useMemo(
    () =>
      estado.contas
        .filter((conta) => conta.analitica)
        .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR")),
    [estado.contas],
  );

  useEffect(() => {
    if (!contaId && contas.length > 0) setContaId(contas[0].id);
  }, [contaId, contas]);

  const conta = estado.contas.find((item) => item.id === contaId);

  const razao = useMemo(() => {
    if (!conta) return null;
    return gerarRazao(conta, estado.operacoes, { inicio: de, fim: ate });
  }, [conta, estado.operacoes, de, ate]);

  const movimentos = useMemo(() => {
    const lista = razao?.movimentos ?? [];
    if (!busca.trim()) return lista;
    const termo = busca.toLowerCase();
    return lista.filter(
      (mov) =>
        mov.historico.toLowerCase().includes(termo) || mov.numero.toLowerCase().includes(termo),
    );
  }, [razao, busca]);

  const totalDebitos = (razao?.movimentos ?? []).reduce((t, mov) => t + mov.debitoCents, 0);
  const totalCreditos = (razao?.movimentos ?? []).reduce((t, mov) => t + mov.creditoCents, 0);

  return (
    <div>
      <PageHeader
        etiqueta="Relatórios"
        titulo="Livro Razão"
        descricao="Movimentação analítica de uma conta, com saldo anterior, débitos, créditos e saldo acumulado."
        acoes={
          <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
            Imprimir / PDF
          </Botao>
        }
      />

      <Card className="mb-5 no-print">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <Campo label="Conta" className="w-full sm:w-80">
            <Select value={contaId} onChange={(e) => setContaId(e.target.value)}>
              {contas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.codigo} — {item.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="De" className="w-full sm:w-40">
            <CampoData valor={de} onChange={setDe} />
          </Campo>
          <Campo label="Até" className="w-full sm:w-40">
            <CampoData valor={ate} onChange={setAte} />
          </Campo>
          <Campo label="Buscar movimento" className="w-full sm:w-56">
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Histórico ou nº" />
          </Campo>
        </div>
      </Card>

      {!conta || !razao ? (
        <Card>
          <EmptyState titulo="Selecione uma conta" descricao="Escolha uma conta analítica para ver a movimentação." icone={SearchX} />
        </Card>
      ) : (
        <Card className="print-card">
          <div className="hidden border-b border-slate-100 px-5 py-4 print:block">
            <p className="text-sm font-semibold text-slate-900">{empresa.razaoSocial}</p>
            <p className="text-xs text-slate-500">
              CNPJ {empresa.cnpj} · Livro Razão · {formatarData(de)} a {formatarData(ate)}
            </p>
          </div>
          <CardHeader
            titulo={`${conta.codigo} — ${conta.nome}`}
            descricao={`${tipoLabel(conta.tipo)} · natureza ${conta.natureza.toLowerCase()} · ${razao.movimentos.length} movimento(s)`}
            icone={BookOpen}
            acao={<Badge tom="indigo">{conta.grupo.replaceAll("_", " ").toLowerCase()}</Badge>}
          />

          <div className="grid gap-3 border-b border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
            <Resumo rotulo="Saldo anterior" valor={formatarMoeda(razao.saldoAnteriorCents)} />
            <Resumo rotulo="Débitos do período" valor={formatarMoeda(totalDebitos)} tom="indigo" />
            <Resumo rotulo="Créditos do período" valor={formatarMoeda(totalCreditos)} tom="emerald" />
            <Resumo rotulo="Saldo final" valor={formatarMoeda(razao.saldoFinalCents)} destaque />
          </div>

          {movimentos.length === 0 ? (
            <EmptyState titulo="Sem movimentação no período" descricao="Altere as datas ou escolha outra conta." icone={SearchX} />
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Operação</Th>
                  <Th>Histórico</Th>
                  <Th alinhar="right">Débito</Th>
                  <Th alinhar="right">Crédito</Th>
                  <Th alinhar="right">Saldo</Th>
                  <Th alinhar="center">Status</Th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((mov, indice) => (
                  <tr key={`${mov.operacaoId}-${indice}`} className="hover:bg-slate-50/70">
                    <Td className="whitespace-nowrap text-xs">{formatarData(mov.data)}</Td>
                    <Td className="font-mono text-[11px] text-slate-500">{mov.numero}</Td>
                    <Td className="max-w-[340px]">
                      <p className="truncate text-xs text-slate-700">{mov.historico}</p>
                    </Td>
                    <Td alinhar="right" className="text-xs font-medium">
                      {mov.debitoCents ? formatarMoeda(mov.debitoCents) : "—"}
                    </Td>
                    <Td alinhar="right" className="text-xs font-medium">
                      {mov.creditoCents ? formatarMoeda(mov.creditoCents) : "—"}
                    </Td>
                    <Td alinhar="right" className="text-xs font-semibold text-slate-800">
                      {formatarMoeda(mov.saldoCents)}
                    </Td>
                    <Td alinhar="center">
                      <Badge tom={mov.status === "ATIVA" ? "green" : "red"}>
                        {mov.status === "ATIVA" ? "Ativa" : "Estornada"}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80">
                  <Td colSpan={3} className="font-semibold text-slate-700">Totais do período</Td>
                  <Td alinhar="right" className="font-semibold text-indigo-700">{formatarMoeda(totalDebitos)}</Td>
                  <Td alinhar="right" className="font-semibold text-emerald-700">{formatarMoeda(totalCreditos)}</Td>
                  <Td alinhar="right" className="font-semibold text-slate-900">{formatarMoeda(razao.saldoFinalCents)}</Td>
                  <Td />
                </tr>
              </tfoot>
            </Tabela>
          )}

          <div className="border-t border-slate-100 px-5 py-3">
            <LinhaResumo
              rotulo={`Saldo final da conta ${conta.codigo}`}
              valor={formatarMoeda(razao.saldoFinalCents)}
              destaque
              tom={razao.saldoFinalCents >= 0 ? "positivo" : "negativo"}
            />
            <p className="text-[10px] text-slate-400">
              Saldo calculado pela natureza {conta.natureza.toLowerCase()} da conta · emitido em {formatarData(hojeISO())}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function Resumo({ rotulo, valor, tom, destaque }: { rotulo: string; valor: string; tom?: "indigo" | "emerald"; destaque?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{rotulo}</p>
      <p
        className={`mt-0.5 text-sm font-semibold tabular-nums ${
          destaque ? "text-slate-900" : tom === "indigo" ? "text-indigo-600" : tom === "emerald" ? "text-emerald-600" : "text-slate-700"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

export default function RazaoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Carregando razão…</div>}>
      <RazaoConteudo />
    </Suspense>
  );
}
