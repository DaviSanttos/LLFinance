"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Printer,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { centavosParaTexto, cn, parseMoeda } from "@/lib/utils";

type Variante = "primary" | "secondary" | "ghost" | "danger" | "success" | "dark";
type Tamanho = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primary:
    "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 focus-visible:ring-indigo-500",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
  danger:
    "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 focus-visible:ring-rose-500",
  success:
    "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:ring-emerald-500",
  dark: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function classesBotao(variante: Variante = "primary", tamanho: Tamanho = "md"): string {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    VARIANTES[variante],
    TAMANHOS[tamanho],
  );
}

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: LucideIcon;
}

export function Botao({
  variante = "primary",
  tamanho = "md",
  icone: Icone,
  className,
  children,
  type = "button",
  ...props
}: BotaoProps) {
  return (
    <button type={type} className={cn(classesBotao(variante, tamanho), className)} {...props}>
      {Icone ? <Icone className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

interface LinkBotaoProps {
  href: string;
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: LucideIcon;
  className?: string;
  children: ReactNode;
  target?: string;
}

export function LinkBotao({
  href,
  variante = "primary",
  tamanho = "md",
  icone: Icone,
  className,
  children,
  target,
}: LinkBotaoProps) {
  return (
    <Link href={href} className={cn(classesBotao(variante, tamanho), className)} target={target}>
      {Icone ? <Icone className="h-4 w-4 shrink-0" /> : null}
      {children}
    </Link>
  );
}

export function BotaoImprimir({ rotulo = "Imprimir / PDF" }: { rotulo?: string }) {
  return (
    <Botao variante="secondary" icone={Printer} onClick={() => window.print()} className="no-print">
      {rotulo}
    </Botao>
  );
}

export function Card({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.18)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  titulo,
  descricao,
  acao,
  icone: Icone,
  className,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  icone?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icone ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icone className="h-[18px] w-[18px]" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
          {descricao ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{descricao}</p> : null}
        </div>
      </div>
      {acao ? <div className="flex shrink-0 items-center gap-2">{acao}</div> : null}
    </div>
  );
}

export function PageHeader({
  titulo,
  descricao,
  acoes,
  etiqueta,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  etiqueta?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {etiqueta ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
            {etiqueta}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
        {descricao ? (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex flex-wrap items-center gap-2 no-print">{acoes}</div> : null}
    </div>
  );
}

type Tom = "slate" | "green" | "red" | "amber" | "blue" | "indigo" | "purple" | "emerald";

const TONS: Record<Tom, string> = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function Badge({
  children,
  tom = "slate",
  className,
}: {
  children: ReactNode;
  tom?: Tom;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BadgeStatus({ status }: { status: string }) {
  const mapa: Record<string, { tom: Tom; texto: string }> = {
    ATIVA: { tom: "green", texto: "Ativa" },
    ESTORNADA: { tom: "red", texto: "Estornada" },
    SUBSTITUIDA: { tom: "amber", texto: "Substituída" },
    PENDENTE: { tom: "amber", texto: "Pendente" },
    PAGA: { tom: "green", texto: "Paga" },
    ATRASADA: { tom: "red", texto: "Atrasada" },
    ABERTO: { tom: "green", texto: "Aberto" },
    FECHADO: { tom: "slate", texto: "Fechado" },
  };
  const item = mapa[status] ?? { tom: "slate" as Tom, texto: status };
  return <Badge tom={item.tom}>{item.texto}</Badge>;
}

export function Alerta({
  tom = "amber",
  titulo,
  children,
  acao,
}: {
  tom?: "amber" | "red" | "green" | "blue" | "indigo";
  titulo: string;
  children?: ReactNode;
  acao?: ReactNode;
}) {
  const estilos = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-rose-200 bg-rose-50 text-rose-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
  }[tom];
  const Icone = tom === "green" ? CheckCircle2 : tom === "blue" || tom === "indigo" ? Info : AlertTriangle;
  return (
    <div className={cn("flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3.5", estilos)}>
      <Icone className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{titulo}</p>
        {children ? <div className="mt-1 text-xs leading-relaxed opacity-90">{children}</div> : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}

export function Campo({
  label,
  hint,
  erro,
  children,
  obrigatorio,
  className,
}: {
  label?: string;
  hint?: string;
  erro?: string;
  children: ReactNode;
  obrigatorio?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
          {label}
          {obrigatorio ? <span className="text-rose-500">*</span> : null}
        </span>
      ) : null}
      {children}
      {erro ? (
        <span className="mt-1 block text-[11px] font-medium text-rose-600">{erro}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

const CAMPO_BASE =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CAMPO_BASE, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CAMPO_BASE, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(CAMPO_BASE, "h-auto min-h-[80px] resize-y py-2.5", className)}
      {...props}
    />
  );
}

export function CampoValor({
  valorCents,
  onChange,
  placeholder = "0,00",
  disabled,
  className,
  autoFocus,
}: {
  valorCents: number;
  onChange: (cents: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}) {
  const [texto, setTexto] = useState(() =>
    valorCents ? centavosParaTexto(valorCents) : "",
  );
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (!focado) setTexto(valorCents ? centavosParaTexto(valorCents) : "");
  }, [valorCents, focado]);

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
        R$
      </span>
      <input
        inputMode="decimal"
        autoFocus={autoFocus}
        disabled={disabled}
        value={texto}
        placeholder={placeholder}
        onChange={(evento) => {
          const bruto = evento.target.value;
          setTexto(bruto);
          onChange(parseMoeda(bruto));
        }}
        onFocus={() => setFocado(true)}
        onBlur={() => {
          setFocado(false);
          setTexto(valorCents ? centavosParaTexto(valorCents) : "");
        }}
        className={cn(CAMPO_BASE, "pl-9 text-right tabular-nums")}
      />
    </div>
  );
}

export function CampoData({
  valor,
  onChange,
  className,
  disabled,
}: {
  valor: string;
  onChange: (valor: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="date"
      value={valor}
      disabled={disabled}
      onChange={(evento) => onChange(evento.target.value)}
      className={cn(CAMPO_BASE, "tabular-nums", className)}
    />
  );
}

export function Busca({
  valor,
  onChange,
  placeholder = "Buscar...",
  className,
}: {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder={placeholder}
        className={cn(CAMPO_BASE, "pl-9")}
      />
    </div>
  );
}

export function Tabela({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  alinhar = "left",
}: {
  children?: ReactNode;
  className?: string;
  alinhar?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500",
        alinhar === "right" && "text-right",
        alinhar === "center" && "text-center",
        alinhar === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  alinhar = "left",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  alinhar?: "left" | "right" | "center";
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-slate-100 px-4 py-2.5 align-middle text-slate-700",
        alinhar === "right" && "text-right tabular-nums",
        alinhar === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyState({
  titulo,
  descricao,
  acao,
  icone: Icone,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  icone?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {Icone ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icone className="h-6 w-6" />
        </span>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-slate-800">{titulo}</p>
        {descricao ? <p className="mt-1 max-w-md text-xs text-slate-500">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}

export function StatCard({
  titulo,
  valor,
  hint,
  icone: Icone,
  tom = "indigo",
  detalhe,
}: {
  titulo: string;
  valor: string;
  hint?: string;
  icone: LucideIcon;
  tom?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";
  detalhe?: ReactNode;
}) {
  const estilos = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  }[tom];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {valor}
          </p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", estilos)}>
          <Icone className="h-5 w-5" />
        </span>
      </div>
      {detalhe ? <div className="mt-3 border-t border-slate-100 pt-3">{detalhe}</div> : null}
    </Card>
  );
}

export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = "max-w-lg",
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onFechar}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl",
          largura,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
            {descricao ? <p className="mt-0.5 text-xs text-slate-500">{descricao}</p> : null}
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {rodape ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            {rodape}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Toggle({
  marcado,
  onChange,
  rotulo,
  descricao,
  disabled,
}: {
  marcado: boolean;
  onChange: (valor: boolean) => void;
  rotulo?: string;
  descricao?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      {rotulo ? (
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{rotulo}</p>
          {descricao ? <p className="mt-0.5 text-xs text-slate-500">{descricao}</p> : null}
        </div>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={marcado}
        aria-label={rotulo}
        disabled={disabled}
        onClick={() => onChange(!marcado)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50",
          marcado ? "bg-emerald-500" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            marcado ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function BarraProgresso({
  valor,
  max,
  tom = "indigo",
}: {
  valor: number;
  max: number;
  tom?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const percentual = max > 0 ? Math.min(100, Math.max(0, (valor / max) * 100)) : 0;
  const cores = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tom];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full transition-all", cores)} style={{ width: `${percentual}%` }} />
    </div>
  );
}

export function LinhaResumo({
  rotulo,
  valor,
  destaque,
  tom,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  tom?: "positivo" | "negativo";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2",
        destaque && "border-t border-slate-200 pt-3 text-base font-semibold",
      )}
    >
      <span className={cn("text-sm", destaque ? "text-slate-900" : "text-slate-500")}>{rotulo}</span>
      <span
        className={cn(
          "tabular-nums",
          destaque ? "text-base font-semibold" : "text-sm font-medium",
          tom === "positivo" && "text-emerald-600",
          tom === "negativo" && "text-rose-600",
          !tom && "text-slate-800",
        )}
      >
        {valor}
      </span>
    </div>
  );
}

export function EtiquetaMock() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Dados demonstrativos
    </span>
  );
}
