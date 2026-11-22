import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, Clock, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { RequireAuth } from '@/components/RequireAuth';
import { supabase } from '@/integrations/supabase/client';
import { S, formatMesaName } from '@/lib/imperio';

export const Route = createFileRoute('/producao')({
  head: () => ({ meta: [{ title: 'Produção — Império dos Pastéis' }] }),
  component: ProducaoPage,
});

type Pedido = { id: string | null; numero: number | null; mesa_numero: number | null; mesa_numero_view: number | null; garcom_nome: string | null; status: string | null; criado_em: string | null; minutos_espera: number | null; itens: unknown };
type Item = { id?: string; nome_produto?: string; quantidade?: number; observacao?: string | null };

function ProducaoPage() {
  return (
    <RequireAuth>
      <ProducaoContent />
    </RequireAuth>
  );
}

function ProducaoContent() {
  const qc = useQueryClient();
  const { data: pedidos = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['pedidos-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('view_pedidos_producao_completo')
        .select('*')
        .in('status', ['novo', 'em_preparo', 'pronto'])
        .order('criado_em', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Pedido[];
    },
    refetchInterval: 15_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: { status: 'em_preparo' | 'pronto' | 'entregue'; preparo_em?: string; pronto_em?: string; entregue_em?: string } = { status: status as 'em_preparo' | 'pronto' | 'entregue' };
      if (status === 'em_preparo') patch.preparo_em = new Date().toISOString();
      if (status === 'pronto') patch.pronto_em = new Date().toISOString();
      if (status === 'entregue') patch.entregue_em = new Date().toISOString();
      const { error } = await supabase.from('pedidos_producao').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos-producao'] }),
    onError: (err) => toast.error(err.message),
  });

  const colunas = [
    { status: 'novo', titulo: 'Novos', acao: 'Preparar', prox: 'em_preparo' },
    { status: 'em_preparo', titulo: 'Em preparo', acao: 'Pronto', prox: 'pronto' },
    { status: 'pronto', titulo: 'Prontos', acao: 'Entregar', prox: 'entregue' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={28} style={{ color: S.accent }} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Produção</h1>
            <p className="text-sm" style={{ color: S.muted }}>Pedidos da cozinha em tempo real</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Atualizar</button>
      </header>

      {isLoading ? <div className="grid lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-80" />)}</div> : (
        <div className="grid lg:grid-cols-3 gap-4">
          {colunas.map(coluna => (
            <section key={coluna.status} className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: S.sub }}>{coluna.titulo}</h2>
              {pedidos.filter(p => p.status === coluna.status).map(pedido => (
                <PedidoCard key={pedido.id} pedido={pedido} actionLabel={coluna.acao} onAdvance={() => pedido.id && updateStatus.mutate({ id: pedido.id, status: coluna.prox })} loading={updateStatus.isPending} />
              ))}
              {pedidos.filter(p => p.status === coluna.status).length === 0 && <div className="card p-6 text-sm text-center" style={{ color: S.muted }}>Nenhum pedido</div>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function PedidoCard({ pedido, actionLabel, onAdvance, loading }: { pedido: Pedido; actionLabel: string; onAdvance: () => void; loading: boolean }) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens as Item[] : [];
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-bold" style={{ color: S.main }}>Pedido #{pedido.numero}</h3>
          <p className="text-xs" style={{ color: S.muted }}>{formatMesaName(pedido.mesa_numero_view ?? pedido.mesa_numero)}</p>
        </div>
        <span className="badge badge-aguardando"><Clock size={12} /> {Math.round(pedido.minutos_espera ?? 0)} min</span>
      </div>
      <div className="space-y-2 mb-4">
        {itens.map((item, idx) => (
          <div key={item.id ?? idx} className="rounded-md p-2" style={{ background: S.cardH }}>
            <div className="text-sm font-semibold" style={{ color: S.main }}>{item.quantidade ?? 1}x {item.nome_produto}</div>
            {item.observacao && <div className="text-xs mt-1" style={{ color: S.yellow }}>{item.observacao}</div>}
          </div>
        ))}
      </div>
      <button className="btn-primary w-full" onClick={onAdvance} disabled={loading}>{actionLabel}</button>
    </article>
  );
}