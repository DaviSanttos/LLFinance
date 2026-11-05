"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  PackagePlus,
  Plus,
  Warehouse,
} from "lucide-react";
import {
  Alerta,
  Badge,
  BarraProgresso,
  Botao,
  Campo,
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
import { calcularEstoque } from "@/lib/accounting";
import { CONTA } from "@/lib/mock-data";
import { useApp } from "@/lib/store";
import { cn, formatarData, formatarMoeda, formatarQuantidade, soma } from "@/lib/utils";

export default function EstoquePage() {
  const { estado, adicionarProduto, ajustarEstoque, notificar } = useApp();
  const [modalProduto, setModalProduto] = useState(false);
  const [modalAjuste, setModalAjuste] = useState(false);
  const [produtoAjuste, setProdutoAjuste] = useState("");
  const [direcao, setDirecao] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [quantidade, setQuantidade] = useState(1);
  const [custoCents, setCustoCents] = useState(0);
  const [observacao, setObservacao] = useState("");

  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [estoqueMinimo, setEstoqueMinimo] = useState(0);

  const calculado = useMemo(
    () => calcularEstoque(estado.produtos, estado.movimentosEstoque),
    [estado.produtos, estado.movimentosEstoque],
  );

  const totalValor = soma(calculado, (item) => item.valorTotalCents);
  const totalItens = soma(calculado, (item) => item.quantidade);
  const totalCMV = soma(calculado, (item) => item.cmvTotalCents);
  const contaEstoque = estado.contas.find((conta) => conta.id === CONTA.estoques);
  const saldoContabil = estado.operacoes
    .filter((op) => op.data >= estado.periodo.inicio && op.data <= estado.periodo.fim)
    .flatMap((op) => op.linhas)
    .filter((linha) => linha.contaId === CONTA.estoques)
    .reduce((total, linha) => total + (linha.tipo === "DEBITO" ? linha.valorCents : -linha.valorCents), 0);
  const reconciliado = totalValor === saldoContabil;

  const movimentosRecentes = [...estado.movimentosEstoque]
    .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id))
    .slice(0, 20);

  const produtoPorId = useMemo(
    () => new Map(estado.produtos.map((produto) => [produto.id, produto])),
    [estado.produtos],
  );

  function salvarProduto() {
    const resultado = adicionarProduto({ nome, sku, unidade, estoqueMinimo });
    if (resultado.ok) {
      notificar(`Produto ${resultado.data?.sku} cadastrado.`);
      setModalProduto(false);
      setNome("");
      setSku("");
      setUnidade("UN");
      setEstoqueMinimo(0);
    } else {
      notificar(resultado.erro ?? "Não foi possível cadastrar.", "erro");
    }
  }

  function abrirAjuste(produtoId: string, tipo: "ENTRADA" | "SAIDA") {
    setProdutoAjuste(produtoId);
    setDirecao(tipo);
    const item = calculado.find((linha) => linha.produto.id === produtoId);
    setCustoCents(item?.custoMedioCents ?? 0);
    setQuantidade(1);
    setObservacao("");
    setModalAjuste(true);
  }

  function salvarAjuste() {
    const resultado = ajustarEstoque({
      produtoId: produtoAjuste,
      direcao,
      quantidade,
      custoUnitarioCents: custoCents,
      observacao,
    });
    if (resultado.ok) {
      notificar("Ajuste de estoque registrado com contrapartida contábil.");
      setModalAjuste(false);
    } else {
      notificar(resultado.erro ?? "Não foi possível ajustar.", "erro");
    }
  }

  return (
    <div>
      <PageHeader
        etiqueta="Controle"
        titulo="Controle de Estoque"
        descricao="Custo médio ponderado, saldo físico e conciliação com a conta contábil 1.0.4 — Estoques."
        acoes={
          <Botao icone={Plus} onClick={() => setModalProduto(true)}>
            Novo produto
          </Botao>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Valor em estoque" valor={formatarMoeda(totalValor)} icone={Warehouse} tom="indigo" />
        <StatCard titulo="Itens disponíveis" valor={formatarQuantidade(totalItens)} icone={Boxes} tom="emerald" />
        <StatCard titulo="CMV acumulado" valor={formatarMoeda(totalCMV)} icone={ArrowUpFromLine} tom="rose" />
        <StatCard
          titulo="Saldo contábil"
          valor={formatarMoeda(saldoContabil)}
          hint={contaEstoque?.nome}
          icone={reconciliado ? CheckCircle2 : AlertTriangle}
          tom={reconciliado ? "emerald" : "amber"}
        />
      </div>

      <div className="mb-5">
        {reconciliado ? (
          <Alerta tom="green" titulo="Estoque conciliado com a contabilidade">
            O valor físico ({formatarMoeda(totalValor)}) é igual ao saldo da conta 1.0.4. Cada venda,
            compra e ajuste gera contrapartida contábil automaticamente.
          </Alerta>
        ) : (
          <Alerta tom="amber" titulo="Diferença entre físico e contábil">
            Físico {formatarMoeda(totalValor)} × contábil {formatarMoeda(saldoContabil)}. Registre um
            ajuste de estoque para alinhar as posições.
          </Alerta>
        )}
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader titulo="Posição por produto" descricao={`${calculado.length} produto(s) cadastrado(s)`} icone={Boxes} />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {calculado.map((item) => {
              const critico = item.quantidade < item.produto.estoqueMinimo;
              const maximo = Math.max(item.produto.estoqueMinimo * 3, item.quantidade, 1);
              return (
                <div key={item.produto.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.produto.nome}</p>
                        {critico ? <Badge tom="red">Abaixo do mínimo</Badge> : <Badge tom="green">OK</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {item.produto.sku} · {item.produto.unidade} · mínimo {item.produto.estoqueMinimo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold tabular-nums text-slate-900">{formatarMoeda(item.valorTotalCents)}</p>
                      <p className="text-[10px] text-slate-400">{formatarMoeda(item.custoMedioCents)} / un.</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{formatarQuantidade(item.quantidade)} {item.produto.unidade} em estoque</span>
                      <span>CMV {formatarMoeda(item.cmvTotalCents)}</span>
                    </div>
                    <div className="mt-1.5">
                      <BarraProgresso valor={item.quantidade} max={maximo} tom={critico ? "rose" : "emerald"} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="text-[10px] text-slate-400">
                      {item.ultimaMovimentacao ? `Última mov. ${formatarData(item.ultimaMovimentacao)}` : "Sem movimentação"}
                    </span>
                    <div className="flex gap-1.5">
                      <Botao variante="ghost" tamanho="sm" icone={ArrowDownToLine} onClick={() => abrirAjuste(item.produto.id, "ENTRADA")}>
                        Entrada
                      </Botao>
                      <Botao variante="ghost" tamanho="sm" icone={ArrowUpFromLine} onClick={() => abrirAjuste(item.produto.id, "SAIDA")}>
                        Saída
                      </Botao>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Movimentações recentes" descricao="Entradas, saídas e ajustes com rastreio da operação contábil." icone={PackagePlus} />
          <Tabela>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Produto</Th>
                <Th>Tipo</Th>
                <Th alinhar="right">Quantidade</Th>
                <Th alinhar="right">Custo unit.</Th>
                <Th>Operação</Th>
                <Th>Observação</Th>
              </tr>
            </thead>
            <tbody>
              {movimentosRecentes.map((mov) => {
                const produto = produtoPorId.get(mov.produtoId);
                return (
                  <tr key={mov.id} className="hover:bg-slate-50/70">
                    <Td className="whitespace-nowrap text-xs">{formatarData(mov.data)}</Td>
                    <Td className="text-xs font-medium">{produto?.nome ?? mov.produtoId}</Td>
                    <Td>
                      <Badge tom={mov.tipo === "ENTRADA" ? "green" : mov.tipo === "SAIDA" ? "red" : "amber"}>
                        {mov.tipo}
                      </Badge>
                    </Td>
                    <Td alinhar="right" className={cn("text-xs font-semibold", mov.quantidade < 0 ? "text-rose-600" : "text-emerald-600")}>
                      {mov.quantidade > 0 ? "+" : ""}{formatarQuantidade(mov.quantidade)}
                    </Td>
                    <Td alinhar="right" className="text-xs">{formatarMoeda(mov.custoUnitarioCents)}</Td>
                    <Td className="font-mono text-[10px] text-slate-500">{mov.operacaoId ?? "—"}</Td>
                    <Td className="max-w-[280px] truncate text-[11px] text-slate-500">{mov.observacao ?? "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        </Card>
      </div>

      <Modal
        aberto={modalProduto}
        onFechar={() => setModalProduto(false)}
        titulo="Novo produto"
        descricao="O produto passa a aceitar entradas, saídas e ajustes de estoque."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalProduto(false)}>Cancelar</Botao>
            <Botao icone={Plus} onClick={salvarProduto}>Cadastrar</Botao>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome" obrigatorio className="sm:col-span-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Camiseta personalizada" />
          </Campo>
          <Campo label="SKU" obrigatorio>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="CAM-003" />
          </Campo>
          <Campo label="Unidade">
            <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="UN" maxLength={4} />
          </Campo>
          <Campo label="Estoque mínimo" className="sm:col-span-2">
            <Input type="number" min={0} value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(Number(e.target.value))} />
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={modalAjuste}
        onFechar={() => setModalAjuste(false)}
        titulo={direcao === "ENTRADA" ? "Ajuste de entrada" : "Ajuste de saída"}
        descricao="Sobra ou falta de estoque gera uma operação contábil contra a conta CMV."
        rodape={
          <>
            <Botao variante="secondary" onClick={() => setModalAjuste(false)}>Cancelar</Botao>
            <Botao onClick={salvarAjuste} icone={direcao === "ENTRADA" ? ArrowDownToLine : ArrowUpFromLine}>
              Confirmar ajuste
            </Botao>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Produto" obrigatorio className="sm:col-span-2">
            <Select value={produtoAjuste} onChange={(e) => setProdutoAjuste(e.target.value)}>
              {estado.produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>{produto.nome}</option>
              ))}
            </Select>
          </Campo>
          <Campo label="Quantidade" obrigatorio>
            <Input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
          </Campo>
          <Campo label="Custo unitário" obrigatorio>
            <CampoValor valorCents={custoCents} onChange={setCustoCents} />
          </Campo>
          <Campo label="Observação" className="sm:col-span-2">
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: Divergência apurada no inventário de 31/10." />
          </Campo>
          <div className="sm:col-span-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
            Efeito contábil: {direcao === "ENTRADA" ? "D Estoques · C CMV" : "D CMV · C Estoques"} —{" "}
            <strong>{formatarMoeda(Math.round(quantidade * custoCents))}</strong>.
          </div>
        </div>
      </Modal>
    </div>
  );
}
