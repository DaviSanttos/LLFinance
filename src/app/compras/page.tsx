"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Info,
  Landmark,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
  Truck,
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
import { valorOperacao } from "@/lib/accounting";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda, hojeISO } from "@/lib/utils";

export default function ComprasPage() {
  const { estado, registrarCompra, notificar } = useApp();
  const [data, setData] = useState(
    hojeISO() >= estado.periodo.inicio && hojeISO() <= estado.periodo.fim
      ? hojeISO()
      : estado.periodo.inicio,
  );
  const [fornecedor, setFornecedor] = useState("");
  const [produtoId, setProdutoId] = useState(estado.produtos[0]?.id ?? "");
  const [quantidade, setQuantidade] = useState(1);
  const [custoCents, setCustoCents] = useState(0);
  const [condicao, setCondicao] = useState<"AVISTA" | "PRAZO">("PRAZO");
  const [parcelas, setParcelas] = useState(14);
  const [destino, setDestino] = useState<"ESTOQUE" | "DESPESA">("ESTOQUE");
  const [contaDespesaId, setContaDespesaId] = useState("");
  const [erro, setErro] = useState("");

  const contasDespesa = useMemo(
    () =>
      estado.contas
        .filter((conta) => conta.ativa && conta.analitica && (conta.tipo === "DESPESA" || conta.tipo === "CUSTO"))
        .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR")),
    [estado.contas],
  );

  const total = Math.round(quantidade * custoCents);
  const parcelasCp = Math.min(parcelas, 12);
  const parcelasLp = Math.max(0, parcelas - 12);
  const valorCp = parcelasLp === 0 ? total : Math.round((total * parcelasCp) / parcelas);
  const valorLp = total - valorCp;
  const fechado = estado.periodo.status === "FECHADO";

  const compras = useMemo(
    () =>
      [...estado.operacoes]
        .filter((op) => op.tipo === "COMPRA")
        .sort((a, b) => b.data.localeCompare(a.data) || b.numero.localeCompare(a.numero)),
    [estado.operacoes],
  );

  const totalCompras = compras
    .filter((op) => op.status === "ATIVA")
    .reduce((t, op) => t + valorOperacao(op), 0);

  function registrar() {
    setErro("");
    const resultado = registrarCompra({
      data,
      fornecedor,
      produtoId,
      quantidade,
      custoUnitarioCents: custoCents,
      condicao,
      parcelas,
      destino,
      contaDespesaId: destino === "DESPESA" ? contaDespesaId || contasDespesa[0]?.id : undefined,
    });
    if (resultado.ok && resultado.data) {
      notificar(`Compra ${resultado.data.numero} registrada com as partidas contábeis.`);
      setCustoCents(0);
      setQuantidade(1);
      setFornecedor("");
    } else {
      setErro(resultado.erro ?? "Não foi possível registrar a compra.");
      notificar(resultado.erro ?? "Não foi possível registrar a compra.", "erro");
    }
  }

  return (
    <div>
      <PageHeader
        etiqueta="Movimentos"
        titulo="Compras"
        descricao="A compra a prazo divide automaticamente o passivo: até 12 parcelas no circulante e o excedente no longo prazo."
        acoes={
          <Link href="/diario" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            Ver Diário <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Compras registradas" valor={String(compras.filter((c) => c.status === "ATIVA").length)} icone={ShoppingBag} tom="indigo" />
        <StatCard titulo="Total comprado" valor={formatarMoeda(totalCompras)} icone={Truck} tom="violet" />
        <StatCard titulo="Parcelas no CP" valor={formatarMoeda(valorCp)} hint="Até 12 parcelas · Fornecedores" icone={CreditCard} tom="amber" />
        <StatCard titulo="Parcelas no LP" valor={formatarMoeda(valorLp)} hint="Excedente · Contas a Pagar LP" icone={Landmark} tom="sky" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader titulo="Nova compra" descricao="Mercadoria para estoque ou despesa direta." icone={PackagePlus} />
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Data" obrigatorio>
                <CampoData valor={data} onChange={setData} disabled={fechado} />
              </Campo>
              <Campo label="Condição" obrigatorio>
                <Select value={condicao} onChange={(e) => setCondicao(e.target.value as "AVISTA" | "PRAZO")} disabled={fechado}>
                  <option value="AVISTA">À vista (Caixa)</option>
                  <option value="PRAZO">A prazo (Fornecedores)</option>
                </Select>
              </Campo>
              <Campo label="Fornecedor" className="sm:col-span-2">
                <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Distribuidora Central Ltda." disabled={fechado} />
              </Campo>
              <Campo label="Produto" obrigatorio className="sm:col-span-2">
                <Select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} disabled={fechado}>
                  {estado.produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.sku} — {produto.nome}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Quantidade" obrigatorio>
                <Input type="number" min={1} step={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} disabled={fechado} />
              </Campo>
              <Campo label="Custo unitário" obrigatorio>
                <CampoValor valorCents={custoCents} onChange={setCustoCents} disabled={fechado} />
              </Campo>
              <Campo label="Destino" obrigatorio className="sm:col-span-2">
                <Select value={destino} onChange={(e) => setDestino(e.target.value as "ESTOQUE" | "DESPESA")} disabled={fechado}>
                  <option value="ESTOQUE">Estoque (Ativo — 1.0.4)</option>
                  <option value="DESPESA">Despesa / Custo direto</option>
                </Select>
              </Campo>
              {destino === "DESPESA" ? (
                <Campo label="Conta de despesa" obrigatorio className="sm:col-span-2">
                  <Select value={contaDespesaId} onChange={(e) => setContaDespesaId(e.target.value)} disabled={fechado}>
                    {contasDespesa.map((conta) => (
                      <option key={conta.id} value={conta.id}>
                        {conta.codigo} — {conta.nome}
                      </option>
                    ))}
                  </Select>
                </Campo>
              ) : null}
              {condicao === "PRAZO" ? (
                <Campo label="Parcelas" hint="12 no circulante + excedente no longo prazo" className="sm:col-span-2">
                  <Select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} disabled={fechado}>
                    {Array.from({ length: 24 }, (_, indice) => indice + 1).map((numero) => (
                      <option key={numero} value={numero}>
                        {numero}x
                      </option>
                    ))}
                  </Select>
                </Campo>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Total da compra</span>
                <span className="font-semibold tabular-nums text-slate-900">{formatarMoeda(total)}</span>
              </div>
              {condicao === "PRAZO" ? (
                <>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500">Fornecedores (CP · {parcelasCp}x)</span>
                    <span className="font-semibold tabular-nums text-amber-600">{formatarMoeda(valorCp)}</span>
                  </div>
                  {parcelasLp > 0 ? (
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <span className="text-slate-500">Contas a Pagar (LP · {parcelasLp}x)</span>
                      <span className="font-semibold tabular-nums text-sky-600">{formatarMoeda(valorLp)}</span>
                    </div>
                  ) : null}
                  <p className="mt-2 text-[10px] text-slate-400">
                    Parcela aproximada de {formatarMoeda(Math.round(total / Math.max(1, parcelas)))}.
                  </p>
                </>
              ) : (
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className="text-slate-500">Saída do Caixa</span>
                  <span className="font-semibold tabular-nums text-rose-600">{formatarMoeda(total)}</span>
                </div>
              )}
            </div>

            {erro ? <Alerta tom="red" titulo="Compra não registrada">{erro}</Alerta> : null}
            {fechado ? <Alerta tom="red" titulo="Exercício fechado">Reabra o período para comprar.</Alerta> : null}

            <Botao onClick={registrar} disabled={fechado || total <= 0} icone={PackagePlus} className="w-full">
              Registrar compra
            </Botao>

            <div className="flex items-start gap-2 rounded-xl bg-indigo-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-indigo-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Partidas: D Estoque/Despesa · C Caixa (à vista) ou C Fornecedores + C Contas a Pagar LP (a prazo).
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Compras do período"
            descricao={`${compras.length} registro(s)`}
            acao={<Badge tom="amber">Regime de competência</Badge>}
          />
          {compras.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">Nenhuma compra registrada.</div>
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <Th>Documento</Th>
                  <Th>Data</Th>
                  <Th>Fornecedor</Th>
                  <Th>Parcelas</Th>
                  <Th alinhar="right">Total</Th>
                  <Th alinhar="center">Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-slate-50/70">
                    <Td className="font-mono text-[11px] text-slate-500">{compra.documento?.numero ?? compra.numero}</Td>
                    <Td className="whitespace-nowrap text-xs">{formatarData(compra.data)}</Td>
                    <Td className="max-w-[160px] truncate text-xs">{compra.documento?.parceiro ?? "—"}</Td>
                    <Td className="text-xs text-slate-500">
                      {compra.documento?.parcelas?.length ? (
                        <span>
                          {compra.documento.parcelas.length}x
                          <span className={cn("ml-1.5 rounded px-1 py-0.5 text-[10px] font-semibold", "bg-slate-100 text-slate-600")}>
                            {compra.documento.parcelas.filter((p) => p.tipo === "LP").length} LP
                          </span>
                        </span>
                      ) : (
                        "À vista"
                      )}
                    </Td>
                    <Td alinhar="right" className="font-semibold">{formatarMoeda(valorOperacao(compra))}</Td>
                    <Td alinhar="center"><BadgeStatus status={compra.status} /></Td>
                    <Td alinhar="right">
                      <Link href={`/diario/${compra.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        Ver
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}
          <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" /> Compras à vista reduzem o Caixa.
            </span>
            <span className="ml-4 inline-flex items-center gap-1.5">
              <ReceiptText className="h-3.5 w-3.5" /> Compras a prazo aumentam o Passivo.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
