import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { notFound, toErrorResponse } from "../lib/server/route-errors.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { opportunityIdParamsSchema } from "../lib/server/validation.server";
import { getRecoveryOpportunityDetail } from "../modules/recovery/recovery-opportunities.server";
import { authenticate } from "../shopify.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const store = await getStoreForSessionShop(session.shop);
    const { id } = opportunityIdParamsSchema.parse({ id: params.id });

    const opportunity = await getRecoveryOpportunityDetail(store.id, id);
    if (!opportunity) {
      throw notFound("Opportunity not found.");
    }

    return json(opportunity);
  } catch (error) {
    return toErrorResponse(error, "app.api.opportunities.$id.loader");
  }
}
