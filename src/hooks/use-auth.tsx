import { createContext, useContext, type ReactNode } from 'react';

export type Cargo = 'admin' | 'caixa' | 'garcom' | 'producao';
export interface Perfil { id: string; nome: string; email: string; cargo: Cargo; ativo: boolean; avatar_url: string | null; }

// MODO SEM LOGIN — usuário fake como dono/admin
const FAKE_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dono@imperio.local',
} as any;

const FAKE_PERFIL: Perfil = {
  id: '00000000-0000-0000-0000-000000000001',
  nome: 'Dono',
  email: 'dono@imperio.local',
  cargo: 'admin',
  ativo: true,
  avatar_url: null,
};

const FAKE_SESSION = { user: FAKE_USER, access_token: 'fake', refresh_token: 'fake', expires_in: 3600, token_type: 'bearer' } as any;

interface AuthCtx {
  session: any;
  user: any;
  perfil: Perfil | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: FAKE_SESSION,
  user: FAKE_USER,
  perfil: FAKE_PERFIL,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Ctx.Provider value={{ session: FAKE_SESSION, user: FAKE_USER, perfil: FAKE_PERFIL, loading: false, signOut: async () => {} }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }
