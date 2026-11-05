"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  BookText,
  Boxes,
  Building2,
  CalendarClock,
  Landmark,
  Printer,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  Botao,
  Campo,
  CampoData,
  Card,
  CardHeader,
  PageHeader,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import {
  calcularEstoque,
  gerarBalancete,
  gerarBalanco,
  gerarDre,
  gerarRazao,
  resumoBalancete,
  totalOperacao,
  valorOperacao,
} from "@/lib/accounting";
import type { Conta } from "@/lib/types";
import { useApp } from "@/lib/store";
import {
  formatarCNPJ,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarQuantidade,
  hojeISO,
  operacaoLabel,
  soma,
} from "@/lib/utils";

function CompletoConteudo() {
  const searchParams = useSearchParams();
  const { estado, empresa } = useApp();
  const [de, setDe] = useState(searchParams.get("de") ?? estado.periodo.inicio);
  const [ate, setAte] = useState(searchParams.get("ate") ?? estado.periodo.fim);

  const filtro = { inicio: de, fim: ate };

  const dre = useMemo(() => gerarDre(estado.contas, estado.operacoes, filtro), [estado, de, ate]);
  const balanco = useMemo(() => gerarBalanco(estado.contas, estado.operacoes, filtro), [estado, de, ate]);
  const balancete = useMemo(() => gerarBalancete(estado.contas, estado.operacoes, filtro), [estado, de, ate]);
  const resumo = useMemo(() => resumoBalancete(balancete), [balancete]);
  const estoque = useMemo(() => calcularEstoque(estado.produtos, estado.movimentosEstoque), [estado]);
  const operacoes = useMemo(
    () =>
      [...estado.operacoes]
        .filter((op) => op.data >= de && op.data <= ate)
        .sort((a, b) => a.data.localeCompare(b.data) || a.numero.localeCompare(b.numero)),
    [estado.operacoes, de, ate],
  );
  const contasComMovimento = useMemo(
    () =>
      estado.contas
        .filter((conta) =>
          operacoes.some((op) => op.linhas.some((linha) => linha.contaId === conta.id)),
        )
        .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR")),
    [estado.contas, operacoes],
  );
  const contaPorId = useMemo(
    () => new Map(estado.contas.map((conta) => [conta.id, conta])),
    [estado.contas],
  );

  const totalEstoque = soma(estoque, (item) => item.valorTotalCents);
  const obrigacoesAbertas = estado.obrigacoes.filter((item) => item.status !== "PAGA");
  const auditoria = [...estado.auditoria].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div>
      <PageHeader
        etiqueta="Relatórios"
        titulo="Relatório contábil completo"
        descricao="Pacote de demonstrações e livros para impressão em PDF. Ideal para entrega e arquivamento."
        acoes={
          <>
            <a
              href="/relatorios"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-print"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </a>
            <Botao icone={Printer} onClick={() => window.print()}>
              Imprimir / Salvar PDF
            </Botao>
          </>
        }
      />

      <Card className="mb-5 no-print">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <Campo label="De" className="w-full sm:w-44">
            <CampoData valor={de} onChange={setDe} />
          </Campo>
          <Campo label="Até" className="w-full sm:w-44">
            <CampoData valor={ate} onChange={setAte} />
          </Campo>
          <div className="ml-auto flex flex-wrap gap-2 pb-1">
            <Badge tom="indigo">{operacoes.length} operações</Badge>
            <Badge tom={resumo.fecha ? "green" : "red"}>
              {resumo.fecha ? "Balancete fechado" : "Balancete divergente"}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Capa */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
                LL
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900">LLFinance</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Contabilidade · relatório completo
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Exercício {estado.periodo.exercicio}</p>
              <p>{formatarData(de)} a {formatarData(ate)}</p>
              <p>Emitido em {formatarData(hojeISO())}</p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 shrink-0 text-indigo-500" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                  {empresa.razaoSocial}
                </h1>
                <p className="text-sm text-slate-500">{empresa.nomeFantasia}</p>
                <p className="mt-1 text-xs text-slate-500">
                  CNPJ {formatarCNPJ(empresa.cnpj)} · {empresa.natureza} · {empresa.regime}
                </p>
                <p className="text-xs text-slate-500">
                  {empresa.endereco} — {empresa.cidade}/{empresa.uf}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResumoCapa rotulo="Ativo total" valor={formatarMoeda(balanco.totalAtivoCents)} />
            <ResumoCapa rotulo="Passivo + PL" valor={formatarMoeda(balanco.totalPassivoPlCents)} />
            <ResumoCapa
              rotulo={dre.resultadoCents >= 0 ? "Lucro do exercício" : "Prejuízo do exercício"}
              valor={formatarMoeda(dre.resultadoCents)}
            />
            <ResumoCapa rotulo="Estoque" valor={formatarMoeda(totalEstoque)} />
          </div>

          <div className="mt-8 grid gap-x-8 gap-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500 sm:grid-cols-2">
            <Indice numero="1" titulo="Demonstração do Resultado do Exercício" />
            <Indice numero="2" titulo="Balanço Patrimonial" />
            <Indice numero="3" titulo="Balancete de Verificação" />
            <Indice numero="4" titulo="Livro Diário" />
            <Indice numero="5" titulo="Livro Razão" />
            <Indice numero="6" titulo="Controle de Estoque" />
            <Indice numero="7" titulo="Obrigações Fiscais" />
            <Indice numero="8" titulo="Trilha de Auditoria" />
          </div>
        </section>

        {/* 1. DRE */}
        <Card className="print-break">
          <CardHeader titulo="1. Demonstração do Resultado do Exercício" descricao={`${formatarData(de)} a ${formatarData(ate)}`} icone={TrendingUp} />
          <div className="px-5 py-4">
            <SecaoTitulo>Receitas operacionais</SecaoTitulo>
            <Tabela className="mt-1">
              <tbody>
                {dre.receitas.filter((l) => l.valorCents !== 0).length === 0 ? (
                  <tr><Td className="text-xs italic text-slate-400">Nenhuma receita no período.</Td></tr>
                ) : (
                  dre.receitas.filter((l) => l.valorCents !== 0).map((linha) => (
                    <LinhaRelatorio key={linha.conta.id} conta={linha.conta} valor={linha.valorCents} />
                  ))
                )}
                <LinhaTotal rotulo="Total de Receitas (+)" valor={dre.totalReceitasCents} tom="emerald" />
              </tbody>
            </Tabela>

            <SecaoTitulo className="mt-5">Despesas operacionais</SecaoTitulo>
            <Tabela className="mt-1">
              <tbody>
                {dre.despesas.filter((l) => l.valorCents !== 0).length === 0 ? (
                  <tr><Td className="text-xs italic text-slate-400">Nenhuma despesa no período.</Td></tr>
                ) : (
                  dre.despesas.filter((l) => l.valorCents !== 0).map((linha) => (
                    <LinhaRelatorio key={linha.conta.id} conta={linha.conta} valor={linha.valorCents} />
                  ))
                )}
                <LinhaTotal rotulo="Total de Despesas (−)" valor={dre.totalDespesasCents} tom="rose" />
              </tbody>
            </Tabela>

            <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${dre.resultadoCents >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${dre.resultadoCents >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                {dre.resultadoCents >= 0 ? "Lucro Líquido do Exercício" : "Prejuízo Líquido do Exercício"}
              </span>
              <span className={`text-lg font-bold tabular-nums ${dre.resultadoCents >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatarMoeda(dre.resultadoCents)}
              </span>
            </div>
          </div>
        </Card>

        {/* 2. Balanço */}
        <Card className="print-break">
          <CardHeader titulo="2. Balanço Patrimonial" descricao={`Posição em ${formatarData(ate)}`} icone={Landmark} />
          <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
            <div>
              <SecaoTitulo className="mx-5 mt-4">Ativo</SecaoTitulo>
              <Tabela className="mt-1">
                <tbody>
                  <GrupoRelatorio titulo="Ativo Circulante" linhas={balanco.ativoCirculante.linhas} total={balanco.ativoCirculante.totalCents} />
                  <GrupoRelatorio titulo="Ativo Não Circulante" linhas={balanco.ativoNaoCirculante.linhas} total={balanco.ativoNaoCirculante.totalCents} />
                  <LinhaTotal rotulo="Total do Ativo" valor={balanco.totalAtivoCents} tom="indigo" />
                </tbody>
              </Tabela>
            </div>
            <div>
              <SecaoTitulo className="mx-5 mt-4">Passivo e Patrimônio Líquido</SecaoTitulo>
              <Tabela className="mt-1">
                <tbody>
                  <GrupoRelatorio titulo="Passivo Circulante" linhas={balanco.passivoCirculante.linhas} total={balanco.passivoCirculante.totalCents} />
                  <GrupoRelatorio titulo="Passivo Não Circulante" linhas={balanco.passivoNaoCirculante.linhas} total={balanco.passivoNaoCirculante.totalCents} />
                  <GrupoRelatorio titulo="Patrimônio Líquido" linhas={balanco.patrimonioLiquido.linhas} total={balanco.patrimonioLiquido.totalCents} />
                  <LinhaTotal rotulo="Total do Passivo + PL" valor={balanco.totalPassivoPlCents} tom="indigo" />
                </tbody>
              </Tabela>
            </div>
          </div>
        </Card>

        {/* 3. Balancete */}
        <Card className="print-break">
          <CardHeader
            titulo="3. Balancete de Verificação"
            descricao={`${balancete.length} conta(s) com movimentação`}
            icone={Scale}
            acao={<Badge tom={resumo.fecha ? "green" : "red"}>{resumo.fecha ? "Fechado" : "Divergente"}</Badge>}
          />
          <Tabela>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Conta</Th>
                <Th alinhar="right">Saldo anterior</Th>
                <Th alinhar="right">Débitos</Th>
                <Th alinhar="right">Créditos</Th>
                <Th alinhar="right">Saldo atual</Th>
                <Th alinhar="center">D/C</Th>
              </tr>
            </thead>
            <tbody>
              {balancete.map((linha) => (
                <tr key={linha.conta.id}>
                  <Td className="font-mono text-[10px] text-slate-500">{linha.conta.codigo}</Td>
                  <Td className="text-xs">{linha.conta.nome}</Td>
                  <Td alinhar="right" className="text-[11px]">{formatarMoeda(linha.saldoAnteriorCents)}</Td>
                  <Td alinhar="right" className="text-[11px]">{formatarMoeda(linha.debitosCents)}</Td>
                  <Td alinhar="right" className="text-[11px]">{formatarMoeda(linha.creditosCents)}</Td>
                  <Td alinhar="right" className="text-[11px] font-semibold">{formatarMoeda(linha.saldoAtualCents)}</Td>
                  <Td alinhar="center" className="text-[10px] font-bold">{linha.lado}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <Td colSpan={3} className="text-xs">Totais</Td>
                <Td alinhar="right" className="text-xs text-indigo-700">{formatarMoeda(resumo.totalDebitosCents)}</Td>
                <Td alinhar="right" className="text-xs text-emerald-700">{formatarMoeda(resumo.totalCreditosCents)}</Td>
                <Td colSpan={2} className="text-center text-[10px]">
                  {resumo.fecha ? "Débitos = Créditos" : "Divergência"}
                </Td>
              </tr>
            </tfoot>
          </Tabela>
        </Card>

        {/* 4. Diário */}
        <Card className="print-break">
          <CardHeader titulo="4. Livro Diário" descricao={`${operacoes.length} operação(ões) no período`} icone={BookText} />
          <div className="divide-y divide-slate-100">
            {operacoes.map((op) => (
              <div key={op.id} className="px-5 py-3 print-card">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-slate-500">{op.numero}</span>
                    <span className="text-slate-400">{formatarData(op.data)}</span>
                    <Badge tom="slate">{operacaoLabel(op.tipo)}</Badge>
                    {op.status !== "ATIVA" ? <Badge tom="red">{op.status}</Badge> : null}
                  </div>
                  <span className="font-semibold tabular-nums text-slate-700">{formatarMoeda(valorOperacao(op))}</span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-800">{op.historico}</p>
                <Tabela className="mt-1.5">
                  <tbody>
                    {op.linhas.map((linha) => {
                      const conta = contaPorId.get(linha.contaId);
                      return (
                        <tr key={linha.id}>
                          <Td className="border-0 py-1 text-[10px] text-slate-500">{conta?.codigo} — {conta?.nome}</Td>
                          <Td alinhar="right" className="border-0 py-1 text-[10px]">
                            {linha.tipo === "DEBITO" ? formatarMoeda(linha.valorCents) : ""}
                          </Td>
                          <Td alinhar="right" className="border-0 py-1 text-[10px]">
                            {linha.tipo === "CREDITO" ? formatarMoeda(linha.valorCents) : ""}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Tabela>
                <p className="text-right text-[9px] text-slate-400">Débitos da operação: {formatarMoeda(totalOperacao(op))}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 5. Razão */}
        <Card className="print-break">
          <CardHeader
            titulo="5. Livro Razão"
            descricao={`${contasComMovimento.length} conta(s) com movimentação no período`}
            icone={BookOpen}
          />
          <div className="divide-y divide-slate-100">
            {contasComMovimento.map((conta) => {
              const razao = gerarRazao(conta, estado.operacoes, filtro);
              return (
                <div key={conta.id} className="px-5 py-4 print-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">
                      <span className="mr-1.5 font-mono text-[10px] text-slate-400">{conta.codigo}</span>
                      {conta.nome}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Saldo anterior {formatarMoeda(razao.saldoAnteriorCents)} · final{" "}
                      <strong className="text-slate-800">{formatarMoeda(razao.saldoFinalCents)}</strong>
                    </p>
                  </div>
                  <Tabela className="mt-1.5">
                    <thead>
                      <tr>
                        <Th>Data</Th>
                        <Th>Operação</Th>
                        <Th>Histórico</Th>
                        <Th alinhar="right">Débito</Th>
                        <Th alinhar="right">Crédito</Th>
                        <Th alinhar="right">Saldo</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {razao.movimentos.map((mov, indice) => (
                        <tr key={`${mov.operacaoId}-${indice}`}>
                          <Td className="text-[10px]">{formatarData(mov.data)}</Td>
                          <Td className="font-mono text-[9px] text-slate-500">{mov.numero}</Td>
                          <Td className="text-[10px] text-slate-600">{mov.historico}</Td>
                          <Td alinhar="right" className="text-[10px]">{mov.debitoCents ? formatarMoeda(mov.debitoCents) : "—"}</Td>
                          <Td alinhar="right" className="text-[10px]">{mov.creditoCents ? formatarMoeda(mov.creditoCents) : "—"}</Td>
                          <Td alinhar="right" className="text-[10px] font-semibold">{formatarMoeda(mov.saldoCents)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Tabela>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 6. Estoque */}
        <Card className="print-break">
          <CardHeader titulo="6. Controle de Estoque" descricao="Saldo físico e financeiro por produto" icone={Boxes} />
          <Tabela>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Produto</Th>
                <Th alinhar="right">Quantidade</Th>
                <Th alinhar="right">Custo médio</Th>
                <Th alinhar="right">Valor total</Th>
                <Th alinhar="right">CMV acumulado</Th>
                <Th>Última mov.</Th>
              </tr>
            </thead>
            <tbody>
              {estoque.map((item) => (
                <tr key={item.produto.id}>
                  <Td className="font-mono text-[10px] text-slate-500">{item.produto.sku}</Td>
                  <Td className="text-xs">{item.produto.nome}</Td>
                  <Td alinhar="right" className="text-xs">{formatarQuantidade(item.quantidade)} {item.produto.unidade}</Td>
                  <Td alinhar="right" className="text-xs">{formatarMoeda(item.custoMedioCents)}</Td>
                  <Td alinhar="right" className="text-xs font-semibold">{formatarMoeda(item.valorTotalCents)}</Td>
                  <Td alinhar="right" className="text-xs">{formatarMoeda(item.cmvTotalCents)}</Td>
                  <Td className="text-[10px] text-slate-500">{item.ultimaMovimentacao ? formatarData(item.ultimaMovimentacao) : "—"}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <Td colSpan={4} className="text-xs">Total em estoque</Td>
                <Td alinhar="right" className="text-xs text-emerald-700">{formatarMoeda(totalEstoque)}</Td>
                <Td colSpan={2} />
              </tr>
            </tfoot>
          </Tabela>
        </Card>

        {/* 7. Obrigações */}
        <Card className="print-break">
          <CardHeader titulo="7. Obrigações Fiscais" descricao={`${obrigacoesAbertas.length} pendência(s)`} icone={CalendarClock} />
          <Tabela>
            <thead>
              <tr>
                <Th>Obrigação</Th>
                <Th>Competência</Th>
                <Th>Vencimento</Th>
                <Th alinhar="right">Valor</Th>
                <Th alinhar="center">Status</Th>
              </tr>
            </thead>
            <tbody>
              {estado.obrigacoes.map((item) => (
                <tr key={item.id}>
                  <Td className="text-xs">{item.nome}</Td>
                  <Td className="text-[11px] text-slate-500">{item.competencia}</Td>
                  <Td className="text-[11px]">{formatarData(item.vencimento)}</Td>
                  <Td alinhar="right" className="text-[11px]">{item.valorCents ? formatarMoeda(item.valorCents) : "a apurar"}</Td>
                  <Td alinhar="center">
                    <Badge tom={item.status === "PAGA" ? "green" : item.status === "ATRASADA" ? "red" : "amber"}>
                      {item.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Card>

        {/* 8. Auditoria */}
        <Card className="print-break">
          <CardHeader titulo="8. Trilha de Auditoria" descricao={`${auditoria.length} evento(s)`} icone={ShieldCheck} />
          <Tabela>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Usuário</Th>
                <Th>Ação</Th>
                <Th>Entidade</Th>
                <Th>Detalhe</Th>
              </tr>
            </thead>
            <tbody>
              {auditoria.map((item) => (
                <tr key={item.id}>
                  <Td className="whitespace-nowrap text-[10px] text-slate-500">{formatarDataHora(item.data)}</Td>
                  <Td className="text-[11px]">{item.usuario}</Td>
                  <Td className="text-[10px] font-semibold text-slate-700">{item.acao}</Td>
                  <Td className="text-[10px] text-slate-500">{item.entidade}</Td>
                  <Td className="text-[10px] text-slate-600">{item.detalhe}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Card>

        <footer className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-[10px] text-slate-400 print:border-0">
          LLFinance · Relatório emitido em {formatarData(hojeISO())} · {empresa.razaoSocial} · CNPJ{" "}
          {formatarCNPJ(empresa.cnpj)}
        </footer>
      </div>
    </div>
  );
}

function SecaoTitulo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-wider text-slate-600 ${className ?? ""}`}>
      {children}
    </p>
  );
}

function LinhaRelatorio({ conta, valor }: { conta: Conta; valor: number }) {
  return (
    <tr>
      <Td className="border-0 py-1 pl-2 text-xs text-slate-600">
        <span className="mr-1.5 font-mono text-[10px] text-slate-400">{conta.codigo}</span>
        {conta.nome}
      </Td>
      <Td alinhar="right" className="border-0 py-1 text-xs font-medium tabular-nums text-slate-800">
        {formatarMoeda(valor)}
      </Td>
    </tr>
  );
}

function LinhaTotal({ rotulo, valor, tom }: { rotulo: string; valor: number; tom: "emerald" | "rose" | "indigo" }) {
  const cor = tom === "emerald" ? "text-emerald-700" : tom === "rose" ? "text-rose-700" : "text-indigo-700";
  return (
    <tr className="border-t border-slate-200">
      <Td className="py-2 text-xs font-bold uppercase tracking-wide text-slate-700">{rotulo}</Td>
      <Td alinhar="right" className={`py-2 text-sm font-bold tabular-nums ${cor}`}>{formatarMoeda(valor)}</Td>
    </tr>
  );
}

function GrupoRelatorio({
  titulo,
  linhas,
  total,
}: {
  titulo: string;
  linhas: Array<{ conta: Conta; valorCents: number }>;
  total: number;
}) {
  return (
    <>
      <tr className="bg-slate-50/70">
        <Td className="py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{titulo}</Td>
        <Td alinhar="right" className="py-1.5 text-[10px] font-semibold text-slate-600">{formatarMoeda(total)}</Td>
      </tr>
      {linhas.length === 0 ? (
        <tr><Td colSpan={2} className="py-1.5 pl-6 text-[10px] italic text-slate-400">Sem saldos.</Td></tr>
      ) : (
        linhas.map((linha) => (
          <tr key={linha.conta.id}>
            <Td className="border-0 py-1 pl-6 text-[11px] text-slate-600">
              <span className="mr-1.5 font-mono text-[9px] text-slate-400">{linha.conta.codigo}</span>
              {linha.conta.nome}
            </Td>
            <Td alinhar="right" className="border-0 py-1 text-[11px] font-medium tabular-nums">
              {formatarMoeda(linha.valorCents)}
            </Td>
          </tr>
        ))
      )}
    </>
  );
}

function ResumoCapa({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{rotulo}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">{valor}</p>
    </div>
  );
}

function Indice({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-500">
        {numero}
      </span>
      <span>{titulo}</span>
    </div>
  );
}

export default function RelatorioCompletoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Preparando relatório completo…</div>}>
      <CompletoConteudo />
    </Suspense>
  );
}
