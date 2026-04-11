import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { listRecoveryOpportunities } from "../modules/recovery/recovery-opportunities.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const url = new URL(request.url);

  const data = await listRecoveryOpportunities({
    storeId: store.id,
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    opportunityType: url.searchParams.get("opportunityType"),
    status: url.searchParams.get("status"),
  });

  return json(data);
}
