import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { sendRecoveryOpportunityViaWhatsApp } from "../modules/recovery/send-recovery-whatsapp.server";
import { authenticate } from "../shopify.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const id = params.id;

  if (!id) {
    return json({ error: "Opportunity id is required." }, { status: 400 });
  }

  try {
    const result = await sendRecoveryOpportunityViaWhatsApp({
      storeId: store.id,
      opportunityId: id,
    });

    return json(result);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to send recovery message." },
      { status: 400 },
    );
  }
}
