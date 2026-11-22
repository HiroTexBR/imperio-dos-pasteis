import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Grid3x3, Loader2, RefreshCw, ReceiptText, Search } from 'lucide-react';


import { RequireAuth } from '@/components/RequireAuth';
import { supabase } from '@/integrations/supabase/client';
import { S, formatCurrency, formatMesaName, getStatusMesaBadge, getStatusMesaLabel } from '@/lib/imperio';

export const Route = createFileRoute('/mesas/')({
  head: () => ({ meta: [{ title: 'Mesas — Império dos Pastéis' }] }),
  component: MesasPage,
});

type Mesa = { id: string; numero: number; descricao: string | null; capacidade: number; status: string; ativa: boolean };
type Comanda = { id: string; numero: number; mesa_id: string | null; cliente_nome: string | null; status: string; total: number; aberta_em: string };

function MesasPage() {
  return (
    <RequireAuth>
      <MesasContent />
    </RequireAuth>
  );
}

function MesasContent() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['mesas-operacao'],
    queryFn: async () => {
      const [mesasRes, comandasRes] = await Promise.all([
        supabase.from('mesas').select('id,numero,descricao,capacidade,status,ativa').eq('ativa', true).order('numero'),
        supabase.from('comandas').select('id,numero,mesa_id,cliente_nome,status,total,aberta_em').in('status', ['aberta', 'aguardando_pagamento']).order('aberta_em', { ascending: false }),
      ]);
      if (mesasRes.error) throw mesasRes.error;
      if (comandasRes.error) throw comandasRes.error;
      return { mesas: (mesasRes.data ?? []) as Mesa[], comandas: (comandasRes.data ?? []) as Comanda[] };
    },
    refetchInterval: 20_000,
  });

  const comandasPorMesa = new Map((data?.comandas ?? []).map(c => [c.mesa_id, c]));
  const mesas = data?.mesas ?? [];
  const grupos = [
    { titulo: 'Área externa', mesas: mesas.filter(m => m.numero >= 100 && m.numero < 200) },
    { titulo: 'Área interna', mesas: mesas.filter(m => m.numero >= 200 && m.numero < 300) },
    { titulo: 'Delivery', mesas: mesas.filter(m => m.numero >= 300 && m.numero < 400) },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Grid3x3 size={28} style={{ color: S.accent }} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Mesas</h1>
            <p className="text-sm" style={{ color: S.muted }}>Mapa operacional de mesas e comandas</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Atualizar
        </button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-36" />)}</div>
      ) : (
        <div className="space-y-8">
          {grupos.map(grupo => (
            <section key={grupo.titulo}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: S.sub }}>{grupo.titulo}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
                {grupo.mesas.map(mesa => {
                  const comanda = comandasPorMesa.get(mesa.id);
                  return <MesaCard key={mesa.id} mesa={mesa} comanda={comanda} />;
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MesaCard({ mesa, comanda }: { mesa: Mesa; comanda?: Comanda }) {
  const status = comanda?.status === 'aguardando_pagamento' ? 'aguardando_pagamento' : mesa.status;
  return (
    <Link to="/mesas/$id" params={{ id: mesa.id }} className="card p-4 min-h-36 flex flex-col justify-between transition hover:scale-[0.99] active:scale-95">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>{formatMesaName(mesa.numero)}</h3>
          <p className="text-xs mt-1" style={{ color: S.muted }}>{mesa.descricao ?? `${mesa.capacidade} lugares`}</p>
        </div>
        <span className={getStatusMesaBadge(status)}>{getStatusMesaLabel(status)}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        {comanda ? (
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: S.sub }}><ReceiptText size={14} /> #{comanda.numero}</div>
            <div className="mt-1 text-lg font-bold" style={{ color: S.accent }}>{formatCurrency(comanda.total)}</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm" style={{ color: S.muted }}><Search size={16} /> Abrir comanda</div>
        )}
      </div>
    </Link>
  );
}
