import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { toErrorResponse } from "../lib/server/route-errors.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { opportunitiesQuerySchema } from "../lib/server/validation.server";
import { listRecoveryOpportunities } from "../modules/recovery/recovery-opportunities.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const store = await getStoreForSessionShop(session.shop);
    const url = new URL(request.url);
    const query = opportunitiesQuerySchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      opportunityType: url.searchParams.get("opportunityType"),
      status: url.searchParams.get("status"),
    });

    const data = await listRecoveryOpportunities({
      storeId: store.id,
      page: String(query.page),
      limit: String(query.limit),
      opportunityType: query.opportunityType ?? null,
      status: query.status ?? null,
    });

    return json(data);
  } catch (error) {
    return toErrorResponse(error, "app.api.opportunities.loader");
  }
}
