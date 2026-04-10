import prisma from "../../db.server";

function normalizeShopDomain(shopDomain: string): string {
  const normalized = shopDomain.trim().toLowerCase();

  if (!normalized) {
    throw new Error("Shop domain is required.");
  }

  return normalized;
}

export async function getOrCreateStoreByShopDomain(shopDomain: string) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);

  return prisma.store.upsert({
    where: {
      shopDomain: normalizedShopDomain,
    },
    update: {},
    create: {
      shopDomain: normalizedShopDomain,
    },
  });
}

export async function getStoreForSessionShop(sessionShop: string) {
  return getOrCreateStoreByShopDomain(sessionShop);
}
