import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, RefreshCw, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RequireAuth } from '@/components/RequireAuth';
import { useAuth, type Cargo } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { S } from '@/lib/imperio';

export const Route = createFileRoute('/funcionarios')({
  head: () => ({ meta: [{ title: 'Equipe — Império dos Pastéis' }] }),
  component: FuncionariosPage,
});

type Usuario = { id: string; nome: string; email: string; cargo: Cargo; ativo: boolean; criado_em: string };
const CARGOS: Cargo[] = ['admin', 'caixa', 'garcom', 'producao'];

function FuncionariosPage() { return <RequireAuth><FuncionariosContent /></RequireAuth>; }

function FuncionariosContent() {
  const { perfil } = useAuth();
  const isAdmin = perfil?.cargo === 'admin';
  const [editing, setEditing] = useState<Usuario | null>(null);
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase.from('usuarios').select('id,nome,email,cargo,ativo,criado_em').order('nome');
      if (error) throw error;
      return (data ?? []) as Usuario[];
    },
  });
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><Users size={28} style={{ color: S.accent }} /><div><h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Equipe</h1><p className="text-sm" style={{ color: S.muted }}>Funcionários e permissões</p></div></div>
        <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Atualizar</button>
      </header>
      {isLoading ? <div className="skeleton h-96" /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{data.map(u => (
          <article key={u.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center font-bold" style={{ background: S.cardH, color: S.accent }}>{u.nome.charAt(0).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><h2 className="font-bold truncate" style={{ color: S.main }}>{u.nome}</h2><p className="text-xs truncate" style={{ color: S.muted }}>{u.email}</p></div>
              {isAdmin && <button className="btn-secondary !p-2" onClick={() => setEditing(u)} title="Editar"><Pencil size={16} /></button>}
            </div>
            <div className="mt-4 flex items-center justify-between"><span className="badge badge-preparo">{u.cargo}</span><span className={u.ativo ? 'badge badge-livre' : 'badge badge-inativa'}>{u.ativo ? 'Ativo' : 'Inativo'}</span></div>
          </article>
        ))}</div>
      )}
      {editing && <EditDialog user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditDialog({ user, onClose }: { user: Usuario; onClose: () => void }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(user.nome);
  const [cargo, setCargo] = useState<Cargo>(user.cargo);
  const [ativo, setAtivo] = useState(user.ativo);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('usuarios').update({ nome, cargo, ativo }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Funcionário atualizado'); qc.invalidateQueries({ queryKey: ['funcionarios'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4" style={{ color: S.main }}>Editar funcionário</h3>
        <div className="space-y-3">
          <Field label="Nome"><input className="input" value={nome} onChange={e => setNome(e.target.value)} /></Field>
          <Field label="E-mail"><input className="input opacity-60" value={user.email} readOnly /></Field>
          <Field label="Cargo">
            <select className="input" value={cargo} onChange={e => setCargo(e.target.value as Cargo)}>
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} /><span style={{ color: S.sub }}>Ativo</span></label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" size={16} />} Salvar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: S.muted }}>{label}</span>{children}</label>;
}
