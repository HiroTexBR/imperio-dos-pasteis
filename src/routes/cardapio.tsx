import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { S, formatCurrency } from '@/lib/imperio';

export const Route = createFileRoute('/cardapio')({
  head: () => ({ meta: [{ title: 'Cardápio — Império dos Pastéis' }] }),
  component: CardapioPage,
});

type Categoria = { id: string; nome: string };
type Produto = {
  id: string; nome: string; descricao: string | null; preco_venda: number; preco_custo: number | null;
  ativo: boolean; enviar_para_producao: boolean; controlar_estoque: boolean;
  categoria_id: string | null; categorias: { nome: string } | null;
};

function CardapioPage() { return <RequireAuth><CardapioContent /></RequireAuth>; }

function CardapioContent() {
  const { perfil } = useAuth();
  const isAdmin = perfil?.cargo === 'admin';
  const [editing, setEditing] = useState<Produto | 'new' | null>(null);

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias').select('id,nome').order('nome');
      if (error) throw error;
      return (data ?? []) as Categoria[];
    },
  });

  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cardapio-produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos')
        .select('id,nome,descricao,preco_venda,preco_custo,ativo,enviar_para_producao,controlar_estoque,categoria_id,categorias(nome)')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as Produto[];
    },
  });

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><BookOpen size={28} style={{ color: S.accent }} /><div><h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Cardápio</h1><p className="text-sm" style={{ color: S.muted }}>Produtos cadastrados</p></div></div>
        <div className="flex gap-2">
          {isAdmin && <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> Novo produto</button>}
          <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Atualizar</button>
        </div>
      </header>
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-32" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{data.map(p => (
          <article key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h2 className="font-bold truncate" style={{ color: S.main }}>{p.nome}</h2><p className="text-xs mt-1" style={{ color: S.muted }}>{p.categorias?.nome ?? 'Sem categoria'}</p></div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={p.ativo ? 'badge badge-livre' : 'badge badge-inativa'}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                {isAdmin && <button className="btn-secondary !p-2" onClick={() => setEditing(p)} title="Editar"><Pencil size={14} /></button>}
              </div>
            </div>
            <p className="min-h-8 mt-3 text-sm line-clamp-2" style={{ color: S.sub }}>{p.descricao ?? 'Produto do cardápio'}</p>
            <div className="mt-4 flex items-center justify-between"><span className="text-xl font-bold" style={{ color: S.accent }}>{formatCurrency(p.preco_venda)}</span><span className="text-xs" style={{ color: S.muted }}>{p.enviar_para_producao ? 'Cozinha' : 'Balcão'}</span></div>
          </article>
        ))}</div>
      )}
      {editing && <ProdutoDialog produto={editing === 'new' ? null : editing} categorias={categorias} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ProdutoDialog({ produto, categorias, onClose }: { produto: Produto | null; categorias: Categoria[]; onClose: () => void }) {
  const qc = useQueryClient();
  const isNew = !produto;
  const [form, setForm] = useState({
    nome: produto?.nome ?? '',
    descricao: produto?.descricao ?? '',
    preco_venda: String(produto?.preco_venda ?? ''),
    preco_custo: String(produto?.preco_custo ?? ''),
    categoria_id: produto?.categoria_id ?? '',
    ativo: produto?.ativo ?? true,
    enviar_para_producao: produto?.enviar_para_producao ?? true,
    controlar_estoque: produto?.controlar_estoque ?? false,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco_venda: Number(form.preco_venda) || 0,
        preco_custo: form.preco_custo ? Number(form.preco_custo) : null,
        categoria_id: form.categoria_id || null,
        ativo: form.ativo,
        enviar_para_producao: form.enviar_para_producao,
        controlar_estoque: form.controlar_estoque,
      };
      if (!payload.nome) throw new Error('Nome é obrigatório');
      if (isNew) {
        const { error } = await supabase.from('produtos').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('produtos').update(payload).eq('id', produto!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(isNew ? 'Produto criado' : 'Produto atualizado'); qc.invalidateQueries({ queryKey: ['cardapio-produtos'] }); qc.invalidateQueries({ queryKey: ['estoque-produtos'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!produto) return;
      const { error } = await supabase.from('produtos').delete().eq('id', produto.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Produto removido'); qc.invalidateQueries({ queryKey: ['cardapio-produtos'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={onClose}>
      <div className="card p-6 w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4" style={{ color: S.main }}>{isNew ? 'Novo produto' : 'Editar produto'}</h3>
        <div className="space-y-3">
          <Field label="Nome"><input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} /></Field>
          <Field label="Descrição"><textarea className="input min-h-[72px]" value={form.descricao} onChange={e => set('descricao', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço de venda (R$)"><input type="number" step="0.01" className="input" value={form.preco_venda} onChange={e => set('preco_venda', e.target.value)} /></Field>
            <Field label="Custo (R$)"><input type="number" step="0.01" className="input" value={form.preco_custo} onChange={e => set('preco_custo', e.target.value)} /></Field>
          </div>
          <Field label="Categoria">
            <select className="input" value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}>
              <option value="">Sem categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-2 pt-2">
            <Check label="Ativo no cardápio" checked={form.ativo} onChange={v => set('ativo', v)} />
            <Check label="Enviar para cozinha (produção)" checked={form.enviar_para_producao} onChange={v => set('enviar_para_producao', v)} />
            <Check label="Controlar estoque" checked={form.controlar_estoque} onChange={v => set('controlar_estoque', v)} />
          </div>
        </div>
        <div className="mt-6 flex justify-between gap-2">
          <div>{!isNew && <button className="btn-secondary text-red-400" onClick={() => { if (confirm('Remover este produto?')) del.mutate(); }} disabled={del.isPending}><Trash2 size={16} /> Excluir</button>}</div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" size={16} />} Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: S.muted }}>{label}</span>{children}</label>;
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span style={{ color: S.sub }}>{label}</span></label>;
}
