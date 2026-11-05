"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Calculator,
  Info,
  RotateCcw,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Alerta,
  Badge,
  BadgeStatus,
  Botao,
  Card,
  CardHeader,
  LinkBotao,
  LinhaResumo,
  PageHeader,
  StatCard,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { gerarBalanco, gerarDre } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda } from "@/lib/utils";

export default function ApuracaoPage() {
  const { estado, apurarResultado, notificar } = useApp();
  const periodo = { inicio: estado.periodo.inicio, fim: estado.periodo.fim };

  const dre = useMemo(() => gerarDre(estado.contas, estado.operacoes, periodo), [estado, periodo]);
  const balanco = useMemo(() => gerarBalanco(estado.contas, estado.operacoes, periodo), [estado, periodo]);

  const apuracoes = estado.operacoes.filter((op) => op.tipo === "APURACAO");
  const apuracaoAtiva = apuracoes.find((op) => op.status === "ATIVA");
  const receitasComSaldo = dre.receitas.filter((linha) => linha.valorCents !== 0);
  const despesasComSaldo = dre.despesas.filter((linha) => linha.valorCents !== 0);
  const resultado = dre.resultadoCents;
  const fechado = estado.periodo.status === "FECHADO";

  function apurar() {
    const resposta = apurarResultado();
    if (resposta.ok && resposta.data) {
      notificar(`Apuração ${resposta.data.numero} registrada: ${formatarMoeda(resultado)} transferido ao PL.`);
    } else {
      notificar(resposta.erro ?? "Não foi possível apurar.", "erro");
    }
  }

  return (
    <div>
      <PageHeader
        etiqueta="Movimentos"
        titulo="Apuração do Resultado"
        descricao="Encerra as contas de receita, despesa e custo e transfere o resultado líquido para o Patrimônio Líquido."
        acoes={
          apuracaoAtiva ? (
            <LinkBotao href={`/diario/${apuracaoAtiva.id}`} variante="secondary" icone={ArrowRight}>
              Ver apuração no Diário
            </LinkBotao>
          ) : (
            <Botao icone={Calculator} onClick={apurar} disabled={fechado || (dre.totalReceitasCents === 0 && dre.totalDespesasCents === 0)}>
              Apurar resultado
            </Botao>
          )
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Receitas" valor={formatarMoeda(dre.totalReceitasCents)} icone={TrendingUp} tom="emerald" />
        <StatCard titulo="Despesas e custos" valor={formatarMoeda(dre.totalDespesasCents)} icone={TrendingDown} tom="rose" />
        <StatCard
          titulo="Resultado"
          valor={formatarMoeda(resultado)}
          hint={resultado >= 0 ? "Lucro do exercício" : "Prejuízo do exercício"}
          icone={Scale}
          tom={resultado >= 0 ? "emerald" : "rose"}
        />
        <StatCard
          titulo="Situação"
          valor={apuracaoAtiva ? "Apurado" : "A apurar"}
          hint={apuracaoAtiva ? `Operação ${apuracaoAtiva.numero}` : "Resultado ainda nas contas 5.x/6.x"}
          icone={apuracaoAtiva ? CheckCircle2 : Calculator}
          tom={apuracaoAtiva ? "emerald" : "amber"}
        />
      </div>

      {apuracaoAtiva ? (
        <div className="mb-5">
          <Alerta
            tom="green"
            titulo={`Resultado já apurado em ${formatarData(apuracaoAtiva.data)}`}
            acao={
              <LinkBotao href={`/diario/${apuracaoAtiva.id}`} variante="secondary" tamanho="sm" icone={RotateCcw}>
                Abrir operação
              </LinkBotao>
            }
          >
            O saldo das contas de resultado zerou e o lucro/prejuízo foi transferido para Lucros
            Acumulados. Para refazer, estorne a apuração no Diário.
          </Alerta>
        </div>
      ) : (
        <div className="mb-5">
          <Alerta tom="amber" titulo="A apuração ainda não foi realizada">
            As receitas e despesas continuam abertas. O Balanço exibe o resultado pendente no PL. Ao
            apurar, os saldos são zerados e o lucro/prejuízo é transferido para a conta 4.0.3.
          </Alerta>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titulo="DRE antes da apuração"
            descricao="Base de cálculo do encerramento — mesmo layout do relatório DRE."
            acao={<LinkBotao href="/dre" variante="ghost" tamanho="sm">Abrir DRE completa</LinkBotao>}
          />
          <div className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Receitas operacionais</p>
            <div className="mt-2 space-y-1">
              {receitasComSaldo.length === 0 ? (
                <p className="text-xs text-slate-400">Sem receitas no período.</p>
              ) : (
                receitasComSaldo.map((linha) => (
                  <div key={linha.conta.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600">{linha.conta.codigo} — {linha.conta.nome}</span>
                    <span className="font-medium tabular-nums text-slate-800">{formatarMoeda(linha.valorCents)}</span>
                  </div>
                ))
              )}
            </div>
            <LinhaResumo rotulo="Total de receitas" valor={formatarMoeda(dre.totalReceitasCents)} destaque />

            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Despesas e custos operacionais</p>
            <div className="mt-2 space-y-1">
              {despesasComSaldo.length === 0 ? (
                <p className="text-xs text-slate-400">Sem despesas no período.</p>
              ) : (
                despesasComSaldo.map((linha) => (
                  <div key={linha.conta.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600">{linha.conta.codigo} — {linha.conta.nome}</span>
                    <span className="font-medium tabular-nums text-slate-800">{formatarMoeda(linha.valorCents)}</span>
                  </div>
                ))
              )}
            </div>
            <LinhaResumo rotulo="Total de despesas" valor={formatarMoeda(dre.totalDespesasCents)} destaque />

            <div className={cn("mt-4 rounded-xl px-4 py-3", resultado >= 0 ? "bg-emerald-50" : "bg-rose-50")}>
              <div className="flex items-center justify-between gap-3">
                <span className={cn("text-sm font-semibold", resultado >= 0 ? "text-emerald-900" : "text-rose-900")}>
                  {resultado >= 0 ? "Lucro líquido do exercício" : "Prejuízo líquido do exercício"}
                </span>
                <span className={cn("text-lg font-bold tabular-nums", resultado >= 0 ? "text-emerald-700" : "text-rose-700")}>
                  {formatarMoeda(resultado)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Como a apuração funciona</p>
            <ol className="mt-3 space-y-3 text-[11px] leading-relaxed text-slate-600">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">1</span>
                <span>Debita todas as contas de <strong>receita</strong> pelo saldo credor, zerando-as.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">2</span>
                <span>Credita todas as contas de <strong>despesa e custo</strong> pelo saldo devedor, zerando-as.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">3</span>
                <span>A conta de Apuração (7.0.1) recebe os dois lados e fecha a diferença.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">4</span>
                <span>O resultado líquido é transferido para <strong>Lucros Acumulados (4.0.3)</strong>.</span>
              </li>
            </ol>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Efeito no Balanço</p>
            <div className="mt-3 space-y-2 text-xs">
              <LinhaResumo rotulo="Ativo total" valor={formatarMoeda(balanco.totalAtivoCents)} />
              <LinhaResumo rotulo="Passivo total" valor={formatarMoeda(balanco.totalPassivoCents)} />
              <LinhaResumo rotulo="Patrimônio líquido" valor={formatarMoeda(balanco.totalPatrimonioCents)} destaque />
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> {balanco.equilibrado ? "Equação conferida" : "Equação não fecha"}
              </div>
            </div>
          </Card>

          <div className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-[11px] leading-relaxed text-sky-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            A apuração usa a data de hoje (dentro do exercício) e não interfere no DRE: o relatório ignora
            operações do tipo APURACAO.
          </div>
        </div>
      </div>

      {apuracoes.length > 0 ? (
        <Card className="mt-5">
          <CardHeader titulo="Histórico de apurações" descricao="Apurações ativas e estornadas permanecem registradas." icone={Calculator} />
          <Tabela>
            <thead>
              <tr>
                <Th>Operação</Th>
                <Th>Data</Th>
                <Th>Responsável</Th>
                <Th alinhar="center">Status</Th>
                <Th alinhar="right" />
              </tr>
            </thead>
            <tbody>
              {apuracoes.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50/70">
                  <Td className="font-mono text-[11px] text-slate-500">{op.numero}</Td>
                  <Td className="text-xs">{formatarData(op.data)}</Td>
                  <Td className="text-xs text-slate-500">{op.usuario}</Td>
                  <Td alinhar="center"><BadgeStatus status={op.status} /></Td>
                  <Td alinhar="right">
                    <Link href={`/diario/${op.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                      Detalhe <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Card>
      ) : null}
    </div>
  );
}
