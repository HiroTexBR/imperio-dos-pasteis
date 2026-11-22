import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--color-surface-bg)' }}>
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold" style={{ color: 'var(--color-brand-accent)' }}>404</h1>
        <p className="mt-4 text-lg" style={{ color: 'var(--color-text-sub)' }}>Página não encontrada</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Voltar ao início</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--color-surface-bg)' }}>
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>Algo deu errado</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary mt-6">Tentar novamente</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#F97316" },
      { title: "Império dos Pastéis" },
      { name: "description", content: "Sistema de gestão da pastelaria Império dos Pastéis." },
      { property: "og:title", content: "Império dos Pastéis" },
      { name: "twitter:title", content: "Império dos Pastéis" },
      { property: "og:description", content: "Sistema de gestão da pastelaria Império dos Pastéis." },
      { name: "twitter:description", content: "Sistema de gestão da pastelaria Império dos Pastéis." },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
