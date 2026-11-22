import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { S, formatCurrency } from '@/lib/imperio';
import { Crown, TrendingUp, Receipt, Clock, DollarSign } from 'lucide-react';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Dashboard — Império dos Pastéis' }] }),
  component: Home,
});

function Home() {
  return <AppShell><DashboardContent /></AppShell>;
}

function DashboardContent() {
  const { data: resumo } = useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: async () => {
      const { data } = await supabase.from('dashboard_resumo' as any).select('*').maybeSingle();
      return data as any;
    },
    refetchInterval: 30_000,
  });

  const kpis = [
    { label: 'Vendas hoje', value: formatCurrency(resumo?.vendas_hoje ?? 0), icon: DollarSign, color: S.green },
    { label: 'Vendas no mês', value: formatCurrency(resumo?.vendas_mes ?? 0), icon: TrendingUp, color: S.accent },
    { label: 'Comandas abertas', value: String(resumo?.comandas_abertas ?? 0), icon: Receipt, color: S.blue },
    { label: 'Ticket médio', value: formatCurrency(resumo?.ticket_medio_hoje ?? 0), icon: Clock, color: S.yellow },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-6 lg:mb-8 flex items-center gap-3">
        <Crown size={28} style={{ color: S.accent }} />
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: S.muted }}>Visão geral da operação</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-4 lg:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: S.muted }}>{k.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${k.color}1f` }}>
                  <Icon size={16} style={{ color: k.color }} />
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>
                {k.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <p className="text-sm text-center" style={{ color: S.muted }}>
          Selecione uma seção no menu lateral para começar.
        </p>
      </div>
    </div>
  );
}
