"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Calculator,
  Info,
  Package,
  PlusCircle,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import {
  Alerta,
  Badge,
  BadgeStatus,
  Botao,
  Campo,
  CampoData,
  CampoValor,
  Card,
  CardHeader,
  Input,
  PageHeader,
  Select,
  StatCard,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { calcularEstoque, valorOperacao } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda, formatarQuantidade, hojeISO } from "@/lib/utils";

type Modo = "MERCADORIA" | "SERVICO";

export default function VendasPage() {
  const { estado, registrarVenda, notificar } = useApp();
  const [modo, setModo] = useState<Modo>("MERCADORIA");
  const [data, setData] = useState(
    hojeISO() >= estado.periodo.inicio && hojeISO() <= estado.periodo.fim
      ? hojeISO()
      : estado.periodo.inicio,
  );
  const [condicao, setCondicao] = useState<"AVISTA" | "PRAZO">("AVISTA");
  const [parceiro, setParceiro] = useState("");
  const [produtoId, setProdutoId] = useState(estado.produtos[0]?.id ?? "");
  const [quantidade, setQuantidade] = useState(1);
  const [precoCents, setPrecoCents] = useState(0);
  const [descricaoServico, setDescricaoServico] = useState("");
  const [erro, setErro] = useState("");

  const estoque = useMemo(
    () => calcularEstoque(estado.produtos, estado.movimentosEstoque),
    [estado.produtos, estado.movimentosEstoque],
  );

  const produtoEstoque = estoque.find((item) => item.produto.id === produtoId);

  const valorTotal = modo === "MERCADORIA" ? Math.round(quantidade * precoCents) : precoCents;
  const cmvPrevisto =
    modo === "MERCADORIA"
      ? Math.round(quantidade * (produtoEstoque?.custoMedioCents ?? 0))
      : 0;
  const resultadoBruto = valorTotal - cmvPrevisto;

  const fechado = estado.periodo.status === "FECHADO";

  const vendas = useMemo(
    () =>
      [...estado.operacoes]
        .filter((op) => op.tipo === "VENDA")
        .sort((a, b) => b.data.localeCompare(a.data) || b.numero.localeCompare(a.numero)),
    [estado.operacoes],
  );

  const receitaVendas = useMemo(() => {
    return estado.operacoes
      .filter((op) => op.tipo === "VENDA" && op.status === "ATIVA")
      .reduce((total, op) => total + valorOperacao(op), 0);
  }, [estado.operacoes]);

  const totalCMV = useMemo(
    () => estoque.reduce((total, item) => total + item.cmvTotalCents, 0),
    [estoque],
  );

  function registrar() {
    setErro("");
    const resultado = registrarVenda({
      data,
      modo,
      condicao,
      parceiro,
      produtoId: modo === "MERCADORIA" ? produtoId : undefined,
      quantidade: modo === "MERCADORIA" ? quantidade : 1,
      valorUnitarioCents: precoCents,
      descricaoServico,
    });
    if (resultado.ok && resultado.data) {
      notificar(`Venda ${resultado.data.numero} registrada com as partidas contábeis.`);
      setPrecoCents(0);
      setQuantidade(1);
      setParceiro("");
      setDescricaoServico("");
    } else {
      setErro(resultado.erro ?? "Não foi possível registrar a venda.");
      notificar(resultado.erro ?? "Não foi possível registrar a venda.", "erro");
    }
  }

  return (
    <div>
      <PageHeader
        etiqueta="Movimentos"
        titulo="Vendas"
        descricao="A venda gera automaticamente receita, recebimento (ou cliente) e o CMV pela baixa do estoque."
        acoes={
          <Link
            href="/diario"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Ver Diário <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Vendas registradas" valor={String(vendas.filter((v) => v.status === "ATIVA").length)} icone={ShoppingCart} tom="indigo" />
        <StatCard titulo="Receita de vendas" valor={formatarMoeda(receitaVendas)} icone={BadgeDollarSign} tom="emerald" />
        <StatCard titulo="CMV acumulado" valor={formatarMoeda(totalCMV)} icone={Package} tom="violet" />
        <StatCard
          titulo="Margem bruta"
          valor={formatarMoeda(receitaVendas - totalCMV)}
          hint={receitaVendas ? `${(((receitaVendas - totalCMV) / receitaVendas) * 100).toFixed(1).replace(".", ",")}% sobre vendas` : undefined}
          icone={Calculator}
          tom="sky"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader titulo="Nova venda" descricao="Mercadoria ou prestação de serviço." icone={PlusCircle} />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {([
                { valor: "MERCADORIA" as Modo, rotulo: "Mercadoria", icone: Package },
                { valor: "SERVICO" as Modo, rotulo: "Serviço", icone: Wrench },
              ] as const).map((item) => (
                <button
                  key={item.valor}
                  type="button"
                  onClick={() => setModo(item.valor)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                    modo === item.valor ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500",
                  )}
                >
                  <item.icone className="h-3.5 w-3.5" /> {item.rotulo}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Data" obrigatorio>
                <CampoData valor={data} onChange={setData} disabled={fechado} />
              </Campo>
              <Campo label="Recebimento" obrigatorio>
                <Select value={condicao} onChange={(e) => setCondicao(e.target.value as "AVISTA" | "PRAZO")} disabled={fechado}>
                  <option value="AVISTA">À vista (Caixa)</option>
                  <option value="PRAZO">A prazo (Clientes)</option>
                </Select>
              </Campo>
              <Campo label="Cliente" className="sm:col-span-2">
                <Input value={parceiro} onChange={(e) => setParceiro(e.target.value)} placeholder="Cliente Balcão" disabled={fechado} />
              </Campo>

              {modo === "MERCADORIA" ? (
                <>
                  <Campo label="Produto" obrigatorio className="sm:col-span-2">
                    <Select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} disabled={fechado}>
                      {estado.produtos.map((produto) => {
                        const item = estoque.find((e) => e.produto.id === produto.id);
                        return (
                          <option key={produto.id} value={produto.id}>
                            {produto.nome} · {formatarQuantidade(item?.quantidade ?? 0)} {produto.unidade}
                          </option>
                        );
                      })}
                    </Select>
                  </Campo>
                  <Campo label="Quantidade" obrigatorio>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={quantidade}
                      onChange={(e) => setQuantidade(Number(e.target.value))}
                      disabled={fechado}
                    />
                  </Campo>
                  <Campo label="Preço unitário" obrigatorio>
                    <CampoValor valorCents={precoCents} onChange={setPrecoCents} disabled={fechado} />
                  </Campo>
                </>
              ) : (
                <>
                  <Campo label="Descrição do serviço" obrigatorio className="sm:col-span-2">
                    <Input
                      value={descricaoServico}
                      onChange={(e) => setDescricaoServico(e.target.value)}
                      placeholder="Ex.: Consultoria contábil mensal"
                      disabled={fechado}
                    />
                  </Campo>
                  <Campo label="Valor do serviço" obrigatorio className="sm:col-span-2">
                    <CampoValor valorCents={precoCents} onChange={setPrecoCents} disabled={fechado} />
                  </Campo>
                </>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Valor da venda</span>
                <span className="font-semibold tabular-nums text-slate-900">{formatarMoeda(valorTotal)}</span>
              </div>
              {modo === "MERCADORIA" ? (
                <>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500">CMV previsto</span>
                    <span className="font-semibold tabular-nums text-rose-600">− {formatarMoeda(cmvPrevisto)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Resultado bruto</span>
                    <span className={cn("font-semibold tabular-nums", resultadoBruto >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {formatarMoeda(resultadoBruto)}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Custo médio atual: {formatarMoeda(produtoEstoque?.custoMedioCents ?? 0)} · disponível:{" "}
                    {formatarQuantidade(produtoEstoque?.quantidade ?? 0)} un.
                  </p>
                </>
              ) : null}
            </div>

            {erro ? <Alerta tom="red" titulo="Venda não registrada">{erro}</Alerta> : null}
            {fechado ? <Alerta tom="red" titulo="Exercício fechado">Reabra o período para vender.</Alerta> : null}

            <Botao onClick={registrar} disabled={fechado || valorTotal <= 0} icone={ShoppingCart} className="w-full">
              Registrar venda
            </Botao>

            <div className="flex items-start gap-2 rounded-xl bg-indigo-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-indigo-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Partidas geradas: D Caixa/Clientes · C Receita de Vendas; D CMV · C Estoques (quando há
              custo).
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Vendas do período"
            descricao={`${vendas.length} registro(s)`}
            acao={<Badge tom="green">Receita reconhecida na competência</Badge>}
          />
          {vendas.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">Nenhuma venda registrada.</div>
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <Th>Documento</Th>
                  <Th>Data</Th>
                  <Th>Cliente</Th>
                  <Th>Itens</Th>
                  <Th alinhar="right">Valor</Th>
                  <Th alinhar="center">Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-slate-50/70">
                    <Td className="font-mono text-[11px] text-slate-500">{venda.documento?.numero ?? venda.numero}</Td>
                    <Td className="whitespace-nowrap text-xs">{formatarData(venda.data)}</Td>
                    <Td className="max-w-[160px] truncate text-xs">{venda.documento?.parceiro ?? "—"}</Td>
                    <Td className="text-xs text-slate-500">
                      {venda.documento?.itens?.map((item) => `${formatarQuantidade(item.quantidade)}× ${item.descricao}`).join(", ") ?? "—"}
                    </Td>
                    <Td alinhar="right" className="font-semibold">{formatarMoeda(valorOperacao(venda))}</Td>
                    <Td alinhar="center"><BadgeStatus status={venda.status} /></Td>
                    <Td alinhar="right">
                      <Link href={`/diario/${venda.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        Ver
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}
        </Card>
      </div>
    </div>
  );
}
