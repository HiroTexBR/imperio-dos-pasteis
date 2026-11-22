import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { S } from '@/lib/imperio';

export const Route = createFileRoute('/estoque')({
  head: () => ({ meta: [{ title: 'Estoque — Império dos Pastéis' }] }),
  component: EstoquePage,
});

type ProdutoEstoque = { id: string; nome: string; estoque_atual: number | null; estoque_minimo: number | null; controlar_estoque: boolean; ativo: boolean };
type Insumo = { id: string; nome: string; unidade: string; quantidade_atual: number; quantidade_minima: number; preco_custo: number | null; fornecedor: string | null; ativo: boolean };

function EstoquePage() { return <RequireAuth><EstoqueContent /></RequireAuth>; }

function EstoqueContent() {
  const { perfil } = useAuth();
  const isAdmin = perfil?.cargo === 'admin';
  const [tab, setTab] = useState<'produtos' | 'insumos'>('produtos');
  const [editProduto, setEditProduto] = useState<ProdutoEstoque | null>(null);
  const [editInsumo, setEditInsumo] = useState<Insumo | 'new' | null>(null);

  const produtosQ = useQuery({
    queryKey: ['estoque-produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('id,nome,estoque_atual,estoque_minimo,controlar_estoque,ativo').eq('ativo', true).order('nome');
      if (error) throw error;
      return (data ?? []) as ProdutoEstoque[];
    },
  });
  const insumosQ = useQuery({
    queryKey: ['estoque-insumos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('insumos').select('id,nome,unidade,quantidade_atual,quantidade_minima,preco_custo,fornecedor,ativo').order('nome');
      if (error) throw error;
      return (data ?? []) as Insumo[];
    },
  });

  const produtos = produtosQ.data ?? [];
  const insumos = insumosQ.data ?? [];
  const controlados = produtos.filter(p => p.controlar_estoque);
  const baixos = controlados.filter(p => Number(p.estoque_atual ?? 0) <= Number(p.estoque_minimo ?? 0));
  const insumosBaixos = insumos.filter(i => i.ativo && Number(i.quantidade_atual) <= Number(i.quantidade_minima));

  const refetch = () => { produtosQ.refetch(); insumosQ.refetch(); };
  const isFetching = produtosQ.isFetching || insumosQ.isFetching;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><Package size={28} style={{ color: S.accent }} /><div><h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Estoque</h1><p className="text-sm" style={{ color: S.muted }}>Produtos e insumos</p></div></div>
        <div className="flex gap-2">
          {isAdmin && tab === 'insumos' && <button className="btn-primary" onClick={() => setEditInsumo('new')}><Plus size={18} /> Novo insumo</button>}
          <button className="btn-secondary" onClick={refetch} disabled={isFetching}>{isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Atualizar</button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Produtos" value={String(produtos.length)} />
        <Kpi label="Controlados" value={String(controlados.length)} />
        <Kpi label="Insumos" value={String(insumos.length)} />
        <Kpi label="Estoque baixo" value={String(baixos.length + insumosBaixos.length)} />
      </div>

      <div className="flex gap-2 mb-4">
        <TabBtn active={tab === 'produtos'} onClick={() => setTab('produtos')}>Produtos</TabBtn>
        <TabBtn active={tab === 'insumos'} onClick={() => setTab('insumos')}>Insumos</TabBtn>
      </div>

      {tab === 'produtos' ? (
        produtosQ.isLoading ? <div className="skeleton h-96" /> : (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider divider" style={{ color: S.muted }}>
              <div className="col-span-5">Produto</div><div className="col-span-2 text-right">Atual</div><div className="col-span-2 text-right">Mínimo</div><div className="col-span-2 text-right">Status</div><div className="col-span-1" />
            </div>
            {produtos.map(p => {
              const baixo = p.controlar_estoque && Number(p.estoque_atual ?? 0) <= Number(p.estoque_minimo ?? 0);
              return (
                <div key={p.id} className="grid grid-cols-12 gap-3 px-4 py-4 divider items-center">
                  <div className="col-span-5 font-semibold truncate" style={{ color: S.main }}>{p.nome}</div>
                  <div className="col-span-2 text-right" style={{ color: S.sub }}>{p.estoque_atual ?? 0}</div>
                  <div className="col-span-2 text-right" style={{ color: S.sub }}>{p.estoque_minimo ?? 0}</div>
                  <div className="col-span-2 text-right"><span className={baixo ? 'badge badge-ocupada' : 'badge badge-livre'}>{baixo ? 'Baixo' : 'OK'}</span></div>
                  <div className="col-span-1 text-right">{isAdmin && <button className="btn-secondary !p-2" onClick={() => setEditProduto(p)}><Pencil size={14} /></button>}</div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        insumosQ.isLoading ? <div className="skeleton h-96" /> : insumos.length === 0 ? (
          <div className="card p-8 text-center" style={{ color: S.muted }}>Nenhum insumo cadastrado.{isAdmin && ' Clique em "Novo insumo".'}</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider divider" style={{ color: S.muted }}>
              <div className="col-span-4">Insumo</div><div className="col-span-2">Unidade</div><div className="col-span-2 text-right">Atual</div><div className="col-span-2 text-right">Mínimo</div><div className="col-span-1 text-right">Status</div><div className="col-span-1" />
            </div>
            {insumos.map(i => {
              const baixo = i.ativo && Number(i.quantidade_atual) <= Number(i.quantidade_minima);
              return (
                <div key={i.id} className="grid grid-cols-12 gap-3 px-4 py-4 divider items-center">
                  <div className="col-span-4 font-semibold truncate" style={{ color: S.main }}>{i.nome}{!i.ativo && <span className="ml-2 badge badge-inativa">Inativo</span>}</div>
                  <div className="col-span-2" style={{ color: S.sub }}>{i.unidade}</div>
                  <div className="col-span-2 text-right" style={{ color: S.sub }}>{i.quantidade_atual}</div>
                  <div className="col-span-2 text-right" style={{ color: S.sub }}>{i.quantidade_minima}</div>
                  <div className="col-span-1 text-right"><span className={baixo ? 'badge badge-ocupada' : 'badge badge-livre'}>{baixo ? 'Baixo' : 'OK'}</span></div>
                  <div className="col-span-1 text-right">{isAdmin && <button className="btn-secondary !p-2" onClick={() => setEditInsumo(i)}><Pencil size={14} /></button>}</div>
                </div>
              );
            })}
          </div>
        )
      )}

      {editProduto && <ProdutoEstoqueDialog produto={editProduto} onClose={() => setEditProduto(null)} />}
      {editInsumo && <InsumoDialog insumo={editInsumo === 'new' ? null : editInsumo} onClose={() => setEditInsumo(null)} />}
    </div>
  );
}

function ProdutoEstoqueDialog({ produto, onClose }: { produto: ProdutoEstoque; onClose: () => void }) {
  const qc = useQueryClient();
  const [atual, setAtual] = useState(String(produto.estoque_atual ?? 0));
  const [minimo, setMinimo] = useState(String(produto.estoque_minimo ?? 0));
  const [controlar, setControlar] = useState(produto.controlar_estoque);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('produtos').update({
        estoque_atual: Number(atual) || 0,
        estoque_minimo: Number(minimo) || 0,
        controlar_estoque: controlar,
      }).eq('id', produto.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Estoque atualizado'); qc.invalidateQueries({ queryKey: ['estoque-produtos'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Modal onClose={onClose} title={produto.nome}>
      <div className="space-y-3">
        <Field label="Estoque atual"><input type="number" step="0.01" className="input" value={atual} onChange={e => setAtual(e.target.value)} /></Field>
        <Field label="Estoque mínimo"><input type="number" step="0.01" className="input" value={minimo} onChange={e => setMinimo(e.target.value)} /></Field>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={controlar} onChange={e => setControlar(e.target.checked)} /><span style={{ color: S.sub }}>Controlar estoque</span></label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" size={16} />} Salvar</button>
      </div>
    </Modal>
  );
}

function InsumoDialog({ insumo, onClose }: { insumo: Insumo | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isNew = !insumo;
  const [form, setForm] = useState({
    nome: insumo?.nome ?? '',
    unidade: insumo?.unidade ?? 'un',
    quantidade_atual: String(insumo?.quantidade_atual ?? 0),
    quantidade_minima: String(insumo?.quantidade_minima ?? 0),
    preco_custo: String(insumo?.preco_custo ?? ''),
    fornecedor: insumo?.fornecedor ?? '',
    ativo: insumo?.ativo ?? true,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome.trim(),
        unidade: form.unidade.trim() || 'un',
        quantidade_atual: Number(form.quantidade_atual) || 0,
        quantidade_minima: Number(form.quantidade_minima) || 0,
        preco_custo: form.preco_custo ? Number(form.preco_custo) : null,
        fornecedor: form.fornecedor.trim() || null,
        ativo: form.ativo,
      };
      if (!payload.nome) throw new Error('Nome é obrigatório');
      if (isNew) {
        const { error } = await supabase.from('insumos').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('insumos').update(payload).eq('id', insumo!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(isNew ? 'Insumo criado' : 'Insumo atualizado'); qc.invalidateQueries({ queryKey: ['estoque-insumos'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => {
      if (!insumo) return;
      const { error } = await supabase.from('insumos').delete().eq('id', insumo.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Insumo removido'); qc.invalidateQueries({ queryKey: ['estoque-insumos'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal onClose={onClose} title={isNew ? 'Novo insumo' : 'Editar insumo'}>
      <div className="space-y-3">
        <Field label="Nome"><input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Unidade"><input className="input" placeholder="kg, un, L..." value={form.unidade} onChange={e => set('unidade', e.target.value)} /></Field>
          <Field label="Atual"><input type="number" step="0.01" className="input" value={form.quantidade_atual} onChange={e => set('quantidade_atual', e.target.value)} /></Field>
          <Field label="Mínimo"><input type="number" step="0.01" className="input" value={form.quantidade_minima} onChange={e => set('quantidade_minima', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Custo (R$)"><input type="number" step="0.01" className="input" value={form.preco_custo} onChange={e => set('preco_custo', e.target.value)} /></Field>
          <Field label="Fornecedor"><input className="input" value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} /><span style={{ color: S.sub }}>Ativo</span></label>
      </div>
      <div className="mt-6 flex justify-between gap-2">
        <div>{!isNew && <button className="btn-secondary text-red-400" onClick={() => { if (confirm('Remover este insumo?')) del.mutate(); }} disabled={del.isPending}><Trash2 size={16} /> Excluir</button>}</div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" size={16} />} Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={onClose}>
      <div className="card p-6 w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4" style={{ color: S.main }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
function Kpi({ label, value }: { label: string; value: string }) { return <div className="card p-4"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>{label}</div><div className="mt-2 text-2xl font-bold" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>{value}</div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: S.muted }}>{label}</span>{children}</label>; }
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={active ? 'btn-primary' : 'btn-secondary'}>{children}</button>;
}
