import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { AppProvider } from "@shopify/shopify-app-remix/react";

import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  return json({
    apiKey: process.env.SHOPIFY_API_KEY ?? "",
  });
}

export default function AppLayout() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider apiKey={apiKey} isEmbeddedApp>
      <NavMenu>
        <Link to="/app">Dashboard</Link>
        <Link to="/app/opportunities">Oportunidades</Link>
        <Link to="/app/settings">Configurações</Link>
      </NavMenu>

      <Outlet />
    </AppProvider>
  );
}
