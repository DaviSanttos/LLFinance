"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, RotateCcw, Save, TriangleAlert, Wallet } from "lucide-react";
import {
  Alerta,
  Badge,
  Botao,
  CampoValor,
  Card,
  CardHeader,
  PageHeader,
  Select,
  StatCard,
  Tabela,
  Td,
  Th,
} from "@/components/ui";
import { calcularSaldos } from "@/lib/accounting";
import { CONTA } from "@/lib/mock-data";
import { useApp } from "@/lib/store";
import { formatarMoeda, tipoLabel } from "@/lib/utils";

interface LinhaEditavel {
  chave: string;
  contaId: string;
  debitoCents: number;
  creditoCents: number;
}

const TIPOS_PATRIMONIAIS = ["ATIVO", "PASSIVO", "PATRIMONIO_LIQUIDO"];

export default function SaldosIniciaisPage() {
  const { estado, salvarSaldosIniciais, notificar } = useApp();

  const contas = useMemo(
    () =>
      estado.contas
        .filter((conta) => conta.ativa && conta.analitica && TIPOS_PATRIMONIAIS.includes(conta.tipo))
        .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR")),
    [estado.contas],
  );

  const [linhas, setLinhas] = useState<LinhaEditavel[]>([]);
  const [inicializado, setInicializado] = useState(false);

  useEffect(() => {
    if (inicializado) return;
    const existentes = estado.saldosIniciais
      .filter((saldo) => saldo.debitoCents > 0 || saldo.creditoCents > 0)
      .map((saldo, indice) => ({
        chave: `saldo-${indice}-${saldo.contaId}`,
        contaId: saldo.contaId,
        debitoCents: saldo.debitoCents,
        creditoCents: saldo.creditoCents,
      }));
    setLinhas(existentes.length > 0 ? existentes : []);
    setInicializado(true);
  }, [estado.saldosIniciais, inicializado]);

  const totalDebitos = linhas.reduce((total, linha) => total + linha.debitoCents, 0);
  const totalCreditos = linhas.reduce((total, linha) => total + linha.creditoCents, 0);
  const diferenca = totalDebitos - totalCreditos;
  const fecha = totalDebitos === totalCreditos && totalDebitos > 0;

  const saldosAtuais = useMemo(
    () => calcularSaldos(estado.contas, estado.operacoes),
    [estado.contas, estado.operacoes],
  );

  const contaPorId = useMemo(
    () => new Map(estado.contas.map((conta) => [conta.id, conta])),
    [estado.contas],
  );

  function adicionarLinha(contaId?: string) {
    const usado = new Set(linhas.map((linha) => linha.contaId));
    const disponivel = contas.find((conta) => !usado.has(conta.id));
    const escolhida = contaId ?? disponivel?.id;
    if (!escolhida) {
      notificar("Todas as contas patrimoniais já foram adicionadas.", "aviso");
      return;
    }
    setLinhas((atuais) => [
      ...atuais,
      {
        chave: `nova-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        contaId: escolhida,
        debitoCents: 0,
        creditoCents: 0,
      },
    ]);
  }

  function atualizar(chave: string, campo: "contaId" | "debitoCents" | "creditoCents", valor: string | number) {
    setLinhas((atuais) =>
      atuais.map((linha) => {
        if (linha.chave !== chave) return linha;
        if (campo === "contaId") return { ...linha, contaId: String(valor) };
        if (campo === "debitoCents") {
          return { ...linha, debitoCents: Number(valor), creditoCents: Number(valor) > 0 ? 0 : linha.creditoCents };
        }
        return { ...linha, creditoCents: Number(valor), debitoCents: Number(valor) > 0 ? 0 : linha.debitoCents };
      }),
    );
  }

  function remover(chave: string) {
    setLinhas((atuais) => atuais.filter((linha) => linha.chave !== chave));
  }

  function salvar() {
    const resultado = salvarSaldosIniciais(
      linhas.map((linha) => ({
        contaId: linha.contaId,
        debitoCents: linha.debitoCents,
        creditoCents: linha.creditoCents,
      })),
    );
    if (resultado.ok) {
      notificar("Saldos iniciais salvos e lançados no Diário.");
    } else {
      notificar(resultado.erro ?? "Não foi possível salvar.", "erro");
    }
  }

  function restaurarPadrao() {
    setLinhas([
      {
        chave: "padrao-caixa",
        contaId: CONTA.caixa,
        debitoCents: 5_000_000,
        creditoCents: 0,
      },
      {
        chave: "padrao-capital",
        contaId: CONTA.capital,
        debitoCents: 0,
        creditoCents: 5_000_000,
      },
    ]);
  }

  const caixa = saldosAtuais.find((linha) => linha.conta.id === CONTA.caixa)?.saldoAtualCents ?? 0;

  return (
    <div>
      <PageHeader
        etiqueta="Cadastros"
        titulo="Saldos Iniciais"
        descricao="Transfira os saldos de abertura para o exercício. O sistema gera a operação contábil balanceada no Diário."
        acoes={
          <>
            <Botao variante="secondary" icone={RotateCcw} onClick={restaurarPadrao}>
              Restaurar padrão
            </Botao>
            <Botao icone={Save} onClick={salvar} disabled={!fecha}>
              Salvar saldos
            </Botao>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Total de débitos" valor={formatarMoeda(totalDebitos)} icone={Wallet} tom="indigo" />
        <StatCard titulo="Total de créditos" valor={formatarMoeda(totalCreditos)} icone={Wallet} tom="sky" />
        <StatCard
          titulo="Diferença"
          valor={formatarMoeda(diferenca)}
          hint={fecha ? "Contas conferidas" : "Ajuste até zerar"}
          icone={fecha ? CheckCircle2 : TriangleAlert}
          tom={fecha ? "emerald" : "rose"}
        />
        <StatCard titulo="Caixa atual" valor={formatarMoeda(caixa)} hint="Após lançamentos do período" icone={Wallet} tom="violet" />
      </div>

      <div className="mb-5">
        {fecha ? (
          <Alerta tom="green" titulo="Saldo inicial balanceado">
            Débitos e créditos totalizam {formatarMoeda(totalDebitos)}. Ao salvar, o saldo anterior é
            estornado (nunca excluído) e um novo lançamento de abertura é registrado.
          </Alerta>
        ) : (
          <Alerta tom="amber" titulo="O saldo inicial ainda não fecha">
            A diferença entre débitos e créditos é de {formatarMoeda(Math.abs(diferenca))}. O
            lançamento só é aceito quando os dois lados forem iguais.
          </Alerta>
        )}
      </div>

      <Card>
        <CardHeader
          titulo="Contas patrimoniais de abertura"
          descricao="Informe apenas contas analíticas de Ativo, Passivo e Patrimônio Líquido."
          acao={
            <Botao variante="secondary" tamanho="sm" icone={Plus} onClick={() => adicionarLinha()}>
              Adicionar conta
            </Botao>
          }
        />

        {linhas.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-slate-500">Nenhum saldo inicial informado.</p>
            <Botao variante="secondary" icone={Plus} onClick={() => adicionarLinha()} className="mt-3">
              Adicionar primeira conta
            </Botao>
          </div>
        ) : (
          <Tabela>
            <thead>
              <tr>
                <Th>Conta</Th>
                <Th alinhar="right">Débito</Th>
                <Th alinhar="right">Crédito</Th>
                <Th alinhar="right">Saldo atual</Th>
                <Th alinhar="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => {
                const conta = contaPorId.get(linha.contaId);
                const saldo = saldosAtuais.find((item) => item.conta.id === linha.contaId)?.saldoAtualCents ?? 0;
                return (
                  <tr key={linha.chave}>
                    <Td className="min-w-[240px]">
                      <Select
                        value={linha.contaId}
                        onChange={(e) => atualizar(linha.chave, "contaId", e.target.value)}
                      >
                        {contas.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.codigo} — {item.nome}
                          </option>
                        ))}
                      </Select>
                      {conta ? (
                        <span className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Badge tom="slate">{tipoLabel(conta.tipo)}</Badge>
                          naturezaLabel(conta.natureza)
                        </span>
                      ) : null}
                    </Td>
                    <Td alinhar="right" className="w-40">
                      <CampoValor
                        valorCents={linha.debitoCents}
                        onChange={(cents) => atualizar(linha.chave, "debitoCents", cents)}
                      />
                    </Td>
                    <Td alinhar="right" className="w-40">
                      <CampoValor
                        valorCents={linha.creditoCents}
                        onChange={(cents) => atualizar(linha.chave, "creditoCents", cents)}
                      />
                    </Td>
                    <Td alinhar="right" className="font-semibold">
                      {formatarMoeda(saldo)}
                    </Td>
                    <Td alinhar="right">
                      <Botao variante="ghost" tamanho="sm" onClick={() => remover(linha.chave)}>
                        Remover
                      </Botao>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80 font-semibold">
                <Td className="text-slate-700">Totais</Td>
                <Td alinhar="right" className="text-slate-900">
                  {formatarMoeda(totalDebitos)}
                </Td>
                <Td alinhar="right" className="text-slate-900">
                  {formatarMoeda(totalCreditos)}
                </Td>
                <Td alinhar="right">
                  {fecha ? <Badge tom="green">Balanceado</Badge> : <Badge tom="red">Diferença {formatarMoeda(diferenca)}</Badge>}
                </Td>
                <Td />
              </tr>
            </tfoot>
          </Tabela>
        )}
      </Card>
    </div>
  );
}

function naturezaLabel(natureza: string) {
  return natureza === "DEVEDORA" ? "Natureza devedora" : "Natureza credora";
}
