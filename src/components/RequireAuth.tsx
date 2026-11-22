import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

export function RequireAuth({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
