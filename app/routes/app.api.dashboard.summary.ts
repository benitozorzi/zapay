import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { getDashboardSummary } from "../modules/recovery/dashboard-summary.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const summary = await getDashboardSummary(store.id);

  return json(summary);
}
