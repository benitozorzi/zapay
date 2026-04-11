import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import { parseRequestPayload } from "../lib/server/request-payload.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { getOrCreateStoreSettings, updateStoreSettings } from "../modules/recovery/recovery-settings.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const settings = await getOrCreateStoreSettings(store.id);

  return json(settings);
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const payload = await parseRequestPayload(request);
  const settings = await updateStoreSettings(store.id, payload);

  return json(settings);
}
