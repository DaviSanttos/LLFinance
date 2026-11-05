"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  BookText,
  Boxes,
  Building2,
  CalendarClock,
  Calculator,
  CheckCircle2,
  Database,
  FileText,
  Info,
  Landmark,
  LayoutDashboard,
  ListTree,
  Menu,
  PackagePlus,
  PlusCircle,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, iniciais, papelLabel } from "@/lib/utils";

interface ItemNav {
  href: string;
  rotulo: string;
  icone: LucideIcon;
}

const NAV: Array<{ titulo: string; itens: ItemNav[] }> = [
  {
    titulo: "Visão geral",
    itens: [{ href: "/", rotulo: "Dashboard", icone: LayoutDashboard }],
  },
  {
    titulo: "Cadastros",
    itens: [
      { href: "/empresa", rotulo: "Empresa", icone: Building2 },
      { href: "/plano-contas", rotulo: "Plano de Contas", icone: ListTree },
      { href: "/saldos-iniciais", rotulo: "Saldos Iniciais", icone: Wallet },
    ],
  },
  {
    titulo: "Movimentos",
    itens: [
      { href: "/lancamentos", rotulo: "Lançamentos", icone: BookOpen },
      { href: "/lancamentos/novo", rotulo: "Novo Lançamento", icone: PlusCircle },
      { href: "/vendas", rotulo: "Vendas", icone: ShoppingCart },
      { href: "/compras", rotulo: "Compras", icone: PackagePlus },
      { href: "/diario", rotulo: "Livro Diário", icone: BookText },
      { href: "/apuracao", rotulo: "Apuração", icone: Calculator },
    ],
  },
  {
    titulo: "Relatórios",
    itens: [
      { href: "/razao", rotulo: "Livro Razão", icone: BarChart3 },
      { href: "/balancete", rotulo: "Balancete", icone: Scale },
      { href: "/balanco", rotulo: "Balanço Patrimonial", icone: Landmark },
      { href: "/dre", rotulo: "DRE", icone: TrendingUp },
      { href: "/relatorios", rotulo: "Central de Relatórios", icone: FileText },
    ],
  },
  {
    titulo: "Controle",
    itens: [
      { href: "/estoque", rotulo: "Estoque", icone: Boxes },
      { href: "/obrigacoes", rotulo: "Obrigações", icone: CalendarClock },
      { href: "/auditoria", rotulo: "Auditoria", icone: ShieldCheck },
      { href: "/usuarios", rotulo: "Usuários", icone: Users },
      { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
    ],
  },
];

const TITULOS: Array<[string, string]> = [
  ["/lancamentos/novo", "Novo lançamento"],
  ["/lancamentos", "Lançamentos"],
  ["/diario", "Livro Diário"],
  ["/plano-contas", "Plano de Contas"],
  ["/saldos-iniciais", "Saldos Iniciais"],
  ["/relatorios", "Central de Relatórios"],
  ["/balancete", "Balancete de Verificação"],
  ["/balanco", "Balanço Patrimonial"],
  ["/auditoria", "Trilha de Auditoria"],
  ["/obrigacoes", "Obrigações Fiscais"],
  ["/configuracoes", "Configurações"],
  ["/apuracao", "Apuração do Resultado"],
  ["/empresa", "Empresa"],
  ["/usuarios", "Usuários e Perfis"],
  ["/estoque", "Controle de Estoque"],
  ["/vendas", "Vendas"],
  ["/compras", "Compras"],
  ["/razao", "Livro Razão"],
  ["/dre", "DRE"],
  ["/", "Dashboard"],
];

function tituloDaRota(pathname: string): string {
  if (pathname.startsWith("/diario/")) return "Detalhe da operação";
  return TITULOS.find(([rota]) => pathname === rota || pathname.startsWith(`${rota}/`))?.[1] ?? "LLFinance";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    hidratado,
    empresa,
    usuarioAtual,
    estado,
    selecionarUsuario,
    toasts,
    fecharToast,
  } = useApp();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  const titulo = useMemo(() => tituloDaRota(pathname), [pathname]);

  if (!hidratado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            LL
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">LLFinance</p>
            <p className="text-xs text-slate-500">Sistema Contábil Educacional</p>
          </div>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
        </div>
        <p className="text-xs text-slate-400">Carregando dados de demonstração…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {menuAberto ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuAberto(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "app-sidebar fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-slate-950 text-slate-300 transition-transform duration-200 lg:translate-x-0 print:hidden",
          menuAberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
              LL
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-white">
                LLFinance
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Contabilidade
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span className="truncate">{empresa.nomeFantasia}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>{empresa.cnpj}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-semibold",
                estado.periodo.status === "ABERTO"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400",
              )}
            >
              {estado.periodo.exercicio} · {estado.periodo.status}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {grupo.titulo}
              </p>
              <div className="space-y-0.5">
                {grupo.itens.map((item) => {
                  const ativo =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icone = item.icone;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors",
                        ativo
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
                      )}
                    >
                      {ativo ? (
                        <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-indigo-400" />
                      ) : null}
                      <Icone
                        className={cn(
                          "h-4 w-4 shrink-0",
                          ativo ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300",
                        )}
                      />
                      <span className="truncate">{item.rotulo}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
              {iniciais(usuarioAtual.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{usuarioAtual.nome}</p>
              <p className="truncate text-[10px] text-slate-500">{papelLabel(usuarioAtual.papel)}</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
            Etapa 1 · dados mockados
            <br />
            v0.1.0 — visual em aprovação
          </p>
        </div>
      </aside>

      <div className="app-main lg:pl-[268px]">
        <header className="app-topbar sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md print:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                onClick={() => setMenuAberto(true)}
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:block">
                  LLFinance / {empresa.razaoSocial}
                </p>
                <h1 className="truncate text-sm font-semibold text-slate-900">{titulo}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {estado.periodo.status === "ABERTO" ? "Exercício aberto" : "Exercício fechado"}
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 xl:block">
                {estado.periodo.inicio.slice(0, 4)}
              </span>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                  {iniciais(usuarioAtual.nome)}
                </span>
                <select
                  value={estado.usuarioAtualId}
                  onChange={(evento) => selecionarUsuario(evento.target.value)}
                  className="max-w-[132px] cursor-pointer border-0 bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none"
                  aria-label="Usuário da sessão"
                >
                  {estado.usuarios
                    .filter((usuario) => usuario.ativo)
                    .map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="app-content mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2 no-print">
        {toasts.map((toast) => {
          const estilos = {
            sucesso: "border-emerald-200 bg-white text-emerald-700",
            erro: "border-rose-200 bg-white text-rose-700",
            info: "border-sky-200 bg-white text-sky-700",
            aviso: "border-amber-200 bg-white text-amber-700",
          }[toast.tipo];
          const Icone =
            toast.tipo === "sucesso"
              ? CheckCircle2
              : toast.tipo === "erro"
                ? XCircle
                : toast.tipo === "aviso"
                  ? AlertTriangle
                  : Info;
          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/10",
                estilos,
              )}
            >
              <Icone className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-xs font-medium leading-relaxed text-slate-700">
                {toast.mensagem}
              </p>
              <button
                type="button"
                onClick={() => fecharToast(toast.id)}
                className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Fechar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
