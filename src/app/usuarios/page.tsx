"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Plus,
  Power,
  PowerOff,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Alerta,
  Badge,
  Botao,
  Campo,
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
} from "@/components/ui";
import { useApp } from "@/lib/store";
import type { Papel } from "@/lib/types";
import { cn, formatarDataHora, iniciais, papelLabel } from "@/lib/utils";

const PAPEIS: Papel[] = ["ADMIN", "CONTADOR", "AUXILIAR", "CONSULTA"];

const TOM_PAPEL: Record<Papel, "indigo" | "blue" | "amber" | "slate"> = {
  ADMIN: "indigo",
  CONTADOR: "blue",
  AUXILIAR: "amber",
  CONSULTA: "slate",
};

const PERMISSOES: Array<{ papel: Papel; pode: string[]; naoPode: string[] }> = [
  {
    papel: "ADMIN",
    pode: ["Tudo: lançar, estornar, apurar, fechar e reabrir o período", "Gerenciar usuários e configurações"],
    naoPode: [],
  },
  {
    papel: "CONTADOR",
    pode: ["Lançar, estornar, apurar", "Fechar o período", "Acessar todos os relatórios"],
    naoPode: ["Reabrir período fechado", "Gerenciar usuários"],
  },
  {
    papel: "AUXILIAR",
    pode: ["Registrar lançamentos, vendas e compras", "Consultar relatórios e estoque"],
    naoPode: ["Estornar operações", "Apurar resultado", "Fechar ou reabrir período"],
  },
  {
    papel: "CONSULTA",
    pode: ["Visualizar relatórios e o Diário", "Exportar relatórios em PDF"],
    naoPode: ["Criar ou alterar qualquer registro"],
  },
];

export default function UsuariosPage() {
  const {
    estado,
    usuarioAtual,
    criarUsuario,
    alternarUsuarioAtivo,
    selecionarUsuario,
    notificar,
  } = useApp();
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("AUXILIAR");

  const usuarios = useMemo(
    () => [...estado.usuarios].sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, "pt-BR")),
    [estado.usuarios],
  );

  const ativos = estado.usuarios.filter((usuario) => usuario.ativo);
  const administradores = estado.usuarios.filter((usuario) => usuario.papel === "ADMIN" && usuario.ativo);

  function abrirModal() {
    setNome("");
    setEmail("");
    setPapel("AUXILIAR");
    setModalAberto(true);
  }

  function salvar() {
    const resultado = criarUsuario({ nome, email, papel });
    if (resultado.ok) {
      notificar(`Usuário ${resultado.data?.nome} criado como ${papelLabel(papel)}.`);
      setModalAberto(false);
    } else {
      notificar(resultado.erro ?? "Não foi possível criar o usuário.", "erro");
    }
  }

  function alternar(id: string) {
    const resultado = alternarUsuarioAtivo(id);
    if (resultado.ok) notificar("Situação do usuário atualizada.");
    else notificar(resultado.erro ?? "Não foi possível alterar o usuário.", "erro");
  }

  function assumir(id: string) {
    selecionarUsuario(id);
    const usuario = estado.usuarios.find((item) => item.id === id);
    if (usuario) notificar(`Sessão alterada para ${usuario.nome}.`, "info");
  }

  return (
    <div>
      <PageHeader
        etiqueta="Controle"
        titulo="Usuários e Perfis"
        descricao="Quem opera o sistema e com qual nível de permissão. Cada lançamento registra o responsável na trilha de auditoria."
        acoes={
          <Botao icone={Plus} onClick={abrirModal}>
            Novo usuário
          </Botao>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Usuários cadastrados" valor={String(estado.usuarios.length)} icone={Users} tom="indigo" />
        <StatCard titulo="Ativos" valor={String(ativos.length)} icone={UserCheck} tom="emerald" />
        <StatCard titulo="Administradores" valor={String(administradores.length)} icone={ShieldCheck} tom="violet" />
        <StatCard
          titulo="Sessão atual"
          valor={usuarioAtual.nome.split(" ")[0]}
          hint={papelLabel(usuarioAtual.papel)}
          icone={KeyRound}
          tom="sky"
        />
      </div>

      <div className="mb-5">
        <Alerta tom="blue" titulo="Perfis de acesso">
          O papel do usuário define o que ele pode fazer. A troca de sessão no topo da tela é imediata e
          fica registrada na auditoria. O usuário da sessão atual não pode ser desativado.
        </Alerta>
      </div>

      <Card className="mb-5">
        <CardHeader
          titulo="Usuários do sistema"
          descricao={`${usuarios.length} cadastro(s) · ${ativos.length} ativo(s)`}
          icone={Users}
        />
        <Tabela>
          <thead>
            <tr>
              <Th>Usuário</Th>
              <Th>E-mail</Th>
              <Th>Perfil</Th>
              <Th>Último acesso</Th>
              <Th alinhar="center">Situação</Th>
              <Th alinhar="right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const ehSessao = usuario.id === estado.usuarioAtualId;
              return (
                <tr
                  key={usuario.id}
                  className={cn("hover:bg-slate-50/70", !usuario.ativo && "opacity-60")}
                >
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                        {iniciais(usuario.nome)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{usuario.nome}</p>
                        {ehSessao ? (
                          <span className="text-[10px] font-semibold text-indigo-600">Sessão atual</span>
                        ) : null}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs text-slate-500">{usuario.email}</Td>
                  <Td>
                    <Badge tom={TOM_PAPEL[usuario.papel]}>{papelLabel(usuario.papel)}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-[11px] text-slate-500">
                    {formatarDataHora(usuario.ultimoAcesso)}
                  </Td>
                  <Td alinhar="center">
                    {usuario.ativo ? <Badge tom="green">Ativo</Badge> : <Badge tom="slate">Inativo</Badge>}
                  </Td>
                  <Td alinhar="right">
                    <div className="flex items-center justify-end gap-1.5">
                      {usuario.ativo && !ehSessao ? (
                        <Botao variante="ghost" tamanho="sm" icone={UserCheck} onClick={() => assumir(usuario.id)}>
                          Assumir
                        </Botao>
                      ) : null}
                      <Botao
                        variante="ghost"
                        tamanho="sm"
                        icone={usuario.ativo ? PowerOff : Power}
                        disabled={ehSessao}
                        onClick={() => alternar(usuario.id)}
                      >
                        {usuario.ativo ? "Desativar" : "Reativar"}
                      </Botao>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] text-slate-500">
          {estado.auditoria.filter((item) => item.entidade === "Usuário").length} evento(s) de usuário na
          auditoria. Nenhum cadastro é excluído: apenas ativado ou inativado.
        </div>
      </Card>

      <Card>
        <CardHeader
          titulo="Matriz de permissões"
          descricao="Resumo do que cada perfil pode fazer na etapa atual do sistema."
          icone={ShieldCheck}
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {PERMISSOES.map((item) => (
            <div key={item.papel} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Badge tom={TOM_PAPEL[item.papel]}>{papelLabel(item.papel)}</Badge>
                {item.papel === usuarioAtual.papel ? <Badge tom="green">Seu perfil</Badge> : null}
              </div>
              <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                {item.pode.map((texto) => (
                  <li key={texto} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {texto}
                  </li>
                ))}
                {item.naoPode.map((texto) => (
                  <li key={texto} className="flex items-start gap-1.5 text-slate-400">
                    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[9px] leading-none">
                      ×
                    </span>
                    {texto}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Novo usuário"
        descricao="O usuário entra ativo e passa a aparecer no seletor de sessão do topo."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao icone={Plus} onClick={salvar} disabled={!nome.trim() || !email.trim()}>
              Criar usuário
            </Botao>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome completo" obrigatorio className="sm:col-span-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Beatriz Lima" />
          </Campo>
          <Campo label="E-mail" obrigatorio className="sm:col-span-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@llfinance.com.br"
            />
          </Campo>
          <Campo label="Perfil de acesso" obrigatorio className="sm:col-span-2">
            <Select value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
              {PAPEIS.map((item) => (
                <option key={item} value={item}>
                  {papelLabel(item)}
                </option>
              ))}
            </Select>
          </Campo>
          <div className="sm:col-span-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
            O perfil <strong>{papelLabel(papel)}</strong> será aplicado imediatamente. Você pode alterar
            a situação do usuário depois, mas não excluir o cadastro.
          </div>
        </div>
      </Modal>
    </div>
  );
}
