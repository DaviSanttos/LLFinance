"use client";

import { useMemo, useState } from "react";
import { ListTree, Plus, Power, PowerOff, SearchX } from "lucide-react";
import {
  Badge,
  Botao,
  Busca,
  Campo,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Tabela,
  Td,
  Th,
  Toggle,
} from "@/components/ui";
import { calcularSaldos } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import type { GrupoConta, Natureza, TipoConta } from "@/lib/types";
import { cn, formatarMoeda, grupoLabel, normalizar, tipoLabel } from "@/lib/utils";

const TIPOS: TipoConta[] = [
  "ATIVO",
  "PASSIVO",
  "PATRIMONIO_LIQUIDO",
  "RECEITA",
  "DESPESA",
  "CUSTO",
  "APURACAO",
];

const GRUPOS: GrupoConta[] = [
  "CIRCULANTE",
  "NAO_CIRCULANTE",
  "REALIZAVEL_LP",
  "INVESTIMENTO",
  "IMOBILIZADO",
  "INTANGIVEL",
  "PATRIMONIO_LIQUIDO",
  "RESULTADO",
  "APURACAO",
];

const TOM_TIPO: Record<string, "green" | "red" | "indigo" | "blue" | "amber" | "purple" | "slate"> = {
  ATIVO: "green",
  PASSIVO: "red",
  PATRIMONIO_LIQUIDO: "indigo",
  RECEITA: "blue",
  DESPESA: "amber",
  CUSTO: "purple",
  APURACAO: "slate",
};

export default function PlanoContasPage() {
  const { estado, criarConta, alternarContaAtiva, notificar } = useApp();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [somenteAtivas, setSomenteAtivas] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("ATIVO");
  const [natureza, setNatureza] = useState<Natureza>("DEVEDORA");
  const [grupo, setGrupo] = useState<GrupoConta>("CIRCULANTE");
  const [analitica, setAnalitica] = useState(true);

  const saldos = useMemo(
    () => calcularSaldos(estado.contas, estado.operacoes),
    [estado.contas, estado.operacoes],
  );

  const contas = useMemo(() => {
    const termo = normalizar(busca);
    return estado.contas
      .filter((conta) => {
        if (somenteAtivas && !conta.ativa) return false;
        if (filtroTipo && conta.tipo !== filtroTipo) return false;
        if (!termo) return true;
        return (
          normalizar(conta.nome).includes(termo) || normalizar(conta.codigo).includes(termo)
        );
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR"));
  }, [estado.contas, busca, filtroTipo, somenteAtivas]);

  const mapaSaldo = useMemo(
    () => new Map(saldos.map((linha) => [linha.conta.id, linha.saldoAtualCents])),
    [saldos],
  );

  const totalAtivas = estado.contas.filter((conta) => conta.ativa).length;
  const totalPersonalizadas = estado.contas.filter((conta) => !conta.padrao).length;
  const totalComSaldo = estado.contas.filter(
    (conta) => (mapaSaldo.get(conta.id) ?? 0) !== 0,
  ).length;

  function abrirModal() {
    setCodigo("");
    setNome("");
    setTipo("ATIVO");
    setNatureza("DEVEDORA");
    setGrupo("CIRCULANTE");
    setAnalitica(true);
    setModalAberto(true);
  }

  function salvar() {
    const resultado = criarConta({ codigo, nome, tipo, natureza, grupo, analitica });
    if (resultado.ok) {
      notificar(`Conta ${codigo} criada com sucesso.`);
      setModalAberto(false);
    } else {
      notificar(resultado.erro ?? "Não foi possível criar a conta.", "erro");
    }
  }

  function alternar(id: string) {
    const resultado = alternarContaAtiva(id);
    if (resultado.ok) notificar("Situação da conta atualizada.");
    else notificar(resultado.erro ?? "Não foi possível alterar a conta.", "erro");
  }

  function aoMudarTipo(novoTipo: TipoConta) {
    setTipo(novoTipo);
    setNatureza(
      novoTipo === "ATIVO" || novoTipo === "DESPESA" || novoTipo === "CUSTO"
        ? "DEVEDORA"
        : "CREDORA",
    );
    if (novoTipo === "ATIVO") setGrupo("CIRCULANTE");
    else if (novoTipo === "PASSIVO") setGrupo("CIRCULANTE");
    else if (novoTipo === "PATRIMONIO_LIQUIDO") setGrupo("PATRIMONIO_LIQUIDO");
    else if (novoTipo === "APURACAO") setGrupo("APURACAO");
    else setGrupo("RESULTADO");
  }

  return (
    <div>
      <PageHeader
        etiqueta="Cadastros"
        titulo="Plano de Contas"
        descricao="Estrutura de contas do professor (1 Ativo, 2 Ativo não circulante, 3 Passivo, 4 PL, 5 Despesa/Custo, 6 Receita, 7 Apuração)."
        acoes={
          <Botao icone={Plus} onClick={abrirModal}>
            Nova conta
          </Botao>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Contas no plano" valor={String(estado.contas.length)} icone={ListTree} tom="indigo" />
        <StatCard titulo="Contas ativas" valor={String(totalAtivas)} icone={Power} tom="emerald" />
        <StatCard titulo="Personalizadas" valor={String(totalPersonalizadas)} icone={Plus} tom="violet" />
        <StatCard titulo="Com saldo" valor={String(totalComSaldo)} icone={SearchX} tom="sky" />
      </div>

      <Card>
        <CardHeader
          titulo="Contas contábeis"
          descricao={`${contas.length} conta(s) exibida(s)`}
          acao={
            <div className="flex flex-wrap items-center gap-2">
              <Toggle
                marcado={somenteAtivas}
                onChange={setSomenteAtivas}
                rotulo="Somente ativas"
              />
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Busca valor={busca} onChange={setBusca} placeholder="Buscar por código ou nome…" className="w-full sm:w-72" />
          <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full sm:w-52">
            <option value="">Todos os tipos</option>
            {TIPOS.map((item) => (
              <option key={item} value={item}>
                {tipoLabel(item)}
              </option>
            ))}
          </Select>
        </div>

        {contas.length === 0 ? (
          <EmptyState
            titulo="Nenhuma conta encontrada"
            descricao="Ajuste os filtros ou crie uma nova conta personalizada."
            icone={SearchX}
            acao={<Botao variante="secondary" icone={Plus} onClick={abrirModal}>Nova conta</Botao>}
          />
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Conta</Th>
                <Th>Tipo</Th>
                <Th>Grupo</Th>
                <Th alinhar="right">Saldo atual</Th>
                <Th alinhar="center">Situação</Th>
                <Th alinhar="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {contas.map((conta) => {
                const saldo = mapaSaldo.get(conta.id) ?? 0;
                return (
                  <tr key={conta.id} className={cn("hover:bg-slate-50/70", !conta.ativa && "opacity-60")}>
                    <Td className="font-mono text-xs font-semibold text-slate-500">{conta.codigo}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{conta.nome}</span>
                        {!conta.padrao ? <Badge tom="purple">Personalizada</Badge> : null}
                        {!conta.analitica ? <Badge tom="slate">Sintética</Badge> : null}
                      </div>
                    </Td>
                    <Td>
                      <Badge tom={TOM_TIPO[conta.tipo] ?? "slate"}>{tipoLabel(conta.tipo)}</Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">{grupoLabel(conta.grupo)}</Td>
                    <Td alinhar="right" className="font-semibold">
                      {saldo === 0 ? <span className="text-slate-300">—</span> : formatarMoeda(saldo)}
                    </Td>
                    <Td alinhar="center">
                      {conta.ativa ? <Badge tom="green">Ativa</Badge> : <Badge tom="slate">Inativa</Badge>}
                    </Td>
                    <Td alinhar="right">
                      <Botao
                        variante="ghost"
                        tamanho="sm"
                        icone={conta.ativa ? PowerOff : Power}
                        onClick={() => alternar(conta.id)}
                      >
                        {conta.ativa ? "Inativar" : "Reativar"}
                      </Botao>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        )}
      </Card>

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Nova conta contábil"
        descricao="O tipo precisa ser compatível com o primeiro dígito do código."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao icone={Plus} onClick={salvar}>
              Criar conta
            </Botao>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Código" obrigatorio hint="Ex.: 1.0.7 ou 3.1.4">
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="1.0.7" />
          </Campo>
          <Campo label="Tipo" obrigatorio>
            <Select value={tipo} onChange={(e) => aoMudarTipo(e.target.value as TipoConta)}>
              {TIPOS.map((item) => (
                <option key={item} value={item}>
                  {tipoLabel(item)}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Nome da conta" obrigatorio className="sm:col-span-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Aplicações de longo prazo" />
          </Campo>
          <Campo label="Natureza" obrigatorio>
            <Select value={natureza} onChange={(e) => setNatureza(e.target.value as Natureza)}>
              <option value="DEVEDORA">Devedora (D − C)</option>
              <option value="CREDORA">Credora (C − D)</option>
            </Select>
          </Campo>
          <Campo label="Grupo" obrigatorio>
            <Select value={grupo} onChange={(e) => setGrupo(e.target.value as GrupoConta)}>
              {GRUPOS.map((item) => (
                <option key={item} value={item}>
                  {grupoLabel(item)}
                </option>
              ))}
            </Select>
          </Campo>
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <Toggle
              marcado={analitica}
              onChange={setAnalitica}
              rotulo="Conta analítica"
              descricao="Analítica recebe lançamentos; sintética apenas agrupa."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
