import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

import { toErrorResponse } from "../lib/server/route-errors.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { opportunityIdParamsSchema } from "../lib/server/validation.server";
import { sendRecoveryOpportunityViaWhatsApp } from "../modules/recovery/send-recovery-whatsapp.server";
import { authenticate } from "../shopify.server";

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const store = await getStoreForSessionShop(session.shop);
    const { id } = opportunityIdParamsSchema.parse({ id: params.id });

    const result = await sendRecoveryOpportunityViaWhatsApp({
      storeId: store.id,
      opportunityId: id,
    });

    return json(result);
  } catch (error) {
    return toErrorResponse(error, "app.api.opportunities.$id.send.action");
  }
}
