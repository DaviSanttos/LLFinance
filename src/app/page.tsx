"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BookOpen,
  Boxes,
  Calculator,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Landmark,
  PackagePlus,
  PlusCircle,
  Scale,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  calcularEstoque,
  calcularSaldos,
  gerarBalanco,
  gerarDre,
  serieMensal,
  valorOperacao,
} from "@/lib/accounting";
import { CONTA } from "@/lib/mock-data";
import { useApp } from "@/lib/store";
import {
  cn,
  diferencaEmDias,
  formatarData,
  formatarMoeda,
  formatarQuantidade,
  hojeISO,
  nomeMes,
  operacaoLabel,
  soma,
} from "@/lib/utils";
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
} from "@/components/ui";

const CORES_ATIVO = ["#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#f43f5e"];

export default function DashboardPage() {
  const { estado } = useApp();

  const dados = useMemo(() => {
    const periodo = { inicio: estado.periodo.inicio, fim: estado.periodo.fim };
    const saldos = calcularSaldos(estado.contas, estado.operacoes, periodo);
    const porConta = new Map(saldos.map((linha) => [linha.conta.id, linha.saldoAtualCents]));
    const dre = gerarDre(estado.contas, estado.operacoes, periodo);
    const balanco = gerarBalanco(estado.contas, estado.operacoes, periodo);
    const estoque = calcularEstoque(estado.produtos, estado.movimentosEstoque);
    const estoqueTotal = soma(estoque, (item) => item.valorTotalCents);
    const estoqueQtd = soma(estoque, (item) => item.quantidade);
    const caixa = porConta.get(CONTA.caixa) ?? 0;
    const bancos = porConta.get(CONTA.bancos) ?? 0;
    const saldoContabilEstoque = porConta.get(CONTA.estoques) ?? 0;
    const apuracaoAtiva = estado.operacoes.some(
      (op) => op.tipo === "APURACAO" && op.status !== "ESTORNADA",
    );
    const obrigacoesAbertas = estado.obrigacoes
      .filter((obrigacao) => obrigacao.status !== "PAGA")
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    const operacoesRecentes = [...estado.operacoes]
      .sort((a, b) => {
        const porData = b.data.localeCompare(a.data);
        return porData !== 0 ? porData : b.numero.localeCompare(a.numero);
      })
      .slice(0, 6);
    const serie = serieMensal(estado.contas, estado.operacoes, periodo);
    const totalAtivo = balanco.totalAtivoCents || 1;
    const composicao = [
      ...balanco.ativoCirculante.linhas,
      ...balanco.ativoNaoCirculante.linhas,
    ]
      .filter((linha) => linha.valorCents > 0)
      .sort((a, b) => b.valorCents - a.valorCents)
      .slice(0, 5)
      .map((linha, indice) => ({
        nome: linha.conta.nome,
        valorCents: linha.valorCents,
        cor: CORES_ATIVO[indice % CORES_ATIVO.length],
        percentual: (linha.valorCents / totalAtivo) * 100,
      }));

    return {
      dre,
      balanco,
      estoque,
      estoqueTotal,
      estoqueQtd,
      caixa,
      bancos,
      saldoContabilEstoque,
      apuracaoAtiva,
      obrigacoesAbertas,
      operacoesRecentes,
      serie,
      composicao,
    };
  }, [estado]);

  const hoje = hojeISO();
  const disponivel = dados.caixa + dados.bancos;
  const resultado = dados.dre.resultadoCents;
  const resultadoPendente = !dados.apuracaoAtiva && (dados.dre.totalReceitasCents !== 0 || dados.dre.totalDespesasCents !== 0);
  const maiorSerie = Math.max(
    1,
    ...dados.serie.map((item) => Math.max(item.receitasCents, item.despesasCents)),
  );
  const estoqueReconciliado = dados.estoqueTotal === dados.saldoContabilEstoque;

  return (
    <div>
      <PageHeader
        etiqueta="Visão geral"
        titulo={`Olá, ${estado.usuarios.find((u) => u.id === estado.usuarioAtualId)?.nome.split(" ")[0] ?? "contador"}`}
        descricao={`Acompanhe a posição contábil de ${estado.empresa.nomeFantasia} no exercício ${estado.periodo.exercicio}.`}
        acoes={
          <>
            <LinkBotao href="/relatorios" variante="secondary" icone={FileText}>
              Relatórios
            </LinkBotao>
            <LinkBotao href="/lancamentos/novo" variante="primary" icone={PlusCircle}>
              Novo lançamento
            </LinkBotao>
          </>
        }
      />

      {resultadoPendente ? (
        <div className="mb-5">
          <Alerta
            tom="amber"
            titulo={`Resultado de ${formatarMoeda(resultado)} ainda não apurado`}
            acao={
              <LinkBotao href="/apuracao" variante="secondary" tamanho="sm" icone={Calculator}>
                Apurar agora
              </LinkBotao>
            }
          >
            As contas de receita e despesa ainda carregam o resultado do exercício. Apure para
            transferir o saldo ao patrimônio líquido e fechar o balanço com o PL atualizado.
          </Alerta>
        </div>
      ) : null}

      {estado.periodo.status === "FECHADO" ? (
        <div className="mb-5">
          <Alerta tom="red" titulo={`Exercício ${estado.periodo.exercicio} fechado`} acao={<LinkBotao href="/configuracoes" variante="secondary" tamanho="sm">Reabrir</LinkBotao>}>
            Novos lançamentos estão bloqueados. Reabra o período nas configurações para voltar a
            movimentar.
          </Alerta>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Disponível"
          valor={formatarMoeda(disponivel)}
          hint="Caixa + bancos"
          icone={Wallet}
          tom="indigo"
          detalhe={
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Caixa {formatarMoeda(dados.caixa)}</span>
              <span>Bancos {formatarMoeda(dados.bancos)}</span>
            </div>
          }
        />
        <StatCard
          titulo="Estoque"
          valor={formatarMoeda(dados.estoqueTotal)}
          hint={`${formatarQuantidade(dados.estoqueQtd)} unidade(s) em ${dados.estoque.filter((item) => item.quantidade > 0).length} produto(s)`}
          icone={Boxes}
          tom="emerald"
          detalhe={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Conta 1.0.4</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  estoqueReconciliado ? "text-emerald-600" : "text-amber-600",
                )}
              >
                {estoqueReconciliado ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {estoqueReconciliado ? "Reconciliado" : "Divergente"}
              </span>
            </div>
          }
        />
        <StatCard
          titulo="Receitas do exercício"
          valor={formatarMoeda(dados.dre.totalReceitasCents)}
          hint={`Despesas de ${formatarMoeda(dados.dre.totalDespesasCents)}`}
          icone={TrendingUp}
          tom="sky"
          detalhe={
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Margem</span>
              <span className="font-semibold text-slate-700">
                {dados.dre.totalReceitasCents
                  ? `${((resultado / dados.dre.totalReceitasCents) * 100).toFixed(1).replace(".", ",")}%`
                  : "—"}
              </span>
            </div>
          }
        />
        <StatCard
          titulo="Resultado do exercício"
          valor={formatarMoeda(resultado)}
          hint={resultado >= 0 ? "Lucro líquido" : "Prejuízo líquido"}
          icone={resultado >= 0 ? CircleDollarSign : TrendingDown}
          tom={resultado >= 0 ? "emerald" : "rose"}
          detalhe={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Situação</span>
              {dados.apuracaoAtiva ? (
                <Badge tom="green">Apurado</Badge>
              ) : (
                <Badge tom="amber">A apurar</Badge>
              )}
            </div>
          }
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Receitas × Despesas"
            descricao="Movimento mensal do exercício, sem saldo inicial e sem apuração."
            acao={
              <Link
                href="/dre"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Ver DRE <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="p-5">
            {dados.serie.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Sem movimento no período.</p>
            ) : (
              <div className="flex h-56 items-end gap-6 overflow-x-auto pb-1">
                {dados.serie.map((item) => {
                  const alturaReceita = Math.max(4, (item.receitasCents / maiorSerie) * 100);
                  const alturaDespesa = Math.max(4, (item.despesasCents / maiorSerie) * 100);
                  return (
                    <div key={item.mes} className="flex min-w-[72px] flex-1 flex-col items-center gap-2">
                      <div className="flex h-40 w-full items-end justify-center gap-1.5">
                        <div className="group relative flex h-full w-7 items-end">
                          <div
                            className="w-full rounded-t-md bg-emerald-500/85 transition group-hover:bg-emerald-500"
                            style={{ height: `${alturaReceita}%` }}
                            title={`Receitas: ${formatarMoeda(item.receitasCents)}`}
                          />
                        </div>
                        <div className="group relative flex h-full w-7 items-end">
                          <div
                            className="w-full rounded-t-md bg-rose-400/85 transition group-hover:bg-rose-500"
                            style={{ height: `${alturaDespesa}%` }}
                            title={`Despesas: ${formatarMoeda(item.despesasCents)}`}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-semibold capitalize text-slate-600">
                          {nomeMes(item.mes)}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] font-medium tabular-nums",
                            item.resultadoCents >= 0 ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {formatarMoeda(item.resultadoCents)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Receitas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Despesas e custos
              </span>
              <span className="ml-auto">
                Total do período:{" "}
                <strong className="font-semibold text-slate-700">{formatarMoeda(resultado)}</strong>
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            titulo="Composição do ativo"
            descricao={`Total de ${formatarMoeda(dados.balanco.totalAtivoCents)}`}
            acao={
              <Link href="/balanco" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Balanço
              </Link>
            }
          />
          <div className="p-5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {dados.composicao.map((item) => (
                <div
                  key={item.nome}
                  style={{ width: `${item.percentual}%`, backgroundColor: item.cor }}
                  title={`${item.nome}: ${formatarMoeda(item.valorCents)}`}
                />
              ))}
            </div>
            <div className="mt-4 space-y-2.5">
              {dados.composicao.map((item) => (
                <div key={item.nome} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
                  <span className="min-w-0 flex-1 truncate text-slate-600">{item.nome}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                    {formatarMoeda(item.valorCents)}
                  </span>
                  <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-slate-400">
                    {item.percentual.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
              <LinhaResumo rotulo="Ativo total" valor={formatarMoeda(dados.balanco.totalAtivoCents)} destaque />
              <LinhaResumo
                rotulo="Passivo + PL"
                valor={formatarMoeda(dados.balanco.totalPassivoPlCents)}
                destaque
              />
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dados.balanco.equilibrado ? "Equação patrimonial conferida" : "Equação não fecha"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Últimas operações"
            descricao="Registros mais recentes do Livro Diário."
            acao={
              <Link
                href="/diario"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Abrir Diário <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100">
            {dados.operacoesRecentes.map((operacao) => (
              <li key={operacao.id}>
                <Link
                  href={`/diario/${operacao.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    {operacao.tipo === "VENDA" ? (
                      <ShoppingCart className="h-4 w-4" />
                    ) : operacao.tipo === "COMPRA" ? (
                      <PackagePlus className="h-4 w-4" />
                    ) : operacao.tipo === "APURACAO" ? (
                      <Calculator className="h-4 w-4" />
                    ) : operacao.tipo === "ESTORNO" ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {operacao.historico}
                      </p>
                      <BadgeStatus status={operacao.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {operacao.numero} · {formatarData(operacao.data)} ·{" "}
                      {operacaoLabel(operacao.tipo)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
                    {formatarMoeda(valorOperacao(operacao))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              titulo="Obrigações a vencer"
              descricao={`${dados.obrigacoesAbertas.length} pendência(s)`}
              icone={CalendarClock}
              acao={
                <Link href="/obrigacoes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Ver todas
                </Link>
              }
            />
            <ul className="divide-y divide-slate-100">
              {dados.obrigacoesAbertas.slice(0, 4).map((obrigacao) => {
                const dias = diferencaEmDias(obrigacao.vencimento, hoje);
                return (
                  <li key={obrigacao.id} className="flex items-center gap-3 px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-700">{obrigacao.nome}</p>
                      <p className="text-[10px] text-slate-400">
                        Vence {formatarData(obrigacao.vencimento)}
                      </p>
                    </div>
                    {obrigacao.status === "ATRASADA" || dias < 0 ? (
                      <Badge tom="red">Atrasada</Badge>
                    ) : dias <= 7 ? (
                      <Badge tom="amber">{dias}d</Badge>
                    ) : (
                      <Badge tom="slate">{dias}d</Badge>
                    )}
                  </li>
                );
              })}
              {dados.obrigacoesAbertas.length === 0 ? (
                <li className="px-5 py-6 text-center text-xs text-slate-400">
                  Nenhuma obrigação pendente.
                </li>
              ) : null}
            </ul>
          </Card>

          <Card className="p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Atalhos
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Atalho href="/vendas" rotulo="Vender" icone={ShoppingCart} />
              <Atalho href="/compras" rotulo="Comprar" icone={PackagePlus} />
              <Atalho href="/balancete" rotulo="Balancete" icone={Scale} />
              <Atalho href="/balanco" rotulo="Balanço" icone={Landmark} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Atalho({
  href,
  rotulo,
  icone: Icone,
}: {
  href: string;
  rotulo: string;
  icone: typeof Banknote;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
    >
      <Icone className="h-4 w-4" />
      {rotulo}
    </Link>
  );
}
