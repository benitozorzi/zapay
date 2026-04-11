import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { getRecoveryOpportunityDetail } from "../modules/recovery/recovery-opportunities.server";
import { authenticate } from "../shopify.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const id = params.id;

  if (!id) {
    return json({ error: "Opportunity id is required." }, { status: 400 });
  }

  const opportunity = await getRecoveryOpportunityDetail(store.id, id);
  if (!opportunity) {
    return json({ error: "Opportunity not found." }, { status: 404 });
  }

  return json(opportunity);
}
