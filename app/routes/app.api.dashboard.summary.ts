import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { toErrorResponse } from "../lib/server/route-errors.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { getDashboardSummary } from "../modules/recovery/dashboard-summary.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const store = await getStoreForSessionShop(session.shop);
    const summary = await getDashboardSummary(store.id);

    return json(summary);
  } catch (error) {
    return toErrorResponse(error, "app.api.dashboard.summary.loader");
  }
}
