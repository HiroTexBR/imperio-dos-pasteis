import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChefHat, Loader2, Minus, Plus, Receipt, RefreshCw, Search, Send, ShoppingBag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

import { RequireAuth } from '@/components/RequireAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { S, formatCurrency, formatMesaName } from '@/lib/imperio';

export const Route = createFileRoute('/mesas/$id')({
  head: () => ({ meta: [{ title: 'Comanda — Império dos Pastéis' }] }),
  component: () => (
    <RequireAuth>
      <ComandaPage />
    </RequireAuth>
  ),
});

type Mesa = { id: string; numero: number; capacidade: number; status: string };
type Comanda = {
  id: string; numero: number; mesa_id: string | null; status: string;
  subtotal: number; total: number; desconto_reais: number; desconto_percentual: number;
  taxa_servico: number; acrescimo: number; cliente_nome: string | null;
};
type ItemComanda = {
  id: string; nome_produto: string; quantidade: number; preco_unitario: number;
  total: number; observacao: string | null; status: string; enviado_para_producao: boolean;
};
type Categoria = { id: string; nome: string; icone: string | null; cor: string | null; ordem: number };
type Produto = {
  id: string; nome: string; preco_venda: number; categoria_id: string | null;
  ativo: boolean; enviar_para_producao: boolean; foto_url: string | null;
};
type Adicional = { id: string; nome: string; tipo: string; preco_extra: number };
type AdicConfig = { produto_id: string; aceita_adicionais: boolean; max_gratis: number; preco_por_extra: number; tipo_adicional: string };

function ComandaPage() {
  const { id: mesaId } = Route.useParams();
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [catSel, setCatSel] = useState<string | null>(null);
  const [showFechar, setShowFechar] = useState(false);
  const [prodModal, setProdModal] = useState<Produto | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['comanda-mesa', mesaId],
    queryFn: async () => {
      const [m, c, cats, prods, adics, cfgs] = await Promise.all([
        supabase.from('mesas').select('id,numero,capacidade,status').eq('id', mesaId).maybeSingle(),
        supabase.from('comandas').select('*').eq('mesa_id', mesaId).in('status', ['aberta', 'aguardando_pagamento']).order('aberta_em', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('categorias').select('id,nome,icone,cor,ordem').eq('ativo', true).order('ordem'),
        supabase.from('produtos').select('id,nome,preco_venda,categoria_id,ativo,enviar_para_producao,foto_url').eq('ativo', true).order('nome'),
        supabase.from('adicionais').select('id,nome,tipo,preco_extra').eq('ativo', true).order('ordem'),
        supabase.from('produto_adicionais_config').select('produto_id,aceita_adicionais,max_gratis,preco_por_extra,tipo_adicional'),
      ]);
      if (m.error) throw m.error;
      const mesa = m.data as Mesa | null;
      if (!mesa) throw new Error('Mesa não encontrada');
      const comanda = (c.data as Comanda | null);
      let itens: ItemComanda[] = [];
      if (comanda) {
        const { data: itensData, error: itensErr } = await supabase
          .from('comanda_itens')
          .select('id,nome_produto,quantidade,preco_unitario,total,observacao,status,enviado_para_producao')
          .eq('comanda_id', comanda.id)
          .order('criado_em');
        if (itensErr) throw itensErr;
        itens = (itensData ?? []) as ItemComanda[];
      }
      return {
        mesa,
        comanda,
        itens,
        categorias: (cats.data ?? []) as Categoria[],
        produtos: (prods.data ?? []) as Produto[],
        adicionais: (adics.data ?? []) as Adicional[],
        configs: (cfgs.data ?? []) as AdicConfig[],
      };
    },
    refetchInterval: 15_000,
  });

  const abrirComanda = useMutation({
    mutationFn: async () => {
      const { data: novo, error } = await supabase
        .from('comandas')
        .insert({ mesa_id: mesaId, status: 'aberta', garcom_id: perfil?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return novo as Comanda;
    },
    onSuccess: () => { toast.success('Comanda aberta'); qc.invalidateQueries({ queryKey: ['comanda-mesa', mesaId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addItem = useMutation({
    mutationFn: async ({ produto, qtd, obs, metade, adicSel, totalAdicionais, adicTexto }: {
      produto: Produto; qtd: number; obs?: string;
      metade?: Produto | null;
      adicSel?: { adicional: Adicional; preco: number }[];
      totalAdicionais?: number;
      adicTexto?: string;
    }) => {
      if (!data?.comanda) throw new Error('Sem comanda');
      const precoBase = metade ? Math.max(produto.preco_venda, metade.preco_venda) : produto.preco_venda;
      const nomeFinal = metade ? `Metadinha: ${produto.nome} / ${metade.nome}` : produto.nome;
      const subtotalProd = precoBase * qtd;
      const extras = totalAdicionais ?? 0;
      const { data: novo, error } = await supabase.from('comanda_itens').insert({
        comanda_id: data.comanda.id,
        produto_id: produto.id,
        nome_produto: nomeFinal,
        quantidade: qtd,
        preco_unitario: precoBase,
        total: subtotalProd,
        total_adicionais: extras * qtd,
        adicionais_texto: adicTexto ?? null,
        observacao: obs ?? null,
        status: 'pendente',
        enviado_para_producao: false,
        garcom_id: perfil?.id ?? null,
      }).select('id').single();
      if (error) throw error;
      if (adicSel && adicSel.length > 0) {
        const rows = adicSel.map(a => ({
          comanda_item_id: novo.id,
          adicional_id: a.adicional.id,
          nome_adicional: a.adicional.nome,
          preco_cobrado: a.preco,
        }));
        const { error: aErr } = await supabase.from('comanda_item_adicionais').insert(rows);
        if (aErr) throw aErr;
      }
    },
    onSuccess: () => { setProdModal(null); qc.invalidateQueries({ queryKey: ['comanda-mesa', mesaId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: async (item: ItemComanda) => {
      if (item.enviado_para_producao) {
        const { error } = await supabase.from('comanda_itens').update({ status: 'cancelado' }).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('comanda_itens').delete().eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success('Item removido'); qc.invalidateQueries({ queryKey: ['comanda-mesa', mesaId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const enviarProducao = useMutation({
    mutationFn: async () => {
      if (!data?.comanda) throw new Error('Sem comanda');
      const pendentes = data.itens.filter(i => !i.enviado_para_producao && i.status !== 'cancelado');
      if (pendentes.length === 0) throw new Error('Nada para enviar');
      const { data: pedido, error: pErr } = await supabase
        .from('pedidos_producao')
        .insert({
          comanda_id: data.comanda.id,
          mesa_id: data.mesa.id,
          mesa_numero: data.mesa.numero,
          garcom_id: perfil?.id ?? null,
          garcom_nome: perfil?.nome ?? null,
          status: 'novo',
        }).select().single();
      if (pErr) throw pErr;
      const itensPayload = pendentes.map(i => ({
        pedido_producao_id: pedido.id,
        comanda_item_id: i.id,
        nome_produto: i.nome_produto,
        quantidade: i.quantidade,
        observacao: i.observacao,
      }));
      const { error: piErr } = await supabase.from('pedido_itens').insert(itensPayload);
      if (piErr) throw piErr;
      const nowIso = new Date().toISOString();
      const { error: ciErr } = await supabase
        .from('comanda_itens')
        .update({ enviado_para_producao: true, status: 'enviado', enviado_em: nowIso })
        .in('id', pendentes.map(i => i.id));
      if (ciErr) throw ciErr;
    },
    onSuccess: () => { toast.success('Enviado para a produção'); qc.invalidateQueries({ queryKey: ['comanda-mesa', mesaId] }); qc.invalidateQueries({ queryKey: ['pedidos-producao'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const fecharComanda = useMutation({
    mutationFn: async () => {
      if (!data?.comanda) throw new Error('Sem comanda');
      const { error } = await supabase.from('comandas').update({ status: 'aguardando_pagamento' }).eq('id', data.comanda.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Comanda enviada ao caixa'); setShowFechar(false); navigate({ to: '/mesas' }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelarComanda = useMutation({
    mutationFn: async () => {
      if (!data?.comanda) throw new Error('Sem comanda');
      const { error } = await supabase.from('comandas').update({ status: 'cancelada', fechada_em: new Date().toISOString() }).eq('id', data.comanda.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Comanda cancelada'); navigate({ to: '/mesas' }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const produtosFiltrados = useMemo(() => {
    const lista = data?.produtos ?? [];
    return lista.filter(p =>
      (!catSel || p.categoria_id === catSel) &&
      (!busca || p.nome.toLowerCase().includes(busca.toLowerCase()))
    );
  }, [data?.produtos, catSel, busca]);

  if (isLoading) return <div className="p-8"><div className="skeleton h-64 max-w-5xl mx-auto" /></div>;
  if (!data) return <div className="p-8" style={{ color: S.muted }}>Mesa não encontrada</div>;

  const { mesa, comanda, itens } = data;
  const temPendentes = itens.some(i => !i.enviado_para_producao && i.status !== 'cancelado');
  const podeFechar = comanda && comanda.status === 'aberta' && itens.some(i => i.status !== 'cancelado');

  return (
    <div className="w-full min-w-0 overflow-x-hidden px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in pb-32">
      <header className="mb-6 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:flex lg:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/mesas" className="p-2 rounded-lg shrink-0" style={{ background: S.card, color: S.sub }}><ArrowLeft size={20} /></Link>
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>{formatMesaName(mesa.numero)}</h1>
            <p className="text-sm truncate" style={{ color: S.muted }}>{comanda ? `Comanda #${comanda.numero} · ${comanda.status === 'aguardando_pagamento' ? 'Aguardando pagamento' : 'Aberta'}` : 'Mesa livre — abra a comanda para começar'}</p>
          </div>
        </div>
        <button className="btn-secondary shrink-0 px-3 lg:px-5" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} <span className="hidden sm:inline">Atualizar</span></button>
      </header>

      {!comanda && (
        <div className="card p-8 text-center">
          <Receipt size={36} style={{ color: S.accent }} className="mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2" style={{ color: S.main }}>Mesa livre</h2>
          <p className="text-sm mb-5" style={{ color: S.muted }}>Abra uma nova comanda para registrar pedidos.</p>
          <button className="btn-primary" onClick={() => abrirComanda.mutate()} disabled={abrirComanda.isPending}>
            {abrirComanda.isPending ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Abrir comanda
          </button>
        </div>
      )}

      {comanda && (
        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] gap-6">
          {/* Produtos */}
          <section className="min-w-0">
            <div className="sticky top-0 z-10 pt-1 pb-2 lg:static lg:pt-0" style={{ background: S.bg }}>
              <div className="relative mb-3">
                <Search size={16} style={{ color: S.muted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input className="input pl-9 w-full h-11 text-base" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <div className="flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-none">
                <CatChip label="Todos" active={catSel === null} onClick={() => setCatSel(null)} />
                {data.categorias.map(c => (
                  <CatChip key={c.id} label={`${c.icone ?? ''} ${c.nome}`} active={catSel === c.id} onClick={() => setCatSel(c.id)} />
                ))}
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3">
              {produtosFiltrados.map(p => (
                <button key={p.id}
                  className="card w-full min-w-0 overflow-hidden p-3 text-left transition active:scale-95 flex flex-col gap-2"
                  disabled={comanda.status !== 'aberta' || addItem.isPending}
                  onClick={() => {
                    const hasCfg = data.configs.some(c => c.produto_id === p.id && c.aceita_adicionais);
                    if (hasCfg) setProdModal(p);
                    else addItem.mutate({ produto: p, qtd: 1 });
                  }}>

                  <div className="text-[13px] font-semibold leading-snug flex-1 break-words" style={{ color: S.main }}>{p.nome}</div>
                  <div className="flex min-w-0 items-end justify-between gap-1">
                    <span className="text-sm font-bold whitespace-nowrap" style={{ color: S.accent, fontFamily: 'var(--font-display)' }}>{formatCurrency(p.preco_venda)}</span>
                    <span className="grid place-items-center h-7 w-7 rounded-full shrink-0" style={{ background: S.accent, color: '#fff' }}><Plus size={14} strokeWidth={3} /></span>
                  </div>
                </button>
              ))}
              {produtosFiltrados.length === 0 && <div className="col-span-full text-sm p-6 text-center" style={{ color: S.muted }}>Nenhum produto</div>}
            </div>
          </section>

          {/* Resumo desktop */}
          <aside className="card p-4 self-start sticky top-4 hidden lg:block">
            <CartPanel
              comanda={comanda}
              itens={itens}
              onRemove={(i) => removeItem.mutate(i)}
              onEnviar={() => enviarProducao.mutate()}
              onFechar={() => setShowFechar(true)}
              onCancelar={() => { if (confirm('Cancelar comanda inteira?')) cancelarComanda.mutate(); }}
              temPendentes={temPendentes}
              podeFechar={!!podeFechar}
              enviando={enviarProducao.isPending}
            />
          </aside>
        </div>
      )}

      {/* Barra inferior mobile */}
      {comanda && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]" style={{ background: `linear-gradient(180deg, transparent, ${S.bg} 30%)` }}>
          <Drawer>
            <DrawerTrigger asChild>
              <button className="w-full rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg" style={{ background: S.accent, color: '#fff' }}>
                <span className="flex items-center gap-2 font-semibold">
                  <span className="grid place-items-center h-7 w-7 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <ShoppingBag size={16} />
                  </span>
                  {itens.filter(i => i.status !== 'cancelado').reduce((s, i) => s + i.quantidade, 0)} itens
                </span>
                <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{formatCurrency(comanda.total)}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent style={{ background: S.card, borderColor: S.border }}>
              <div className="px-4 pb-6 pt-2 max-h-[85vh] overflow-y-auto">
                <CartPanel
                  comanda={comanda}
                  itens={itens}
                  onRemove={(i) => removeItem.mutate(i)}
                  onEnviar={() => enviarProducao.mutate()}
                  onFechar={() => setShowFechar(true)}
                  onCancelar={() => { if (confirm('Cancelar comanda inteira?')) cancelarComanda.mutate(); }}
                  temPendentes={temPendentes}
                  podeFechar={!!podeFechar}
                  enviando={enviarProducao.isPending}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}


      {showFechar && comanda && (
        <Modal onClose={() => setShowFechar(false)} title="Enviar comanda ao caixa">
          <p className="text-sm" style={{ color: S.sub }}>Total a cobrar: <span className="font-bold" style={{ color: S.accent }}>{formatCurrency(comanda.total)}</span></p>
          <p className="text-xs mt-2" style={{ color: S.muted }}>A comanda ficará aguardando pagamento. O caixa registra o pagamento e libera a mesa.</p>
          <div className="mt-5 flex gap-2 justify-end">
            <button className="btn-secondary" onClick={() => setShowFechar(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => fecharComanda.mutate()} disabled={fecharComanda.isPending}>
              {fecharComanda.isPending ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />} Enviar ao caixa
            </button>
          </div>
        </Modal>
      )}

      {prodModal && data && (
        <ProdutoModal
          produto={prodModal}
          produtos={data.produtos}
          adicionais={data.adicionais}
          configs={data.configs}
          onClose={() => setProdModal(null)}
          onConfirm={(payload) => addItem.mutate({ produto: prodModal, ...payload })}
          submitting={addItem.isPending}
        />
      )}
    </div>
  );
}

function CatChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition shrink-0"
      style={{ background: active ? S.accent : S.card, color: active ? '#fff' : S.sub, border: `1px solid ${active ? S.accent : S.border}` }}>
      {label}
    </button>
  );
}

function CartPanel({ comanda, itens, onRemove, onEnviar, onFechar, onCancelar, temPendentes, podeFechar, enviando }: {
  comanda: Comanda; itens: ItemComanda[];
  onRemove: (i: ItemComanda) => void;
  onEnviar: () => void; onFechar: () => void; onCancelar: () => void;
  temPendentes: boolean; podeFechar: boolean; enviando: boolean;
}) {
  return (
    <>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: S.sub }}>Itens da comanda</h2>
      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
        {itens.length === 0 && <p className="text-sm" style={{ color: S.muted }}>Nenhum item ainda</p>}
        {itens.map(i => (
          <div key={i.id} className="rounded-md p-2 flex items-start gap-2" style={{ background: i.status === 'cancelado' ? 'rgba(248,113,113,0.08)' : S.cardH }}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: i.status === 'cancelado' ? S.muted : S.main, textDecoration: i.status === 'cancelado' ? 'line-through' : undefined }}>
                {i.quantidade}x {i.nome_produto}
              </div>
              <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: S.muted }}>
                <span>{formatCurrency(i.total)}</span>
                {i.enviado_para_producao && i.status !== 'cancelado' && <span className="badge badge-preparo" style={{ padding: '1px 6px', fontSize: 9 }}>{i.status}</span>}
              </div>
              {i.observacao && <div className="text-xs mt-1" style={{ color: S.yellow }}>{i.observacao}</div>}
            </div>
            {comanda.status === 'aberta' && i.status !== 'cancelado' && (
              <button onClick={() => onRemove(i)} className="p-2 rounded shrink-0" style={{ color: S.red }} title={i.enviado_para_producao ? 'Cancelar item' : 'Remover'}>
                {i.enviado_para_producao ? <X size={16} /> : <Trash2 size={16} />}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 space-y-1 text-sm" style={{ borderTop: `1px solid ${S.border}` }}>
        <Linha label="Subtotal" value={formatCurrency(comanda.subtotal)} />
        {Number(comanda.desconto_reais) > 0 && <Linha label="Desconto" value={'- ' + formatCurrency(comanda.desconto_reais)} />}
        {Number(comanda.taxa_servico) > 0 && <Linha label="Taxa serviço" value={formatCurrency(comanda.taxa_servico)} />}
        <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: `1px solid ${S.border}` }}>
          <span className="font-bold" style={{ color: S.main }}>Total</span>
          <span className="text-2xl font-bold" style={{ color: S.accent, fontFamily: 'var(--font-display)' }}>{formatCurrency(comanda.total)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {comanda.status === 'aberta' && (
          <>
            <button className="btn-primary w-full" onClick={onEnviar} disabled={!temPendentes || enviando}>
              {enviando ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Enviar p/ produção
            </button>
            <button className="btn-secondary w-full" onClick={onFechar} disabled={!podeFechar}>
              <Receipt size={18} /> Fechar conta
            </button>
            <button className="text-xs w-full mt-1 py-1" style={{ color: S.red }} onClick={onCancelar}>
              Cancelar comanda
            </button>
          </>
        )}
        {comanda.status === 'aguardando_pagamento' && (
          <div className="rounded-md p-3 text-sm text-center" style={{ background: 'rgba(251,191,36,0.1)', color: S.yellow }}>
            <ChefHat size={16} className="inline mr-1" /> Aguardando pagamento no caixa
          </div>
        )}
      </div>
    </>
  );
}


function Linha({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span style={{ color: S.muted }}>{label}</span><span style={{ color: S.sub }}>{value}</span></div>;
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
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

type ConfirmPayload = {
  qtd: number;
  obs?: string;
  metade?: Produto | null;
  adicSel: { adicional: Adicional; preco: number }[];
  totalAdicionais: number;
  adicTexto: string;
};

function ProdutoModal({ produto, produtos, adicionais, configs, onClose, onConfirm, submitting }: {
  produto: Produto;
  produtos: Produto[];
  adicionais: Adicional[];
  configs: AdicConfig[];
  onClose: () => void;
  onConfirm: (p: ConfirmPayload) => void;
  submitting: boolean;
}) {
  const cfg = configs.find(c => c.produto_id === produto.id);
  const maxGratis = cfg?.max_gratis ?? 2;
  const precoPorExtra = Number(cfg?.preco_por_extra ?? 1);

  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState('');
  const [metadinha, setMetadinha] = useState(false);
  const [metadeId, setMetadeId] = useState<string | null>(null);
  // ids of selected adicionais (multi)
  const [sel, setSel] = useState<string[]>([]);

  const metade = useMemo(() => produtos.find(p => p.id === metadeId) ?? null, [metadeId, produtos]);

  // Outros pastéis da mesma categoria (para metadinha)
  const opcoesMetade = useMemo(
    () => produtos.filter(p => p.id !== produto.id && p.categoria_id === produto.categoria_id),
    [produtos, produto]
  );

  useEffect(() => { if (!metadinha) setMetadeId(null); }, [metadinha]);

  const salgados = adicionais.filter(a => a.tipo === 'salgado');
  const doces = adicionais.filter(a => a.tipo === 'doce');
  const recheios = adicionais.filter(a => a.tipo === 'recheio_extra');

  const toggle = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Cálculo: salgados+doces compartilham o limite grátis; recheio_extra sempre cobra.
  const selObjs = sel.map(id => adicionais.find(a => a.id === id)).filter(Boolean) as Adicional[];
  const normais = selObjs.filter(a => a.tipo !== 'recheio_extra');
  const extrasRecheio = selObjs.filter(a => a.tipo === 'recheio_extra');
  const cobrar = Math.max(0, normais.length - maxGratis);
  const totalAdicionaisUnit =
    cobrar * precoPorExtra +
    extrasRecheio.reduce((s, a) => s + Number(a.preco_extra), 0);

  const precoBase = metadinha && metade ? Math.max(produto.preco_venda, metade.preco_venda) : produto.preco_venda;
  const totalLinha = (precoBase + totalAdicionaisUnit) * qtd;

  const handleConfirm = () => {
    if (metadinha && !metade) { toast.error('Escolha o outro sabor da metadinha'); return; }
    // adicSel com preço individual: 0 para os primeiros maxGratis "normais"
    const adicSel: { adicional: Adicional; preco: number }[] = [];
    let usados = 0;
    for (const a of selObjs) {
      if (a.tipo === 'recheio_extra') {
        adicSel.push({ adicional: a, preco: Number(a.preco_extra) });
      } else {
        const free = usados < maxGratis;
        usados++;
        adicSel.push({ adicional: a, preco: free ? 0 : precoPorExtra });
      }
    }
    const partes: string[] = [];
    if (normais.length) partes.push(normais.map(a => a.nome).join(', '));
    if (extrasRecheio.length) partes.push('+Recheio: ' + extrasRecheio.map(a => a.nome).join(', '));
    onConfirm({
      qtd,
      obs: obs.trim() || undefined,
      metade: metadinha ? metade : null,
      adicSel,
      totalAdicionais: totalAdicionaisUnit,
      adicTexto: partes.join(' | '),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="card w-full max-w-lg sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl max-h-[92vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 p-4 pb-2" style={{ borderBottom: `1px solid ${S.border}` }}>
          <div className="min-w-0">
            <h3 className="text-lg font-bold truncate" style={{ color: S.main }}>{produto.nome}</h3>
            <p className="text-xs" style={{ color: S.muted }}>{formatCurrency(produto.preco_venda)} · até {maxGratis} adicionais grátis · extras {formatCurrency(precoPorExtra)} · recheio extra R$ 3,00</p>
          </div>
          <button onClick={onClose} className="shrink-0 p-1" style={{ color: S.muted }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Metadinha */}
          {opcoesMetade.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: S.main }}>
                <input type="checkbox" checked={metadinha} onChange={e => setMetadinha(e.target.checked)} />
                Metadinha (meio a meio)
              </label>
              {metadinha && (
                <div className="mt-2">
                  <select className="input w-full h-10" value={metadeId ?? ''} onChange={e => setMetadeId(e.target.value || null)}>
                    <option value="">Escolha o outro sabor…</option>
                    {opcoesMetade.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} — {formatCurrency(p.preco_venda)}</option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: S.muted }}>Cobra o maior valor entre os dois sabores.</p>
                </div>
              )}
            </div>
          )}

          {/* Adicionais salgados */}
          {salgados.length > 0 && (
            <AdicGroup
              titulo={`Adicionais Salgados (até ${maxGratis} grátis)`}
              itens={salgados}
              sel={sel}
              onToggle={toggle}
              usadosNormais={normais.length}
              maxGratis={maxGratis}
              precoExtra={precoPorExtra}
            />
          )}

          {/* Adicionais doces */}
          {doces.length > 0 && (
            <AdicGroup
              titulo="Adicionais Doces"
              itens={doces}
              sel={sel}
              onToggle={toggle}
              usadosNormais={normais.length}
              maxGratis={maxGratis}
              precoExtra={precoPorExtra}
            />
          )}

          {/* Recheio extra */}
          {recheios.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: S.sub }}>Recheio Extra (+R$ 3,00 cada)</h4>
              <div className="grid grid-cols-2 gap-2">
                {recheios.map(a => {
                  const ativo = sel.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggle(a.id)}
                      className="rounded-lg px-3 py-2 text-left text-sm transition"
                      style={{
                        background: ativo ? S.accent : S.cardH,
                        color: ativo ? '#fff' : S.main,
                        border: `1px solid ${ativo ? S.accent : S.border}`,
                      }}>
                      <div className="font-semibold">{a.nome}</div>
                      <div className="text-xs opacity-80">+{formatCurrency(a.preco_extra)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observação */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: S.sub }}>Observação</h4>
            <textarea className="input w-full min-h-[60px]" placeholder="Ex: sem cebola, bem passado…" value={obs} onChange={e => setObs(e.target.value)} />
          </div>

          {/* Quantidade */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: S.main }}>Quantidade</span>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-full grid place-items-center" style={{ background: S.cardH, color: S.main }} onClick={() => setQtd(q => Math.max(1, q - 1))}><Minus size={16} /></button>
              <span className="w-8 text-center font-bold text-lg" style={{ color: S.main }}>{qtd}</span>
              <button className="h-9 w-9 rounded-full grid place-items-center" style={{ background: S.accent, color: '#fff' }} onClick={() => setQtd(q => q + 1)}><Plus size={16} /></button>
            </div>
          </div>
        </div>

        <div className="p-4 pt-3" style={{ borderTop: `1px solid ${S.border}` }}>
          <button className="btn-primary w-full" onClick={handleConfirm} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Adicionar · {formatCurrency(totalLinha)}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdicGroup({ titulo, itens, sel, onToggle, usadosNormais, maxGratis, precoExtra }: {
  titulo: string;
  itens: Adicional[];
  sel: string[];
  onToggle: (id: string) => void;
  usadosNormais: number;
  maxGratis: number;
  precoExtra: number;
}) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: S.sub }}>{titulo}</h4>
      <div className="grid grid-cols-2 gap-2">
        {itens.map(a => {
          const ativo = sel.includes(a.id);
          // Como saber se este está nas posições gratuitas é complexo; mostramos rótulo geral.
          const cobrado = ativo && usadosNormais > maxGratis;
          return (
            <button key={a.id} onClick={() => onToggle(a.id)}
              className="rounded-lg px-3 py-2 text-left text-sm transition"
              style={{
                background: ativo ? S.accent : S.cardH,
                color: ativo ? '#fff' : S.main,
                border: `1px solid ${ativo ? S.accent : S.border}`,
              }}>
              <div className="font-semibold">{a.nome}</div>
              <div className="text-xs opacity-80">{cobrado ? `+${formatCurrency(precoExtra)}` : 'Grátis até o limite'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
