import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution, shopifyApp } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";

import prisma from "./db.server";
import { getOrCreateStoreByShopDomain } from "./lib/server/store.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY ?? "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET ?? "",
  appUrl: process.env.SHOPIFY_APP_URL ?? "",
  scopes: process.env.SCOPES?.split(",").map((scope) => scope.trim()).filter(Boolean) ?? [],
  apiVersion: ApiVersion.April25,
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  hooks: {
    afterAuth: async ({ session }) => {
      await getOrCreateStoreByShopDomain(session.shop);
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;
export const registerWebhooks = shopify.registerWebhooks;
