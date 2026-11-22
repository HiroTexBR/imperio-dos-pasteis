import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/mesas')({
  head: () => ({ meta: [{ title: 'Mesas — Império dos Pastéis' }] }),
  component: () => <Outlet />,
});
