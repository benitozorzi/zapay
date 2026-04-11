import type { LinksFunction } from "@remix-run/node";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export default function App() {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Algo deu errado no Zapay";

  const message = isRouteErrorResponse(error)
    ? typeof error.data === "string"
      ? error.data
      : "Não foi possível concluir esta operação."
    : error instanceof Error
      ? error.message
      : "Erro inesperado.";

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            background: "#f6f6f7",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 680,
              background: "#fff",
              borderRadius: 16,
              padding: "2rem",
              boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>{title}</h1>
            <p>{message}</p>
          </section>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
