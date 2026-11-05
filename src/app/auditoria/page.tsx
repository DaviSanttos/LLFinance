"use client";

import { useMemo, useState } from "react";
import { Download, History, SearchX, ShieldCheck, Users } from "lucide-react";
import {
  Badge,
  Botao,
  Busca,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  StatCard,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  baixarArquivo,
  formatarDataHora,
  hojeISO,
  normalizar,
} from "@/lib/utils";

const TOM_ACAO: Record<string, "green" | "red" | "amber" | "indigo" | "slate" | "blue"> = {
  CRIAR: "green",
  EDITAR: "amber",
  ESTORNAR: "red",
  APURAR: "indigo",
  LOGIN: "slate",
  IMPORTAR: "blue",
  FECHAR_PERIODO: "amber",
  REABRIR_PERIODO: "indigo",
  INATIVAR: "red",
  REATIVAR: "green",
};

export default function AuditoriaPage() {
  const { estado } = useApp();
  const [busca, setBusca] = useState("");
  const [entidade, setEntidade] = useState("");
  const [usuario, setUsuario] = useState("");

  const entidades = [...new Set(estado.auditoria.map((item) => item.entidade))];
  const usuarios = [...new Set(estado.auditoria.map((item) => item.usuario))];

  const eventos = useMemo(() => {
    const termo = normalizar(busca);
    return [...estado.auditoria]
      .filter((item) => {
        if (entidade && item.entidade !== entidade) return false;
        if (usuario && item.usuario !== usuario) return false;
        if (!termo) return true;
        return (
          normalizar(item.detalhe).includes(termo) ||
          normalizar(item.acao).includes(termo) ||
          normalizar(item.entidade).includes(termo) ||
          normalizar(item.usuario).includes(termo)
        );
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [estado.auditoria, busca, entidade, usuario]);

  function exportar() {
    const linhas = [
      "Data;Usuário;Ação;Entidade;Detalhe;Antes;Depois",
      ...eventos.map((item) =>
        [item.data, item.usuario, item.acao, item.entidade, item.detalhe, item.antes ?? "", item.depois ?? ""]
          .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
          .join(";"),
      ),
    ].join("\n");
    baixarArquivo(`llfinance-auditoria-${hojeISO()}.csv`, linhas, "text/csv");
  }

  return (
    <div>
      <PageHeader
        etiqueta="Controle"
        titulo="Trilha de Auditoria"
        descricao="Quem fez o quê, quando e em qual registro. Nenhuma operação é excluída: alterações geram estorno e novo lançamento."
        acoes={
          <Botao variante="secondary" icone={Download} onClick={exportar}>
            Exportar CSV
          </Botao>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Eventos registrados" valor={String(estado.auditoria.length)} icone={ShieldCheck} tom="indigo" />
        <StatCard titulo="Usuários envolvidos" valor={String(usuarios.length)} icone={Users} tom="violet" />
        <StatCard titulo="Entidades monitoradas" valor={String(entidades.length)} icone={History} tom="sky" />
        <StatCard titulo="Estornos" valor={String(estado.auditoria.filter((item) => item.acao === "ESTORNAR").length)} icone={History} tom="rose" />
      </div>

      <Card>
        <CardHeader
          titulo="Eventos"
          descricao={`${eventos.length} resultado(s)`}
          icone={History}
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Busca valor={busca} onChange={setBusca} placeholder="Detalhe, ação ou usuário…" className="w-full sm:w-72" />
          <Select value={entidade} onChange={(e) => setEntidade(e.target.value)} className="w-full sm:w-48">
            <option value="">Todas as entidades</option>
            {entidades.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <Select value={usuario} onChange={(e) => setUsuario(e.target.value)} className="w-full sm:w-48">
            <option value="">Todos os usuários</option>
            {usuarios.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </div>

        {eventos.length === 0 ? (
          <EmptyState titulo="Nenhum evento encontrado" descricao="Ajuste os filtros para ver outros registros." icone={SearchX} />
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Usuário</Th>
                <Th>Ação</Th>
                <Th>Entidade</Th>
                <Th>Detalhe</Th>
                <Th>Antes → Depois</Th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <Td className="whitespace-nowrap text-[11px] text-slate-500">{formatarDataHora(item.data)}</Td>
                  <Td className="text-xs font-medium text-slate-700">{item.usuario}</Td>
                  <Td>
                    <Badge tom={TOM_ACAO[item.acao] ?? "slate"}>{item.acao.replaceAll("_", " ")}</Badge>
                  </Td>
                  <Td className="text-xs text-slate-600">{item.entidade}</Td>
                  <Td className="max-w-[420px]">
                    <p className="text-[11px] leading-relaxed text-slate-600">{item.detalhe}</p>
                  </Td>
                  <Td className="text-[10px] text-slate-500">
                    {item.antes || item.depois ? (
                      <span>
                        {item.antes ?? "—"} <span className="text-slate-300">→</span> {item.depois ?? "—"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] text-slate-500">
          A trilha é somente leitura e cresce a cada operação. Último evento:{" "}
          {estado.auditoria[0] ? formatarDataHora(estado.auditoria[0].data) : "—"}
        </div>
      </Card>
    </div>
  );
}
