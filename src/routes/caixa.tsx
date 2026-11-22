import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Banknote, CreditCard, DollarSign, Loader2, Lock, LockOpen, QrCode, Receipt, RefreshCw, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';

import { RequireAuth } from '@/components/RequireAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { S, formatCurrency, formatMesaName } from '@/lib/imperio';

export const Route = createFileRoute('/caixa')({
  head: () => ({ meta: [{ title: 'Caixa — Império dos Pastéis' }] }),
  component: () => <RequireAuth><CaixaPage /></RequireAuth>,
});

type ComandaCaixa = {
  id: string; numero: number; mesa_id: string | null; cliente_nome: string | null;
  status: string; subtotal: number; total: number; aberta_em: string;
  mesas: { numero: number } | null;
};
type Caixa = {
  id: string; usuario_id: string | null; status: string; valor_inicial: number;
  total_dinheiro: number; total_pix: number; total_credito: number; total_debito: number;
  total_geral: number; aberto_em: string;
};
type Forma = 'dinheiro' | 'pix' | 'credito' | 'debito';

function CaixaPage() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const [valorInicial, setValorInicial] = useState('');
  const [comandaPag, setComandaPag] = useState<ComandaCaixa | null>(null);
  const [showFechar, setShowFechar] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['caixa-painel', perfil?.id],
    queryFn: async () => {
      const [caixaRes, comandasRes] = await Promise.all([
        supabase.from('caixas').select('*').eq('status', 'aberto').order('aberto_em', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('comandas').select('id,numero,mesa_id,cliente_nome,status,subtotal,total,aberta_em,mesas(numero)').in('status', ['aberta', 'aguardando_pagamento']).order('aberta_em', { ascending: false }),
      ]);
      if (caixaRes.error) throw caixaRes.error;
      if (comandasRes.error) throw comandasRes.error;
      return { caixa: (caixaRes.data as Caixa | null), comandas: (comandasRes.data ?? []) as unknown as ComandaCaixa[] };
    },
    refetchInterval: 15_000,
  });

  const abrirCaixa = useMutation({
    mutationFn: async () => {
      const v = Number(valorInicial.replace(',', '.')) || 0;
      const { error } = await supabase.from('caixas').insert({ usuario_id: perfil?.id ?? null, valor_inicial: v, status: 'aberto' });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Caixa aberto'); setValorInicial(''); qc.invalidateQueries({ queryKey: ['caixa-painel'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const fecharCaixa = useMutation({
    mutationFn: async () => {
      if (!data?.caixa) throw new Error('Sem caixa aberto');
      const total = Number(data.caixa.valor_inicial) + Number(data.caixa.total_geral);
      const { error } = await supabase.from('caixas')
        .update({ status: 'fechado', fechado_em: new Date().toISOString(), valor_final: total })
        .eq('id', data.caixa.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Caixa fechado'); setShowFechar(false); qc.invalidateQueries({ queryKey: ['caixa-painel'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const caixa = data?.caixa;
  const comandas = data?.comandas ?? [];
  const aguardando = comandas.filter(c => c.status === 'aguardando_pagamento');
  const abertas = comandas.filter(c => c.status === 'aberta');

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Wallet size={28} style={{ color: S.accent }} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Caixa</h1>
            <p className="text-sm" style={{ color: S.muted }}>{caixa ? `Aberto desde ${new Date(caixa.aberto_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Caixa fechado'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}</button>
          {caixa && <button className="btn-secondary" onClick={() => setShowFechar(true)}><Lock size={18} /> Fechar caixa</button>}
        </div>
      </header>

      {isLoading ? <div className="skeleton h-96" /> : !caixa ? (
        <div className="card p-8 max-w-md mx-auto text-center">
          <LockOpen size={36} style={{ color: S.accent }} className="mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2" style={{ color: S.main }}>Abrir caixa</h2>
          <p className="text-sm mb-5" style={{ color: S.muted }}>Informe o valor inicial em dinheiro disponível na gaveta.</p>
          <input className="input w-full text-center text-2xl font-bold mb-4" placeholder="R$ 0,00" value={valorInicial}
            onChange={e => setValorInicial(e.target.value.replace(/[^\d.,]/g, ''))} />
          <button className="btn-primary w-full" onClick={() => abrirCaixa.mutate()} disabled={abrirCaixa.isPending}>
            {abrirCaixa.isPending ? <Loader2 className="animate-spin" size={18} /> : <LockOpen size={18} />} Abrir caixa
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4 mb-6">
            <Kpi icon={<Banknote size={18} />} label="Dinheiro" value={formatCurrency(caixa.total_dinheiro)} />
            <Kpi icon={<QrCode size={18} />} label="Pix" value={formatCurrency(caixa.total_pix)} />
            <Kpi icon={<CreditCard size={18} />} label="Crédito" value={formatCurrency(caixa.total_credito)} />
            <Kpi icon={<CreditCard size={18} />} label="Débito" value={formatCurrency(caixa.total_debito)} />
            <Kpi icon={<DollarSign size={18} />} label="Total geral" value={formatCurrency(caixa.total_geral)} highlight />
          </div>

          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: S.yellow }}>
              <Receipt size={14} /> Aguardando pagamento ({aguardando.length})
            </h2>
            {aguardando.length === 0 ? (
              <div className="card p-6 text-sm text-center" style={{ color: S.muted }}>Nada para receber agora</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aguardando.map(c => (
                  <article key={c.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold" style={{ color: S.main }}>#{c.numero} · {formatMesaName(c.mesas?.numero)}</h3>
                        <p className="text-xs mt-1" style={{ color: S.muted }}>Aberta {new Date(c.aberta_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="badge badge-aguardando">Aguardando</span>
                    </div>
                    <div className="text-2xl font-bold mb-3" style={{ color: S.accent, fontFamily: 'var(--font-display)' }}>{formatCurrency(c.total)}</div>
                    <button className="btn-primary w-full" onClick={() => setComandaPag(c)}><DollarSign size={18} /> Receber pagamento</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: S.sub }}>Comandas abertas ({abertas.length})</h2>
            <div className="card overflow-hidden">
              {abertas.length === 0 && <div className="p-6 text-sm text-center" style={{ color: S.muted }}>Nenhuma comanda aberta</div>}
              {abertas.map(c => (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between divider">
                  <div>
                    <div className="font-bold text-sm" style={{ color: S.main }}>#{c.numero} · {formatMesaName(c.mesas?.numero)}</div>
                    <div className="text-xs" style={{ color: S.muted }}>{new Date(c.aberta_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="font-bold" style={{ color: S.accent }}>{formatCurrency(c.total)}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {comandaPag && caixa && (
        <PagamentoModal comanda={comandaPag} caixa={caixa} perfilId={perfil?.id ?? null}
          onClose={() => setComandaPag(null)}
          onSuccess={() => { setComandaPag(null); qc.invalidateQueries({ queryKey: ['caixa-painel'] }); qc.invalidateQueries({ queryKey: ['mesas-operacao'] }); }} />
      )}

      {showFechar && caixa && (
        <Modal title="Fechar caixa" onClose={() => setShowFechar(false)}>
          <div className="space-y-2 text-sm">
            <Linha label="Valor inicial" value={formatCurrency(caixa.valor_inicial)} />
            <Linha label="Dinheiro" value={formatCurrency(caixa.total_dinheiro)} />
            <Linha label="Pix" value={formatCurrency(caixa.total_pix)} />
            <Linha label="Crédito" value={formatCurrency(caixa.total_credito)} />
            <Linha label="Débito" value={formatCurrency(caixa.total_debito)} />
            <div className="flex justify-between pt-2 mt-2" style={{ borderTop: `1px solid ${S.border}` }}>
              <span className="font-bold" style={{ color: S.main }}>Total a conferir</span>
              <span className="text-xl font-bold" style={{ color: S.accent }}>{formatCurrency(Number(caixa.valor_inicial) + Number(caixa.total_geral))}</span>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setShowFechar(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => fecharCaixa.mutate()} disabled={fecharCaixa.isPending}>
              {fecharCaixa.isPending ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />} Confirmar fechamento
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PagamentoModal({ comanda, caixa, perfilId, onClose, onSuccess }: { comanda: ComandaCaixa; caixa: Caixa; perfilId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [forma, setForma] = useState<Forma>('dinheiro');
  const [recebido, setRecebido] = useState('');
  const total = Number(comanda.total);
  const recebidoNum = Number(recebido.replace(',', '.')) || 0;
  const troco = forma === 'dinheiro' && recebidoNum >= total ? recebidoNum - total : 0;

  const pagar = useMutation({
    mutationFn: async () => {
      const colMap: Record<Forma, string> = { dinheiro: 'total_dinheiro', pix: 'total_pix', credito: 'total_credito', debito: 'total_debito' };
      // 1. insere pagamento
      const { error: pErr } = await supabase.from('pagamentos').insert({
        comanda_id: comanda.id,
        caixa_id: caixa.id,
        usuario_id: perfilId,
        forma_pagamento: forma,
        valor: total,
        valor_recebido: forma === 'dinheiro' ? recebidoNum : total,
        troco,
      });
      if (pErr) throw pErr;
      // 2. atualiza totais do caixa
      const novoValor = Number((caixa as unknown as Record<string, number>)[colMap[forma]] || 0) + total;
      const novoGeral = Number(caixa.total_geral) + total;
      const patch: Record<string, number> = { total_geral: novoGeral };
      patch[colMap[forma]] = novoValor;
      const { error: cErr } = await supabase.from('caixas')
        .update(patch as never)
        .eq('id', caixa.id);
      if (cErr) throw cErr;

      // 3. fecha comanda
      const { error: cmdErr } = await supabase.from('comandas')
        .update({ status: 'fechada', fechada_em: new Date().toISOString(), caixa_id: caixa.id })
        .eq('id', comanda.id);
      if (cmdErr) throw cmdErr;
    },
    onSuccess: () => { toast.success('Pagamento registrado'); onSuccess(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const formas: { id: Forma; label: string; icon: ReactNode }[] = [
    { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={16} /> },
    { id: 'pix', label: 'Pix', icon: <QrCode size={16} /> },
    { id: 'credito', label: 'Crédito', icon: <CreditCard size={16} /> },
    { id: 'debito', label: 'Débito', icon: <CreditCard size={16} /> },
  ];

  return (
    <Modal title={`Pagamento · Comanda #${comanda.numero}`} onClose={onClose}>
      <div className="text-center mb-4 p-4 rounded-lg" style={{ background: S.cardH }}>
        <div className="text-xs uppercase tracking-wider font-bold" style={{ color: S.muted }}>Total a cobrar</div>
        <div className="text-3xl font-bold mt-1" style={{ color: S.accent, fontFamily: 'var(--font-display)' }}>{formatCurrency(total)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {formas.map(f => (
          <button key={f.id} onClick={() => setForma(f.id)}
            className="rounded-lg p-3 flex items-center justify-center gap-2 text-sm font-semibold transition"
            style={{ background: forma === f.id ? S.accent : S.card, color: forma === f.id ? '#fff' : S.sub, border: `1px solid ${forma === f.id ? S.accent : S.border}` }}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>
      {forma === 'dinheiro' && (
        <div className="mb-4">
          <label className="text-xs uppercase tracking-wider font-bold mb-1 block" style={{ color: S.muted }}>Valor recebido</label>
          <input className="input w-full text-lg" placeholder="R$ 0,00" value={recebido}
            onChange={e => setRecebido(e.target.value.replace(/[^\d.,]/g, ''))} />
          {troco > 0 && (
            <div className="mt-2 text-sm flex items-center justify-between">
              <span style={{ color: S.muted }}>Troco</span>
              <span className="font-bold" style={{ color: S.green }}>{formatCurrency(troco)}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => pagar.mutate()} disabled={pagar.isPending || (forma === 'dinheiro' && recebidoNum < total)}>
          {pagar.isPending ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />} Confirmar pagamento
        </button>
      </div>
    </Modal>
  );
}

function Kpi({ icon, label, value, highlight }: { icon: ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-1" style={{ color: highlight ? S.accent : S.muted }}>{icon}{label}</div>
      <div className="text-xl font-bold" style={{ color: highlight ? S.accent : S.main, fontFamily: 'var(--font-display)' }}>{value}</div>
    </div>
  );
}

function Linha({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span style={{ color: S.muted }}>{label}</span><span style={{ color: S.sub }}>{value}</span></div>;
}

function Modal({ children, title, onClose }: { children: ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="card p-5 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold" style={{ color: S.main }}>{title}</h3>
          <button onClick={onClose} style={{ color: S.muted }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
