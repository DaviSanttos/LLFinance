"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArchiveRestore,
  CalendarCheck,
  CheckCircle2,
  Database,
  Download,
  HardDriveDownload,
  Lock,
  RefreshCcw,
  RotateCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Unlock,
  Upload,
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
  StatCard,
  Tabela,
  Td,
  Th,
  Toggle,
} from "@/components/ui";
import { useApp } from "@/lib/store";
import {
  baixarArquivo,
  formatarData,
  formatarDataHora,
  hojeISO,
  lerArquivoTexto,
  papelLabel,
} from "@/lib/utils";

export default function ConfiguracoesPage() {
  const {
    estado,
    empresa,
    usuarioAtual,
    fecharPeriodo,
    reabrirPeriodo,
    atualizarConfiguracoes,
    resetarDemo,
    exportarDados,
    importarDados,
    notificar,
  } = useApp();

  const [modalFechar, setModalFechar] = useState(false);
  const [modalReabrir, setModalReabrir] = useState(false);
  const [modalReset, setModalReset] = useState(false);
  const [confirmacaoReset, setConfirmacaoReset] = useState("");
  const inputArquivo = useRef<HTMLInputElement>(null);

  const periodoAberto = estado.periodo.status === "ABERTO";
  const ehAdmin = usuarioAtual.papel === "ADMIN";

  const eventosRecentes = useMemo(
    () =>
      [...estado.auditoria]
        .filter((item) => item.entidade === "Período" || item.entidade === "Configuração" || item.entidade === "Backup")
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 6),
    [estado.auditoria],
  );

  const operacoesAtivas = estado.operacoes.filter((op) => op.status === "ATIVA").length;
  const ultimoEvento = estado.auditoria[0];

  function fechar() {
    const resultado = fecharPeriodo();
    if (resultado.ok) {
      notificar(`Exercício ${estado.periodo.exercicio} fechado. Lançamentos bloqueados.`);
      setModalFechar(false);
    } else {
      notificar(resultado.erro ?? "Não foi possível fechar o período.", "erro");
    }
  }

  function reabrir() {
    const resultado = reabrirPeriodo();
    if (resultado.ok) {
      notificar(`Exercício ${estado.periodo.exercicio} reaberto.`);
      setModalReabrir(false);
    } else {
      notificar(resultado.erro ?? "Não foi possível reabrir o período.", "erro");
    }
  }

  function alternarEstoqueNegativo(valor: boolean) {
    const resultado = atualizarConfiguracoes({ bloquearEstoqueNegativo: valor });
    if (resultado.ok) {
      notificar(
        valor ? "Estoque negativo bloqueado." : "Estoque negativo permitido (com alerta na tela).",
        "info",
      );
    } else {
      notificar(resultado.erro ?? "Não foi possível atualizar a preferência.", "erro");
    }
  }

  function exportar() {
    baixarArquivo(`llfinance-backup-${hojeISO()}.json`, exportarDados());
    notificar("Backup completo exportado em JSON.");
  }

  async function importar(arquivo?: File) {
    if (!arquivo) return;
    try {
      const texto = await lerArquivoTexto(arquivo);
      const resultado = importarDados(texto);
      if (resultado.ok) notificar(`Backup "${arquivo.name}" restaurado com sucesso.`);
      else notificar(resultado.erro ?? "Backup inválido.", "erro");
    } catch {
      notificar("Não foi possível ler o arquivo selecionado.", "erro");
    } finally {
      if (inputArquivo.current) inputArquivo.current.value = "";
    }
  }

  function resetar() {
    resetarDemo();
    setModalReset(false);
    setConfirmacaoReset("");
    notificar("Demonstração restaurada ao estado inicial.", "info");
  }

  return (
    <div>
      <PageHeader
        etiqueta="Controle"
        titulo="Configurações"
        descricao="Exercício contábil, preferências de operação e backup dos dados da demonstração."
        acoes={
          <>
            <Badge tom={periodoAberto ? "green" : "red"}>
              {periodoAberto ? "Exercício aberto" : "Exercício fechado"}
            </Badge>
            <Botao variante="secondary" icone={Download} onClick={exportar}>
              Exportar backup
            </Botao>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Exercício"
          valor={estado.periodo.exercicio}
          hint={`${formatarData(estado.periodo.inicio)} a ${formatarData(estado.periodo.fim)}`}
          icone={CalendarCheck}
          tom="indigo"
        />
        <StatCard
          titulo="Situação do período"
          valor={periodoAberto ? "Aberto" : "Fechado"}
          hint={periodoAberto ? "Aceita lançamentos" : "Somente leitura"}
          icone={periodoAberto ? Unlock : Lock}
          tom={periodoAberto ? "emerald" : "rose"}
        />
        <StatCard
          titulo="Operações ativas"
          valor={String(operacoesAtivas)}
          hint={`${estado.operacoes.length} registros no total`}
          icone={Database}
          tom="violet"
        />
        <StatCard
          titulo="Sessão"
          valor={usuarioAtual.nome.split(" ")[0]}
          hint={papelLabel(usuarioAtual.papel)}
          icone={ShieldCheck}
          tom="sky"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              titulo="Exercício contábil"
              descricao="O fechamento valida o balancete e bloqueia novos lançamentos, estornos e vendas."
              icone={CalendarCheck}
              acao={<BadgeStatus status={estado.periodo.status} />}
            />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Info rotulo="Exercício" valor={estado.periodo.exercicio} />
              <Info rotulo="Início" valor={formatarData(estado.periodo.inicio)} />
              <Info rotulo="Fim" valor={formatarData(estado.periodo.fim)} />
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              {periodoAberto ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-lg">
                    <p className="text-sm font-semibold text-slate-800">Fechar o exercício</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      O sistema confere o balancete antes de fechar. Depois do fechamento, nenhuma
                      operação pode ser criada ou estornada até que um administrador reabra o período.
                    </p>
                  </div>
                  <Botao variante="danger" icone={Lock} onClick={() => setModalFechar(true)}>
                    Fechar período
                  </Botao>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-lg">
                    <p className="text-sm font-semibold text-slate-800">Reabrir o exercício</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      A reabertura é restrita a administradores e fica registrada na trilha de auditoria.
                      {!ehAdmin ? " Seu perfil atual não permite esta ação." : ""}
                    </p>
                  </div>
                  <Botao
                    variante="secondary"
                    icone={Unlock}
                    disabled={!ehAdmin}
                    onClick={() => setModalReabrir(true)}
                  >
                    Reabrir período
                  </Botao>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              titulo="Preferências de operação"
              descricao="Regras aplicadas a vendas, compras e ajustes de estoque."
              icone={SlidersHorizontal}
            />
            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-slate-200 px-4 py-3.5">
                <Toggle
                  marcado={estado.configuracoes.bloquearEstoqueNegativo}
                  onChange={alternarEstoqueNegativo}
                  rotulo="Bloquear estoque negativo"
                  descricao="Impede vender ou dar saída em quantidade maior do que o saldo disponível."
                />
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Partida dobrada obrigatória</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Débitos e créditos precisam ser iguais em toda operação. Regra fixa do sistema.
                    </p>
                  </div>
                  <Badge tom="green">Sempre ativa</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Exclusão de lançamentos</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Operações nunca são apagadas: o estorno gera uma nova operação e preserva o histórico.
                    </p>
                  </div>
                  <Badge tom="green">Sempre ativa</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              titulo="Backup e restauração"
              descricao="A demonstração fica no navegador. Exporte para guardar ou transfira para outro computador."
              icone={HardDriveDownload}
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-800">Exportar</p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Gera um arquivo JSON com empresa, plano de contas, operações, estoque, obrigações e
                  auditoria.
                </p>
                <Botao variante="secondary" tamanho="sm" icone={Download} onClick={exportar} className="mt-3">
                  Baixar backup
                </Botao>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-800">Restaurar</p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Substitui o estado atual pelo conteúdo do arquivo. Um evento de importação é gravado na
                  auditoria.
                </p>
                <input
                  ref={inputArquivo}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => importar(e.target.files?.[0])}
                />
                <Botao
                  variante="secondary"
                  tamanho="sm"
                  icone={Upload}
                  onClick={() => inputArquivo.current?.click()}
                  className="mt-3"
                >
                  Selecionar arquivo
                </Botao>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" /> Armazenamento local:{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                  llfinance:mock:v1
                </code>
              </span>
              <span>
                Versão do estado: v{estado.versao} · {estado.operacoes.length} operações ·{" "}
                {estado.auditoria.length} eventos
              </span>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Settings className="h-[18px] w-[18px]" />
              </span>
              <p className="text-sm font-semibold text-slate-900">Resumo da empresa</p>
            </div>
            <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
              <Linha rotulo="Razão social" valor={empresa.razaoSocial} />
              <Linha rotulo="CNPJ" valor={empresa.cnpj} />
              <Linha rotulo="Regime" valor={empresa.regime} />
              <Linha rotulo="Natureza" valor={empresa.natureza} />
              <Linha rotulo="Plano de contas" valor={`${estado.contas.length} contas`} />
              <Linha rotulo="Usuários" valor={`${estado.usuarios.length} cadastros`} />
            </dl>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Últimos eventos de configuração
            </p>
            {eventosRecentes.length === 0 ? (
              <p className="mt-3 text-[11px] text-slate-400">Nenhum evento registrado.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {eventosRecentes.map((item) => (
                  <li key={item.id} className="border-l-2 border-slate-100 pl-3">
                    <p className="text-[11px] font-semibold text-slate-700">{item.acao.replaceAll("_", " ")}</p>
                    <p className="text-[10px] leading-relaxed text-slate-500">{item.detalhe}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.usuario} · {formatarDataHora(item.data)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {ultimoEvento ? (
              <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                Último evento geral: {ultimoEvento.acao} em {formatarDataHora(ultimoEvento.data)}
              </p>
            ) : null}
          </Card>

          <Card className="border-rose-200">
            <CardHeader
              titulo="Zona de risco"
              descricao="Ações irreversíveis para a demonstração."
              icone={AlertTriangle}
            />
            <div className="p-5">
              <p className="text-xs leading-relaxed text-slate-500">
                Restaurar a demonstração apaga os dados salvos neste navegador e volta ao cenário
                original de 2026. Exporte um backup antes se quiser preservar o que já foi feito.
              </p>
              <Botao variante="danger" icone={RotateCcw} onClick={() => setModalReset(true)} className="mt-4 w-full">
                Resetar demonstração
              </Botao>
            </div>
          </Card>
        </div>
      </div>

      {eventosRecentes.length > 0 ? (
        <Card className="mt-5">
          <CardHeader
            titulo="Histórico de configuração do período"
            descricao="Fechamentos, reaberturas, preferências e backups."
            icone={ArchiveRestore}
          />
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
              {eventosRecentes.map((item) => (
                <tr key={`tabela-${item.id}`} className="hover:bg-slate-50/70">
                  <Td className="whitespace-nowrap text-[11px] text-slate-500">{formatarDataHora(item.data)}</Td>
                  <Td className="text-xs">{item.usuario}</Td>
                  <Td>
                    <Badge tom="slate">{item.acao.replaceAll("_", " ")}</Badge>
                  </Td>
                  <Td className="text-xs text-slate-600">{item.entidade}</Td>
                  <Td className="text-[11px] text-slate-500">{item.detalhe}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Card>
      ) : null}

      <Modal
        aberto={modalFechar}
        onFechar={() => setModalFechar(false)}
        titulo="Fechar o exercício"
        descricao="O balancete será conferido antes do fechamento."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalFechar(false)}>
              Cancelar
            </Botao>
            <Botao variante="danger" icone={Lock} onClick={fechar}>
              Confirmar fechamento
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          <Alerta tom="amber" titulo="Depois de fechar">
            Novos lançamentos, vendas, compras, ajustes e estornos ficam bloqueados. Apenas um
            administrador pode reabrir o período, e a ação fica auditada.
          </Alerta>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
            Exercício <strong>{estado.periodo.exercicio}</strong> · {estado.periodo.inicio} a{" "}
            {estado.periodo.fim} · {estado.operacoes.length} operações registradas.
          </div>
        </div>
      </Modal>

      <Modal
        aberto={modalReabrir}
        onFechar={() => setModalReabrir(false)}
        titulo="Reabrir o exercício"
        descricao="Ação restrita a administradores e registrada na auditoria."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalReabrir(false)}>
              Cancelar
            </Botao>
            <Botao variante="success" icone={Unlock} onClick={reabrir}>
              Reabrir período
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          <Alerta tom="blue" titulo="O período volta a aceitar movimentos">
            Lançamentos, vendas, compras, ajustes e estornos serão liberados novamente até o próximo
            fechamento.
          </Alerta>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Sessão atual: <strong>{usuarioAtual.nome}</strong> ({papelLabel(usuarioAtual.papel)})
          </div>
        </div>
      </Modal>

      <Modal
        aberto={modalReset}
        onFechar={() => {
          setModalReset(false);
          setConfirmacaoReset("");
        }}
        titulo="Resetar demonstração"
        descricao="Todos os dados salvos neste navegador serão substituídos pelo cenário inicial."
        rodape={
          <>
            <Botao
              variante="secondary"
              onClick={() => {
                setModalReset(false);
                setConfirmacaoReset("");
              }}
            >
              Cancelar
            </Botao>
            <Botao
              variante="danger"
              icone={RefreshCcw}
              onClick={resetar}
              disabled={confirmacaoReset.trim().toUpperCase() !== "RESETAR"}
            >
              Resetar agora
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          <Alerta tom="red" titulo="Esta ação não pode ser desfeita">
            Operações, vendas, ajustes, obrigações e eventos de auditoria criados nesta sessão serão
            perdidos. O backup exportado continua válido.
          </Alerta>
          <label className="block text-xs font-semibold text-slate-700">
            Digite <code className="rounded bg-slate-100 px-1.5 py-0.5">RESETAR</code> para confirmar
            <Input
              value={confirmacaoReset}
              onChange={(e) => setConfirmacaoReset(e.target.value)}
              placeholder="RESETAR"
              className="mt-1.5"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-50/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{rotulo}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{valor}</p>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{rotulo}</dt>
      <dd className="text-right font-medium text-slate-800">{valor}</dd>
    </div>
  );
}
