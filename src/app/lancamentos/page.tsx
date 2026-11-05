"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Filter, PlusCircle, SearchX } from "lucide-react";
import {
  Badge,
  BadgeStatus,
  Botao,
  Busca,
  Card,
  CardHeader,
  EmptyState,
  LinkBotao,
  PageHeader,
  Select,
  StatCard,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { valorOperacao } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import type { StatusOperacao, TipoOperacao } from "@/lib/types";
import { formatarData, formatarMoeda, normalizar, operacaoLabel } from "@/lib/utils";

const TIPOS: TipoOperacao[] = [
  "MANUAL",
  "VENDA",
  "COMPRA",
  "SALDO_INICIAL",
  "APURACAO",
  "AJUSTE_ESTOQUE",
  "ESTORNO",
];

export default function LancamentosPage() {
  const { estado } = useApp();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const [de, setDe] = useState(estado.periodo.inicio);
  const [ate, setAte] = useState(estado.periodo.fim);

  const operacoes = useMemo(() => {
    const termo = normalizar(busca);
    return [...estado.operacoes]
      .filter((op) => {
        if (tipo && op.tipo !== tipo) return false;
        if (status && op.status !== status) return false;
        if (de && op.data < de) return false;
        if (ate && op.data > ate) return false;
        if (!termo) return true;
        return (
          normalizar(op.historico).includes(termo) ||
          normalizar(op.numero).includes(termo) ||
          normalizar(op.usuario).includes(termo)
        );
      })
      .sort((a, b) => {
        const porData = b.data.localeCompare(a.data);
        return porData !== 0 ? porData : b.numero.localeCompare(a.numero);
      });
  }, [estado.operacoes, busca, tipo, status, de, ate]);

  const ativas = operacoes.filter((op) => op.status === "ATIVA");
  const estornadas = operacoes.filter((op) => op.status === "ESTORNADA");
  const totalAtivas = ativas.reduce((total, op) => total + valorOperacao(op), 0);

  function limpar() {
    setBusca("");
    setTipo("");
    setStatus("");
    setDe(estado.periodo.inicio);
    setAte(estado.periodo.fim);
  }

  return (
    <div>
      <PageHeader
        etiqueta="Movimentos"
        titulo="Lançamentos"
        descricao="Todos os registros contábeis do exercício. Nada é excluído: operações são estornadas com trilha de auditoria."
        acoes={
          <LinkBotao href="/lancamentos/novo" icone={PlusCircle}>
            Novo lançamento
          </LinkBotao>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Operações" valor={String(operacoes.length)} icone={BookOpen} tom="indigo" />
        <StatCard titulo="Ativas" valor={String(ativas.length)} icone={BookOpen} tom="emerald" />
        <StatCard titulo="Estornadas" valor={String(estornadas.length)} icone={BookOpen} tom="rose" />
        <StatCard titulo="Valor ativo" valor={formatarMoeda(totalAtivas)} icone={BookOpen} tom="sky" />
      </div>

      <Card>
        <CardHeader
          titulo="Livro de lançamentos"
          descricao={`${operacoes.length} resultado(s)`}
          icone={Filter}
          acao={
            <Botao variante="ghost" tamanho="sm" onClick={limpar}>
              Limpar filtros
            </Botao>
          }
        />
        <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-5 py-3">
          <Busca valor={busca} onChange={setBusca} placeholder="Nº, histórico ou usuário…" className="w-full sm:w-64" />
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full sm:w-44">
            <option value="">Todos os tipos</option>
            {TIPOS.map((item) => (
              <option key={item} value={item}>
                {operacaoLabel(item)}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-40">
            <option value="">Todos os status</option>
            {(["ATIVA", "ESTORNADA", "SUBSTITUIDA"] as StatusOperacao[]).map((item) => (
              <option key={item} value={item}>
                {item.charAt(0) + item.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          <div className="flex items-end gap-2">
            <label className="text-[11px] font-medium text-slate-500">
              De
              <input
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="mt-1 block h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
            </label>
            <label className="text-[11px] font-medium text-slate-500">
              Até
              <input
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className="mt-1 block h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
            </label>
          </div>
        </div>

        {operacoes.length === 0 ? (
          <EmptyState
            titulo="Nenhum lançamento encontrado"
            descricao="Ajuste os filtros ou registre um novo lançamento contábil."
            icone={SearchX}
            acao={<LinkBotao href="/lancamentos/novo" variante="secondary" icone={PlusCircle}>Novo lançamento</LinkBotao>}
          />
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Número</Th>
                <Th>Data</Th>
                <Th>Histórico</Th>
                <Th>Tipo</Th>
                <Th>Usuário</Th>
                <Th alinhar="right">Valor</Th>
                <Th alinhar="center">Status</Th>
                <Th alinhar="right" />
              </tr>
            </thead>
            <tbody>
              {operacoes.map((operacao) => (
                <tr key={operacao.id} className="group hover:bg-slate-50/70">
                  <Td className="font-mono text-[11px] font-semibold text-slate-500">
                    {operacao.numero}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{formatarData(operacao.data)}</Td>
                  <Td className="max-w-[360px]">
                    <p className="truncate font-medium text-slate-800">{operacao.historico}</p>
                    {operacao.documento ? (
                      <p className="text-[10px] text-slate-400">
                        {operacao.documento.numero} · {operacao.documento.parceiro}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    <Badge tom={operacao.tipo === "VENDA" ? "blue" : operacao.tipo === "COMPRA" ? "purple" : "slate"}>
                      {operacaoLabel(operacao.tipo)}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-slate-500">{operacao.usuario}</Td>
                  <Td alinhar="right" className="font-semibold">
                    {formatarMoeda(valorOperacao(operacao))}
                  </Td>
                  <Td alinhar="center">
                    <BadgeStatus status={operacao.status} />
                  </Td>
                  <Td alinhar="right">
                    <Link
                      href={`/diario/${operacao.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Ver <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Card>
    </div>
  );
}
