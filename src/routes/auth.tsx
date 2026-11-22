import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { S } from '@/lib/imperio';
import { Crown, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [{ title: 'Acessar — Império dos Pastéis' }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) nav({ to: '/' });
  }, [session, authLoading, nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success('✅ Bem-vindo!');
        nav({ to: '/' });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password: senha,
          options: { data: { nome }, emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success('✅ Conta criada! Você já pode entrar.');
        setMode('login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao acessar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: S.bg }}>
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: S.accent, boxShadow: '0 0 32px var(--color-brand-accent-glow)' }}>
            <Crown size={32} color="#fff" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: S.main, fontFamily: 'var(--font-display)' }}>
            IMPÉRIO DOS PASTÉIS
          </h1>
          <p className="text-sm mt-1" style={{ color: S.muted }}>
            Sistema de gestão
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="flex gap-2 p-1 rounded-lg" style={{ background: S.cardH }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className="flex-1 py-2 px-4 rounded-md text-sm font-semibold transition"
                style={{ background: mode === m ? S.accent : 'transparent', color: mode === m ? '#fff' : S.sub }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: S.sub }}>NOME</label>
              <input className="input" required value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: S.sub }}>EMAIL</label>
            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@imperio.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: S.sub }}>SENHA</label>
            <input className="input" type="password" required minLength={6} value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'login' ? 'Entrar' : 'Criar conta')}
          </button>

          {mode === 'signup' && (
            <p className="text-xs text-center" style={{ color: S.muted }}>
              O primeiro usuário cadastrado vira <strong style={{ color: S.accent }}>admin</strong> automaticamente.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
