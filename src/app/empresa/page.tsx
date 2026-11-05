"use client";

import { useEffect, useState } from "react";
import { Building2, Save, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Empresa } from "@/lib/types";
import { formatarCNPJ, formatarMoeda, hojeISO, parseMoeda } from "@/lib/utils";
import {
  Alerta,
  Badge,
  Botao,
  Campo,
  CampoData,
  CampoValor,
  Card,
  CardHeader,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";

const NATUREZAS = ["LTDA", "MEI", "EI", "S/A", "EIRELI", "ASSOCIAÇÃO"];
const REGIMES = ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"];

export default function EmpresaPage() {
  const { empresa, atualizarEmpresa, notificar } = useApp();
  const [form, setForm] = useState<Empresa>(empresa);
  const [capitalTexto, setCapitalTexto] = useState(
    (empresa.capitalSocialCents / 100).toFixed(2).replace(".", ","),
  );

  useEffect(() => {
    setForm(empresa);
    setCapitalTexto((empresa.capitalSocialCents / 100).toFixed(2).replace(".", ","));
  }, [empresa]);

  const alterado = JSON.stringify(form) !== JSON.stringify(empresa);

  function atualizar<K extends keyof Empresa>(campo: K, valor: Empresa[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function salvar() {
    const resultado = atualizarEmpresa({
      ...form,
      capitalSocialCents: parseMoeda(capitalTexto),
    });
    if (resultado.ok) {
      notificar("Dados da empresa atualizados.");
    } else {
      notificar(resultado.erro ?? "Não foi possível salvar.", "erro");
    }
  }

  return (
    <div>
      <PageHeader
        etiqueta="Cadastros"
        titulo="Empresa"
        descricao="Dados cadastrais, regime tributário e exercício contábil em uso."
        acoes={
          <>
            <Badge tom="indigo">{empresa.regime}</Badge>
            <Botao icone={Save} onClick={salvar} disabled={!alterado}>
              Salvar alterações
            </Botao>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              titulo="Identificação"
              descricao="Razão social, nome fantasia e CNPJ."
              icone={Building2}
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Campo label="Razão social" obrigatorio className="sm:col-span-2">
                <Input
                  value={form.razaoSocial}
                  onChange={(e) => atualizar("razaoSocial", e.target.value)}
                />
              </Campo>
              <Campo label="Nome fantasia" obrigatorio>
                <Input
                  value={form.nomeFantasia}
                  onChange={(e) => atualizar("nomeFantasia", e.target.value)}
                />
              </Campo>
              <Campo label="CNPJ" hint="14 dígitos com validadores conferidos">
                <Input
                  value={form.cnpj}
                  onChange={(e) => atualizar("cnpj", formatarCNPJ(e.target.value))}
                />
              </Campo>
              <Campo label="Natureza jurídica">
                <Select
                  value={form.natureza}
                  onChange={(e) => atualizar("natureza", e.target.value)}
                >
                  {NATUREZAS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Regime tributário">
                <Select value={form.regime} onChange={(e) => atualizar("regime", e.target.value)}>
                  {REGIMES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Capital social">
                <CampoValor
                  valorCents={parseMoeda(capitalTexto)}
                  onChange={(cents) =>
                    setCapitalTexto((cents / 100).toFixed(2).replace(".", ","))
                  }
                />
              </Campo>
              <Campo label="Data de abertura">
                <CampoData valor={form.abertura} onChange={(v) => atualizar("abertura", v)} />
              </Campo>
            </div>
          </Card>

          <Card>
            <CardHeader
              titulo="Endereço"
              descricao="Localização da sede para cabeçalhos de relatórios."
            />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Campo label="Endereço" className="sm:col-span-3">
                <Input
                  value={form.endereco}
                  onChange={(e) => atualizar("endereco", e.target.value)}
                />
              </Campo>
              <Campo label="Cidade">
                <Input value={form.cidade} onChange={(e) => atualizar("cidade", e.target.value)} />
              </Campo>
              <Campo label="UF">
                <Input
                  maxLength={2}
                  value={form.uf}
                  onChange={(e) => atualizar("uf", e.target.value.toUpperCase())}
                />
              </Campo>
            </div>
          </Card>

          <Card>
            <CardHeader
              titulo="Exercício contábil"
              descricao="Define a competência dos lançamentos e dos relatórios."
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Campo label="Início do exercício">
                <CampoData
                  valor={form.exercicioInicio}
                  onChange={(v) => atualizar("exercicioInicio", v)}
                />
              </Campo>
              <Campo label="Fim do exercício">
                <CampoData
                  valor={form.exercicioFim}
                  onChange={(v) => atualizar("exercicioFim", v)}
                />
              </Campo>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <Alerta tom="blue" titulo="Regime de competência">
                As receitas e despesas são reconhecidas no período em que ocorrem, independente do
                recebimento ou pagamento. O saldo inicial é lançado na conta Capital Social.
              </Alerta>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                {empresa.nomeFantasia.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {empresa.nomeFantasia}
                </p>
                <p className="text-[11px] text-slate-500">{empresa.nomeFantasia}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">CNPJ</dt>
                <dd className="font-medium text-slate-800">{empresa.cnpj}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Regime</dt>
                <dd className="font-medium text-slate-800">{empresa.regime}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Capital social</dt>
                <dd className="font-medium tabular-nums text-slate-800">
                  {formatarMoeda(empresa.capitalSocialCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Cidade / UF</dt>
                <dd className="font-medium text-slate-800">
                  {empresa.cidade} / {empresa.uf}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Exercício</dt>
                <dd className="font-medium text-slate-800">
                  {empresa.exercicioInicio.slice(0, 4)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Conformidade</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  A empresa opera com partida dobrada e regime de competência. Toda alteração
                  cadastral fica registrada na trilha de auditoria.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-[11px] text-slate-500">
              <p>
                <span className="font-semibold text-slate-700">Hoje:</span> {hojeISO()}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Contas:</span> plano padrão do
                professor + contas personalizadas
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
