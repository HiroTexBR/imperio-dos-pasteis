import { Link, useRouterState } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { Crown, LayoutDashboard, Grid3x3, ChefHat, Wallet, BookOpen, Package, Users, BarChart3, Printer, LogOut, Menu, X, Wifi } from 'lucide-react';
import { useAuth, type Cargo } from '@/hooks/use-auth';
import { S, NAV_ITEMS } from '@/lib/imperio';

const ICONS: Record<string, any> = { LayoutDashboard, Grid3x3, ChefHat, Wallet, BookOpen, Package, Users, BarChart3, Printer };

export function AppShell({ children }: { children: ReactNode }) {
  const { perfil, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: s => s.location.pathname });
  const cargo: Cargo = perfil?.cargo ?? 'garcom';
  const items = NAV_ITEMS.filter(i => (i.cargos as readonly string[]).includes(cargo));
  const bottomItems = items.slice(0, 5);

  const SidebarContent = (
    <>
      <div className="px-5 py-5 flex items-center gap-3 divider">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: S.accent }}>
          <Crown size={20} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold tracking-tight leading-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>IMPÉRIO</div>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: S.accent }}>{cargo}</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(it => {
          const Icon = ICONS[it.icon] ?? Grid3x3;
          const active = path === it.href || (it.href !== '/' && path.startsWith(it.href));
          return (
            <Link key={it.href} to={it.href as any} onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
              style={{
                background: active ? 'rgba(249,115,22,0.1)' : 'transparent',
                color: active ? S.accent : S.sub,
              }}>
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 divider" style={{ borderTop: `1px solid ${S.border}`, borderBottom: 'none' }}>
        <div className="flex items-center gap-2 px-3 py-2 mb-2 text-xs" style={{ color: S.muted }}>
          <Wifi size={14} style={{ color: S.green }} />
          Online
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: S.cardH, color: S.accent }}>
            {(perfil?.nome ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: S.main }}>{perfil?.nome ?? 'Usuário'}</div>
            <div className="text-[11px] truncate" style={{ color: S.muted }}>{perfil?.email}</div>
          </div>
          <button onClick={signOut} title="Sair" className="p-2 rounded-md transition" style={{ color: S.red }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: S.bg }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-[264px] flex-col fixed inset-y-0 left-0 z-30"
        style={{ background: S.card, borderRight: `1px solid ${S.border}` }}>
        {SidebarContent}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-[280px] z-50 flex flex-col animate-slide-up"
            style={{ background: S.card, borderRight: `1px solid ${S.border}` }}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-md" style={{ color: S.sub }}>
              <X size={20} />
            </button>
            {SidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 lg:pl-[264px] flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-20 h-14 flex items-center gap-3 px-4"
          style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-md" style={{ color: S.main }}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Crown size={18} style={{ color: S.accent }} />
            <span className="font-bold text-sm tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>IMPÉRIO</span>
          </div>
          <div className="status-dot status-dot-free" />
        </header>

        <main className="flex-1 w-full min-w-0 overflow-x-hidden pb-20 lg:pb-0">{children}</main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 safe-bottom px-2 pt-1.5"
          style={{ background: S.card, borderTop: `1px solid ${S.border}` }}>
          <div className="flex items-stretch justify-around">
            {bottomItems.map(it => {
              const Icon = ICONS[it.icon] ?? Grid3x3;
              const active = path === it.href || (it.href !== '/' && path.startsWith(it.href));
              return (
                <Link key={it.href} to={it.href as any}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition"
                  style={{ color: active ? S.accent : S.muted }}>
                  <Icon size={20} className={active ? 'scale-110' : ''} />
                  <span className="text-[10px] font-semibold">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
