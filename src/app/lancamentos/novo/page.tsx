"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  Alerta,
  Badge,
  Botao,
  Campo,
  CampoData,
  CampoValor,
  Card,
  CardHeader,
  Input,
  LinkBotao,
  PageHeader,
  Select,
  Td,
  Tabela,
  Th,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import type { TipoLinha, TipoOperacao } from "@/lib/types";
import { cn, formatarMoeda, hojeISO } from "@/lib/utils";

interface LinhaForm {
  chave: string;
  contaId: string;
  tipo: TipoLinha;
  valorCents: number;
}

const TIPOS_MANUAIS: Array<{ valor: TipoOperacao; rotulo: string }> = [
  { valor: "MANUAL", rotulo: "Lançamento manual" },
  { valor: "SALDO_INICIAL", rotulo: "Saldo inicial" },
  { valor: "AJUSTE_ESTOQUE", rotulo: "Ajuste contábil" },
];

function novaChave() {
  return `linha-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function NovoLancamentoPage() {
  const router = useRouter();
  const { estado, criarOperacao, notificar } = useApp();

  const contas = useMemo(
    () =>
      estado.contas
        .filter((conta) => conta.ativa && conta.analitica)
        .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR")),
    [estado.contas],
  );

  const [data, setData] = useState(
    hojeISO() >= estado.periodo.inicio && hojeISO() <= estado.periodo.fim
      ? hojeISO()
      : estado.periodo.inicio,
  );
  const [historico, setHistorico] = useState("");
  const [tipo, setTipo] = useState<TipoOperacao>("MANUAL");
  const [linhas, setLinhas] = useState<LinhaForm[]>([
    { chave: novaChave(), contaId: contas[0]?.id ?? "", tipo: "DEBITO", valorCents: 0 },
    { chave: novaChave(), contaId: contas[1]?.id ?? contas[0]?.id ?? "", tipo: "CREDITO", valorCents: 0 },
  ]);

  const totalDebitos = linhas.filter((l) => l.tipo === "DEBITO").reduce((t, l) => t + l.valorCents, 0);
  const totalCreditos = linhas.filter((l) => l.tipo === "CREDITO").reduce((t, l) => t + l.valorCents, 0);
  const diferenca = totalDebitos - totalCreditos;
  const fechado = estado.periodo.status === "FECHADO";
  const podeSalvar =
    !fechado &&
    historico.trim().length > 0 &&
    linhas.length >= 2 &&
    linhas.every((linha) => linha.contaId && linha.valorCents > 0) &&
    totalDebitos > 0 &&
    totalDebitos === totalCreditos;

  function atualizar(chave: string, campo: keyof LinhaForm, valor: string | number) {
    setLinhas((atuais) =>
      atuais.map((linha) => (linha.chave === chave ? { ...linha, [campo]: valor } : linha)),
    );
  }

  function adicionar() {
    setLinhas((atuais) => [
      ...atuais,
      {
        chave: novaChave(),
        contaId: contas[0]?.id ?? "",
        tipo: "DEBITO",
        valorCents: 0,
      },
    ]);
  }

  function remover(chave: string) {
    setLinhas((atuais) => (atuais.length <= 2 ? atuais : atuais.filter((linha) => linha.chave !== chave)));
  }

  function salvar() {
    const resultado = criarOperacao({
      data,
      historico,
      tipo,
      linhas: linhas.map((linha) => ({
        contaId: linha.contaId,
        tipo: linha.tipo,
        valorCents: linha.valorCents,
      })),
    });
    if (resultado.ok && resultado.data) {
      notificar(`Lançamento ${resultado.data.numero} registrado.`);
      router.push(`/diario/${resultado.data.id}`);
    } else {
      notificar(resultado.erro ?? "Não foi possível registrar o lançamento.", "erro");
    }
  }

  const contaPorId = new Map(estado.contas.map((conta) => [conta.id, conta]));

  return (
    <div>
      <PageHeader
        etiqueta="Movimentos"
        titulo="Novo lançamento"
        descricao="Registre uma operação manual com partida dobrada. Débitos e créditos precisam ter o mesmo valor."
        acoes={
          <>
            <LinkBotao href="/lancamentos" variante="secondary" icone={ArrowLeft}>
              Voltar
            </LinkBotao>
            <Botao icone={Save} onClick={salvar} disabled={!podeSalvar}>
              Registrar lançamento
            </Botao>
          </>
        }
      />

      {fechado ? (
        <div className="mb-5">
          <Alerta tom="red" titulo="Exercício fechado">
            Reabra o período em Configurações para registrar novos lançamentos.
          </Alerta>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader titulo="Identificação" descricao="Data de competência, histórico e tipo." />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Campo label="Data" obrigatorio>
                <CampoData
                  valor={data}
                  onChange={setData}
                  disabled={fechado}
                />
              </Campo>
              <Campo label="Tipo" obrigatorio>
                <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoOperacao)} disabled={fechado}>
                  {TIPOS_MANUAIS.map((item) => (
                    <option key={item.valor} value={item.valor}>
                      {item.rotulo}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Exercício" hint={`${estado.periodo.inicio} a ${estado.periodo.fim}`}>
                <Input value={estado.periodo.exercicio} disabled />
              </Campo>
              <Campo label="Histórico" obrigatorio className="sm:col-span-3">
                <Input
                  value={historico}
                  onChange={(e) => setHistorico(e.target.value)}
                  placeholder="Ex.: Pagamento de energia elétrica de outubro/2026"
                  disabled={fechado}
                />
              </Campo>
            </div>
          </Card>

          <Card>
            <CardHeader
              titulo="Partidas"
              descricao="Cada linha recebe uma conta analítica e um valor de débito ou crédito."
              acao={
                <Botao variante="secondary" tamanho="sm" icone={Plus} onClick={adicionar} disabled={fechado}>
                  Adicionar linha
                </Botao>
              }
            />
            <Tabela>
              <thead>
                <tr>
                  <Th>Conta</Th>
                  <Th alinhar="center">D / C</Th>
                  <Th alinhar="right">Valor</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, indice) => {
                  const conta = contaPorId.get(linha.contaId);
                  return (
                    <tr key={linha.chave}>
                      <Td className="min-w-[240px]">
                        <Select
                          value={linha.contaId}
                          onChange={(e) => atualizar(linha.chave, "contaId", e.target.value)}
                          disabled={fechado}
                        >
                          {contas.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.codigo} — {item.nome}
                            </option>
                          ))}
                        </Select>
                        {conta ? (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Natureza {conta.natureza.toLowerCase()} · grupo {conta.grupo.toLowerCase()}
                          </p>
                        ) : null}
                      </Td>
                      <Td alinhar="center" className="w-36">
                        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                          {(["DEBITO", "CREDITO"] as TipoLinha[]).map((opcao) => (
                            <button
                              key={opcao}
                              type="button"
                              disabled={fechado}
                              onClick={() => atualizar(linha.chave, "tipo", opcao)}
                              className={cn(
                                "px-3 py-1.5 text-[11px] font-bold transition",
                                linha.tipo === opcao
                                  ? opcao === "DEBITO"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-emerald-600 text-white"
                                  : "bg-white text-slate-500 hover:bg-slate-50",
                              )}
                            >
                              {opcao === "DEBITO" ? "D" : "C"}
                            </button>
                          ))}
                        </div>
                      </Td>
                      <Td alinhar="right" className="w-44">
                        <CampoValor
                          valorCents={linha.valorCents}
                          onChange={(cents) => atualizar(linha.chave, "valorCents", cents)}
                          disabled={fechado}
                        />
                      </Td>
                      <Td alinhar="right">
                        <button
                          type="button"
                          onClick={() => remover(linha.chave)}
                          disabled={linhas.length <= 2 || fechado}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                          aria-label={`Remover linha ${indice + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80">
                  <Td className="font-semibold text-slate-700">Totais</Td>
                  <Td alinhar="center">
                    <span className="text-[11px] font-medium text-slate-500">D {formatarMoeda(totalDebitos)}</span>
                    <br />
                    <span className="text-[11px] font-medium text-slate-500">C {formatarMoeda(totalCreditos)}</span>
                  </Td>
                  <Td alinhar="right">
                    {totalDebitos === totalCreditos && totalDebitos > 0 ? (
                      <Badge tom="green">Balanceado</Badge>
                    ) : (
                      <Badge tom="red">Diferença {formatarMoeda(diferenca)}</Badge>
                    )}
                  </Td>
                  <Td />
                </tr>
              </tfoot>
            </Tabela>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Conferência
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Débitos</span>
                <span className="font-semibold tabular-nums text-indigo-600">{formatarMoeda(totalDebitos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Créditos</span>
                <span className="font-semibold tabular-nums text-emerald-600">{formatarMoeda(totalCreditos)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Diferença</span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    diferenca === 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {formatarMoeda(diferenca)}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
              {podeSalvar ? (
                <>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Lançamento pronto para ser registrado.
                </>
              ) : (
                <>
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  Preencha histórico, contas e valores, e iguale débitos e créditos.
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Regras aplicadas
            </p>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-500">
              <li>• Toda operação exige ao menos um débito e um crédito.</li>
              <li>• Os totais precisam ser exatamente iguais.</li>
              <li>• Somente contas analíticas e ativas recebem lançamento.</li>
              <li>• A data precisa estar dentro do exercício aberto.</li>
              <li>• Depois de salvo, o lançamento só pode ser estornado — nunca excluído.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
