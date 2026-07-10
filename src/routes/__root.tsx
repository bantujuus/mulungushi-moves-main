import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";

function NotFoundComponent() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f5f6f8", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: "#0b1830" }}>404</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#0b1830", marginBottom: 8 }}>Page not found</div>
        <p style={{ color: "rgba(11,24,48,0.50)", marginBottom: 24 }}>The page you are looking for does not exist.</p>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", background: "#0b1830", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f5f6f8", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#0b1830", marginBottom: 8 }}>This page did not load</div>
        <p style={{ color: "rgba(11,24,48,0.50)", marginBottom: 24 }}>Something went wrong. Try refreshing or head back home.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => { router.invalidate(); reset(); }}
            style={{ padding: "10px 20px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
          <a href="/" style={{ padding: "10px 20px", background: "transparent", color: "#0b1830", border: "1px solid rgba(11,24,48,0.15)", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mulungushi Moves — Fleet & Gate Management" },
      { name: "description", content: "Digital Fleet and Gate Management System for Mulungushi University." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
      </AuthProvider>
    </QueryClientProvider>
  );
}