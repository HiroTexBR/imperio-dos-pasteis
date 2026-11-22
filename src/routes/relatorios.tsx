import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, DollarSign, Receipt, TrendingUp } from 'lucide-react';

import { RequireAuth } from '@/components/RequireAuth';
import { supabase } from '@/integrations/supabase/client';
import { S, formatCurrency } from '@/lib/imperio';

export const Route = createFileRoute('/relatorios')({
  head: () => ({ meta: [{ title: 'Relatórios — Império dos Pastéis' }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() { return <RequireAuth><RelatoriosContent /></RequireAuth>; }

function RelatoriosContent() {
  const { data: resumo } = useQuery({
    queryKey: ['relatorios-resumo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dashboard_resumo').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
  const cards = [
    { label: 'Vendas hoje', value: formatCurrency(resumo?.vendas_hoje ?? 0), icon: DollarSign },
    { label: 'Vendas no mês', value: formatCurrency(resumo?.vendas_mes ?? 0), icon: TrendingUp },
    { label: 'Comandas abertas', value: String(resumo?.comandas_abertas ?? 0), icon: Receipt },
    { label: 'Ticket médio', value: formatCurrency(resumo?.ticket_medio_hoje ?? 0), icon: BarChart3 },
  ];
  return <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in"><header className="mb-6 flex items-center gap-3"><BarChart3 size={28} style={{ color: S.accent }} /><div><h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>Relatórios</h1><p className="text-sm" style={{ color: S.muted }}>Indicadores da operação</p></div></header><div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(c => { const Icon = c.icon; return <div key={c.label} className="card p-5"><div className="flex items-center justify-between mb-4"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>{c.label}</span><Icon size={18} style={{ color: S.accent }} /></div><div className="text-2xl font-bold" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>{c.value}</div></div>; })}</div></div>;
}