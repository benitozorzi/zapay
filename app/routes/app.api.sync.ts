import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

import { parseRequestPayload } from "../lib/server/request-payload.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { reconcileConversionsForStore } from "../modules/recovery/reconcile-conversions.server";
import { runRecoverySyncForStore } from "../modules/recovery/run-recovery-sync.server";
import { authenticate } from "../shopify.server";

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  }

  return false;
}

function parseFirst(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.min(250, Math.trunc(value)));
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(250, Math.trunc(parsed)));
    }
  }

  return 50;
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const payload = await parseRequestPayload(request);
  const first = parseFirst(payload.first);
  const includeReconciliation = parseBoolean(payload.includeReconciliation);

  const syncResult = await runRecoverySyncForStore({
    admin,
    storeId: store.id,
    first,
  });

  const reconciliationResult = includeReconciliation
    ? await reconcileConversionsForStore({
        admin,
        storeId: store.id,
        first,
        after: null,
      })
    : null;

  return json({
    sync: syncResult,
    reconciliation: reconciliationResult,
  });
}
