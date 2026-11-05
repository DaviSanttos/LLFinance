"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  TriangleAlert,
} from "lucide-react";
import {
  Badge,
  BadgeStatus,
  Botao,
  Campo,
  CampoData,
  CampoValor,
  Card,
  CardHeader,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Tabela,
  Td,
  Th,
  Textarea,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  diferencaEmDias,
  formatarData,
  formatarMoeda,
  hojeISO,
  statusObrigacaoLabel,
} from "@/lib/utils";

export default function ObrigacoesPage() {
  const { estado, alternarObrigacao, adicionarObrigacao, notificar } = useApp();
  const [filtro, setFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [competencia, setCompetencia] = useState(hojeISO().slice(0, 7));
  const [vencimento, setVencimento] = useState(hojeISO());
  const [valorCents, setValorCents] = useState(0);
  const [observacao, setObservacao] = useState("");

  const hoje = hojeISO();

  const obrigacoes = useMemo(
    () =>
      [...estado.obrigacoes]
        .filter((item) => (filtro ? item.status === filtro : true))
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento)),
    [estado.obrigacoes, filtro],
  );

  const abertas = estado.obrigacoes.filter((item) => item.status !== "PAGA");
  const atrasadas = estado.obrigacoes.filter(
    (item) => item.status === "ATRASADA" || (item.status !== "PAGA" && item.vencimento < hoje),
  );
  const pagas = estado.obrigacoes.filter((item) => item.status === "PAGA");
  const valorAberto = abertas.reduce((total, item) => total + item.valorCents, 0);

  function alternar(id: string) {
    const resultado = alternarObrigacao(id);
    if (resultado.ok) notificar("Status da obrigação atualizado.");
    else notificar(resultado.erro ?? "Não foi possível atualizar.", "erro");
  }

  function salvar() {
    const resultado = adicionarObrigacao({
      nome,
      competencia,
      vencimento,
      valorCents,
      observacao,
    });
    if (resultado.ok) {
      notificar("Obrigação cadastrada.");
      setModalAberto(false);
      setNome("");
      setObservacao("");
      setValorCents(0);
    } else {
      notificar(resultado.erro ?? "Não foi possível cadastrar.", "erro");
    }
  }

  return (
    <div>
      <PageHeader
        etiqueta="Controle"
        titulo="Obrigações Fiscais"
        descricao="Calendário de tributos e encargos, com vencimentos, competência e situação de pagamento."
        acoes={
          <Botao icone={Plus} onClick={() => setModalAberto(true)}>
            Nova obrigação
          </Botao>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Total de obrigações" valor={String(estado.obrigacoes.length)} icone={CalendarClock} tom="indigo" />
        <StatCard titulo="Em aberto" valor={String(abertas.length)} hint={`${formatarMoeda(valorAberto)} estimado`} icone={Clock} tom="amber" />
        <StatCard titulo="Atrasadas" valor={String(atrasadas.length)} icone={TriangleAlert} tom="rose" />
        <StatCard titulo="Pagas" valor={String(pagas.length)} icone={CheckCircle2} tom="emerald" />
      </div>

      <Card>
        <CardHeader
          titulo="Calendário de obrigações"
          descricao={`${obrigacoes.length} registro(s) · hoje é ${formatarData(hoje)}`}
          icone={CalendarClock}
          acao={
            <Select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="w-40">
              <option value="">Todas</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="ATRASADA">Atrasadas</option>
              <option value="PAGA">Pagas</option>
            </Select>
          }
        />
        <Tabela>
          <thead>
            <tr>
              <Th>Obrigação</Th>
              <Th>Competência</Th>
              <Th>Vencimento</Th>
              <Th alinhar="right">Valor</Th>
              <Th alinhar="center">Prazo</Th>
              <Th alinhar="center">Status</Th>
              <Th alinhar="right">Ação</Th>
            </tr>
          </thead>
          <tbody>
            {obrigacoes.map((item) => {
              const dias = diferencaEmDias(item.vencimento, hoje);
              const atrasada = item.status !== "PAGA" && dias < 0;
              return (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <Td>
                    <p className="text-xs font-medium text-slate-800">{item.nome}</p>
                    {item.observacao ? <p className="text-[10px] text-slate-400">{item.observacao}</p> : null}
                  </Td>
                  <Td className="text-xs text-slate-500">{item.competencia}</Td>
                  <Td className="whitespace-nowrap text-xs">{formatarData(item.vencimento)}</Td>
                  <Td alinhar="right" className="text-xs font-semibold">
                    {item.valorCents ? formatarMoeda(item.valorCents) : <span className="text-slate-400">a apurar</span>}
                  </Td>
                  <Td alinhar="center">
                    {item.status === "PAGA" ? (
                      <span className="text-[10px] text-slate-400">—</span>
                    ) : atrasada ? (
                      <Badge tom="red">{Math.abs(dias)}d em atraso</Badge>
                    ) : dias === 0 ? (
                      <Badge tom="amber">Hoje</Badge>
                    ) : (
                      <Badge tom={dias <= 7 ? "amber" : "slate"}>{dias}d</Badge>
                    )}
                  </Td>
                  <Td alinhar="center">
                    <BadgeStatus status={atrasada ? "ATRASADA" : item.status} />
                  </Td>
                  <Td alinhar="right">
                    <Botao
                      variante={item.status === "PAGA" ? "ghost" : "secondary"}
                      tamanho="sm"
                      icone={item.status === "PAGA" ? Clock : CheckCircle2}
                      onClick={() => alternar(item.id)}
                    >
                      {item.status === "PAGA" ? "Reabrir" : "Marcar paga"}
                    </Botao>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
        {obrigacoes.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Nenhuma obrigação neste filtro.</p>
        ) : null}
        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] text-slate-500">
          {abertas.length} em aberto · {atrasadas.length} atrasada(s) · {pagas.length} paga(s). O status também
          pode ser derivado do vencimento, mas o registro manual prevalece.
        </div>
      </Card>

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Nova obrigação fiscal"
        descricao="Cadastre tributos, encargos e declarações a vencer."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalAberto(false)}>Cancelar</Botao>
            <Botao icone={Plus} onClick={salvar}>Cadastrar</Botao>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome" obrigatorio className="sm:col-span-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: DAS — Simples Nacional" />
          </Campo>
          <Campo label="Competência" obrigatorio>
            <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
          </Campo>
          <Campo label="Vencimento" obrigatorio>
            <CampoData valor={vencimento} onChange={setVencimento} />
          </Campo>
          <Campo label="Valor estimado" className="sm:col-span-2">
            <CampoValor valorCents={valorCents} onChange={setValorCents} />
          </Campo>
          <Campo label="Observação" className="sm:col-span-2">
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: Valor a confirmar com o contador." />
          </Campo>
          <div className="sm:col-span-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
            A obrigação entra como <strong>{statusObrigacaoLabel("PENDENTE")}</strong> e pode ser marcada
            como paga a qualquer momento.
          </div>
        </div>
      </Modal>
    </div>
  );
}
