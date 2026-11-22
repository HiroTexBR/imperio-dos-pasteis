// Atalhos para tokens do design system + helpers de formatação/status
export const S = {
  bg: 'var(--color-surface-bg)',
  card: 'var(--color-surface-card)',
  cardH: 'var(--color-surface-card-hover)',
  border: 'var(--color-surface-border)',
  borderL: 'var(--color-surface-border-light)',
  main: 'var(--color-text-main)',
  sub: 'var(--color-text-sub)',
  muted: 'var(--color-text-muted)',
  accent: 'var(--color-brand-accent)',
  accentHover: 'var(--color-brand-hover)',
  green: 'var(--color-status-free)',
  red: 'var(--color-status-busy)',
  yellow: 'var(--color-status-wait)',
  blue: 'var(--color-status-prep)',
  inactive: 'var(--color-status-inactive)',
} as const;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function formatMesaName(numero: number | string | undefined | null): string {
  const n = Number(numero);
  if (!Number.isFinite(n)) return 'Mesa --';
  if (n >= 100 && n < 200) return `Fora ${String(n - 100).padStart(2, '0')}`;
  if (n >= 200 && n < 300) return `Dentro ${String(n - 200).padStart(2, '0')}`;
  if (n >= 300 && n < 400) return `Delivery ${String(n - 300).padStart(2, '0')}`;
  return `Mesa ${n}`;
}

export function getStatusMesaLabel(s: string): string {
  return { livre: 'Livre', ocupada: 'Ocupada', aguardando_pagamento: 'Aguardando', em_preparo: 'Em preparo', inativa: 'Inativa' }[s] ?? s;
}
export function getStatusMesaBadge(s: string): string {
  return { livre: 'badge badge-livre', ocupada: 'badge badge-ocupada', aguardando_pagamento: 'badge badge-aguardando', em_preparo: 'badge badge-preparo', inativa: 'badge badge-inativa' }[s] ?? 'badge';
}

export const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',   icon: 'LayoutDashboard', cargos: ['admin'] as const },
  { href: '/mesas',        label: 'Mesas',       icon: 'Grid3x3',          cargos: ['admin','garcom','caixa'] as const },
  { href: '/producao',     label: 'Produção',    icon: 'ChefHat',          cargos: ['admin','producao','garcom'] as const },
  { href: '/caixa',        label: 'Caixa',       icon: 'Wallet',           cargos: ['admin','caixa','garcom'] as const },
  { href: '/cardapio',     label: 'Cardápio',    icon: 'BookOpen',         cargos: ['admin'] as const },
  { href: '/estoque',      label: 'Estoque',     icon: 'Package',          cargos: ['admin'] as const },
  { href: '/funcionarios', label: 'Equipe',      icon: 'Users',            cargos: ['admin'] as const },
  { href: '/relatorios',   label: 'Relatórios',  icon: 'BarChart3',        cargos: ['admin','caixa'] as const },
  { href: '/impressoras',  label: 'Impressoras', icon: 'Printer',          cargos: ['admin'] as const },
];
