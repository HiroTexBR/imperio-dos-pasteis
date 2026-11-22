import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Printer, RefreshCw } from 'lucide-react';

import { RequireAuth } from '@/components/RequireAuth';
import { supabase } from '@/integrations/supabase/client';
import { S } from '@/lib/imperio';

export const Route = createFileRoute('/impressoras')({
  head: () => ({ meta: [{ title: 'Impressoras — Império dos Pastéis' }] }),
  component: ImpressorasPage,
});

type Impressora = { id: string; nome: string; setor: string; tipo_conexao: string; endereco_ip: string | null; porta: number; largura_papel: string; ativa: boolean; status: string; modo_teste: boolean };

function ImpressorasPage() { return <RequireAuth><ImpressorasContent /></RequireAuth>; }

function ImpressorasContent() {
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['impressoras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('impressoras').select('id,nome,setor,tipo_conexao,endereco_ip,porta,largura_papel,ativa,status,modo_teste').order('nome');
      if (error) throw error;
      return (data ?? []) as Impressora[];
    },
  });
  return <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in"><header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><Printer size={28} style={{ color: S.accent }} /><div><h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Impressoras</h1><p className="text-sm" style={{ color: S.muted }}>Dispositivos de produção e caixa</p></div></div><button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Atualizar</button></header>{isLoading ? <div className="skeleton h-72" /> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{data.map(i => <article key={i.id} className="card p-4"><div className="flex items-start justify-between"><div><h2 className="font-bold" style={{ color: S.main }}>{i.nome}</h2><p className="text-xs mt-1" style={{ color: S.muted }}>{i.setor} • {i.largura_papel}</p></div><span className={i.status === 'online' ? 'badge badge-livre' : 'badge badge-inativa'}>{i.status}</span></div><div className="mt-4 text-sm" style={{ color: S.sub }}>{i.tipo_conexao.toUpperCase()} {i.endereco_ip ? `${i.endereco_ip}:${i.porta}` : 'sem endereço'}</div><div className="mt-3 text-xs" style={{ color: S.muted }}>{i.modo_teste ? 'Modo teste ativo' : 'Produção'}</div></article>)}{data.length === 0 && <div className="card p-8 text-center text-sm" style={{ color: S.muted }}>Nenhuma impressora cadastrada</div>}</div>}</div>;
}