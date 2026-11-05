"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  History,
  Printer,
  RotateCcw,
  User,
} from "lucide-react";
import {
  Alerta,
  Badge,
  BadgeStatus,
  Botao,
  Card,
  CardHeader,
  Input,
  Modal,
  PageHeader,
  Tabela,
  Td,
  Th,
  Textarea,
} from "@/components/ui";
import { totalOperacao, valorOperacao } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarDataHora, formatarMoeda, operacaoLabel } from "@/lib/utils";

export default function DiarioDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { estado, estornarOperacao, notificar } = useApp();
  const [modalAberto, setModalAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  const operacao = estado.operacoes.find((item) => item.id === id);
  const contaPorId = useMemo(
    () => new Map(estado.contas.map((conta) => [conta.id, conta])),
    [estado.contas],
  );

  const original = operacao?.reversalOfId
    ? estado.operacoes.find((item) => item.id === operacao.reversalOfId)
    : undefined;
  const estornos = operacao
    ? estado.operacoes.filter((item) => item.reversalOfId === operacao.id)
    : [];
  const auditorias = estado.auditoria.filter(
    (item) => item.entidadeId === id || (original && item.entidadeId === original.id),
  );

  if (!operacao) {
    return (
      <div>
        <PageHeader titulo="Operação não encontrada" descricao="O lançamento pode ter sido removido do backup importado." />
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500">Não localizamos esta operação no Diário.</p>
          <Link href="/diario" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Diário
          </Link>
        </Card>
      </div>
    );
  }

  const total = totalOperacao(operacao);
  const podeEstornar = operacao.status === "ATIVA" && estado.periodo.status === "ABERTO";

  function estornar() {
    const resultado = estornarOperacao(operacao!.id, motivo);
    if (resultado.ok) {
      notificar(`Operação estornada por ${resultado.data?.numero}.`);
      setModalAberto(false);
      setMotivo("");
    } else {
      notificar(resultado.erro ?? "Não foi possível estornar.", "erro");
    }
  }

  return (
    <div>
      <PageHeader
        etiqueta="Livro Diário"
        titulo={`Operação ${operacao.numero}`}
        descricao={operacao.historico}
        acoes={
          <>
            <Link href="/diario" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-print">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
              Imprimir / PDF
            </Botao>
            {podeEstornar ? (
              <Botao variante="danger" icone={RotateCcw} onClick={() => setModalAberto(true)} className="no-print">
                Estornar
              </Botao>
            ) : null}
          </>
        }
      />

      {operacao.status !== "ATIVA" ? (
        <div className="mb-5">
          <Alerta tom="red" titulo="Operação estornada">
            Esta operação permanece no Diário para preservar a trilha. O estorno compensa os efeitos
            contábeis, sem excluir o registro original.
          </Alerta>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="print-card">
            <CardHeader
              titulo="Partidas contábeis"
              descricao={`${operacao.linhas.length} linha(s) · ${formatarMoeda(valorOperacao(operacao))} de valor de face`}
              acao={<BadgeStatus status={operacao.status} />}
            />
            <Tabela>
              <thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Conta</Th>
                  <Th>Natureza</Th>
                  <Th alinhar="right">Débito</Th>
                  <Th alinhar="right">Crédito</Th>
                </tr>
              </thead>
              <tbody>
                {operacao.linhas.map((linha) => {
                  const conta = contaPorId.get(linha.contaId);
                  return (
                    <tr key={linha.id} className={cn(operacao.status === "ESTORNADA" && "opacity-70")}>
                      <Td className="font-mono text-[11px] text-slate-500">{conta?.codigo}</Td>
                      <Td>
                        <span className="text-sm font-medium text-slate-800">{conta?.nome ?? "Conta removida"}</span>
                        {conta ? <span className="ml-2 text-[10px] text-slate-400">{conta.tipo}</span> : null}
                      </Td>
                      <Td className="text-[11px] text-slate-500">{conta?.natureza === "DEVEDORA" ? "Devedora" : "Credora"}</Td>
                      <Td alinhar="right" className={cn("font-semibold", linha.tipo === "CREDITO" && "text-slate-300")}>
                        {linha.tipo === "DEBITO" ? formatarMoeda(linha.valorCents) : "—"}
                      </Td>
                      <Td alinhar="right" className={cn("font-semibold", linha.tipo === "DEBITO" && "text-slate-300")}>
                        {linha.tipo === "CREDITO" ? formatarMoeda(linha.valorCents) : "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80">
                  <Td colSpan={3} className="font-semibold text-slate-700">Totais</Td>
                  <Td alinhar="right" className="font-semibold text-indigo-700">{formatarMoeda(total)}</Td>
                  <Td alinhar="right" className="font-semibold text-emerald-700">{formatarMoeda(total)}</Td>
                </tr>
              </tfoot>
            </Tabela>
            <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Partida dobrada conferida
              </span>
              <span className="ml-3">Débitos = Créditos = {formatarMoeda(total)}</span>
            </div>
          </Card>

          {operacao.documento?.itens?.length ? (
            <Card className="print-card">
              <CardHeader
                titulo="Documento de origem"
                descricao={`${operacao.documento.numero} · ${operacao.documento.parceiro}`}
                icone={FileText}
              />
              <Tabela>
                <thead>
                  <tr>
                    <Th>Item</Th>
                    <Th alinhar="right">Qtd.</Th>
                    <Th alinhar="right">Valor unit.</Th>
                    <Th alinhar="right">Custo unit.</Th>
                    <Th alinhar="right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {operacao.documento.itens.map((item, indice) => (
                    <tr key={`${item.produtoId}-${indice}`}>
                      <Td className="text-xs font-medium">{item.descricao}</Td>
                      <Td alinhar="right" className="text-xs">{item.quantidade}</Td>
                      <Td alinhar="right" className="text-xs">{formatarMoeda(item.valorUnitarioCents)}</Td>
                      <Td alinhar="right" className="text-xs text-slate-500">{formatarMoeda(item.custoUnitarioCents)}</Td>
                      <Td alinhar="right" className="text-xs font-semibold">{formatarMoeda(item.quantidade * item.valorUnitarioCents)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            </Card>
          ) : null}

          {operacao.documento?.parcelas?.length ? (
            <Card className="print-card">
              <CardHeader
                titulo="Parcelas"
                descricao="Controle do passivo: circulante até a 12ª parcela, longo prazo na sequência."
              />
              <div className="grid gap-2 p-5 sm:grid-cols-2">
                {operacao.documento.parcelas.map((parcela) => (
                  <div key={parcela.numero} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-xs">
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{parcela.numero}</span>
                      <span className="text-slate-500">{formatarData(parcela.vencimento)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tom={parcela.tipo === "CP" ? "amber" : "blue"}>{parcela.tipo}</Badge>
                      <span className="font-semibold tabular-nums text-slate-800">{formatarMoeda(parcela.valorCents)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {estornos.length > 0 ? (
            <Card className="print-card">
              <CardHeader titulo="Estornos desta operação" descricao="Cada estorno é uma nova operação, nunca uma exclusão." icone={RotateCcw} />
              <ul className="divide-y divide-slate-100">
                {estornos.map((estorno) => (
                  <li key={estorno.id}>
                    <Link href={`/diario/${estorno.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{estorno.numero}</p>
                        <p className="text-[11px] text-slate-500">{estorno.historico}</p>
                        {estorno.motivoEstorno ? <p className="text-[10px] text-slate-400">{estorno.motivoEstorno}</p> : null}
                      </div>
                      <span className="flex items-center gap-2 text-[11px] text-slate-500">
                        {formatarData(estorno.data)} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card className="p-5 print-card">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Informações</p>
            <dl className="mt-3 space-y-3 text-xs">
              <InfoLinha icone={CalendarDays} rotulo="Data" valor={formatarData(operacao.data)} />
              <InfoLinha icone={User} rotulo="Responsável" valor={operacao.usuario} />
              <InfoLinha icone={FileText} rotulo="Tipo" valor={operacaoLabel(operacao.tipo)} />
              <InfoLinha icone={History} rotulo="Registrado em" valor={formatarDataHora(operacao.criadoEm)} />
              {operacao.documento ? (
                <InfoLinha icone={Building2} rotulo="Parceiro" valor={operacao.documento.parceiro} />
              ) : null}
            </dl>
            {operacao.motivoEstorno ? (
              <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] text-rose-700">
                <span className="font-semibold">Motivo do estorno:</span> {operacao.motivoEstorno}
              </div>
            ) : null}
            {original ? (
              <Link href={`/diario/${original.id}`} className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50">
                Ver operação original <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </Card>

          <Card className="p-5 print-card">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Trilha de auditoria</p>
            {auditorias.length === 0 ? (
              <p className="mt-3 text-[11px] text-slate-400">Sem eventos adicionais para esta operação.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {auditorias.slice(0, 8).map((item) => (
                  <li key={item.id} className="border-l-2 border-indigo-100 pl-3">
                    <p className="text-[11px] font-semibold text-slate-700">{item.acao}</p>
                    <p className="text-[10px] leading-relaxed text-slate-500">{item.detalhe}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.usuario} · {formatarDataHora(item.data)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-5 no-print">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contas envolvidas</p>
            <div className="mt-3 space-y-1.5">
              {[...new Set(operacao.linhas.map((linha) => linha.contaId))].map((contaId) => {
                const conta = contaPorId.get(contaId);
                if (!conta) return null;
                return (
                  <Link
                    key={contaId}
                    href={`/razao?conta=${contaId}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] hover:bg-slate-50"
                  >
                    <span className="truncate text-slate-600">{conta.codigo} — {conta.nome}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Estornar operação"
        descricao="O estorno cria uma nova operação com as partidas invertidas. O registro original é mantido."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalAberto(false)}>Cancelar</Botao>
            <Botao variante="danger" icone={RotateCcw} onClick={estornar} disabled={!motivo.trim()}>
              Confirmar estorno
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          <Alerta tom="amber" titulo="Esta ação preserva o histórico">
            A operação {operacao.numero} ficará marcada como estornada e continuará visível no Diário.
          </Alerta>
          <label className="block text-xs font-semibold text-slate-700">
            Motivo do estorno <span className="text-rose-500">*</span>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Nota fiscal cancelada pelo fornecedor."
              className="mt-1.5"
            />
          </label>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
            Partidas do estorno: {operacao.linhas.length} linha(s), total de {formatarMoeda(total)}.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoLinha({
  icone: Icone,
  rotulo,
  valor,
}: {
  icone: typeof CalendarDays;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-wider text-slate-400">{rotulo}</dt>
        <dd className="font-medium text-slate-700">{valor}</dd>
      </div>
    </div>
  );
}
