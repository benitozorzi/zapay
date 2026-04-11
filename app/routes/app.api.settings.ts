import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import { toErrorResponse } from "../lib/server/route-errors.server";
import { parseRequestPayload } from "../lib/server/request-payload.server";
import { getStoreForSessionShop } from "../lib/server/store.server";
import { settingsUpdateSchema } from "../lib/server/validation.server";
import { getOrCreateStoreSettings, updateStoreSettings } from "../modules/recovery/recovery-settings.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const store = await getStoreForSessionShop(session.shop);
    const settings = await getOrCreateStoreSettings(store.id);

    return json(settings);
  } catch (error) {
    return toErrorResponse(error, "app.api.settings.loader");
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const store = await getStoreForSessionShop(session.shop);
    const payload = await parseRequestPayload(request);
    const input = settingsUpdateSchema.parse(payload);
    const settings = await updateStoreSettings(store.id, input);

    return json(settings);
  } catch (error) {
    return toErrorResponse(error, "app.api.settings.action");
  }
}
