import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

import { toErrorResponse } from "../lib/server/route-errors.server";
import { parseRequestPayload } from "../lib/server/request-payload.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { syncActionSchema } from "../lib/server/validation.server";
import { reconcileConversionsForStore } from "../modules/recovery/reconcile-conversions.server";
import { runRecoverySyncForStore } from "../modules/recovery/run-recovery-sync.server";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const store = await getStoreForSessionShop(session.shop);
    const payload = await parseRequestPayload(request);
    const input = syncActionSchema.parse(payload);

    const syncResult = await runRecoverySyncForStore({
      admin,
      storeId: store.id,
      first: input.first,
    });

    const reconciliationResult = input.includeReconciliation
      ? await reconcileConversionsForStore({
          admin,
          storeId: store.id,
          first: input.first,
          after: null,
        })
      : null;

    return json({
      sync: syncResult,
      reconciliation: reconciliationResult,
    });
  } catch (error) {
    return toErrorResponse(error, "app.api.sync.action");
  }
}
