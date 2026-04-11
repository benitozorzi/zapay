import { Prisma } from "@prisma/client";

import prisma from "../../db.server";
import type { SettingsUpdateInput } from "../../lib/server/validation.server";

export async function getOrCreateStoreSettings(storeId: string) {
  const existing = await prisma.storeSettings.findUnique({
    where: { storeId },
  });

  if (existing) {
    return existing;
  }

  return prisma.storeSettings.create({
    data: { storeId },
  });
}

export async function updateStoreSettings(storeId: string, input: SettingsUpdateInput) {
  const existing = await getOrCreateStoreSettings(storeId);

  const data: Prisma.StoreSettingsUpdateInput = {};

  if (input.recoveryEnabled !== undefined) data.recoveryEnabled = input.recoveryEnabled;
  if (input.captureAbandoned !== undefined) data.captureAbandoned = input.captureAbandoned;
  if (input.capturePendingOrders !== undefined) data.capturePendingOrders = input.capturePendingOrders;
  if (input.attributionWindowHours !== undefined) data.attributionWindowHours = input.attributionWindowHours;
  if (input.discountEnabled !== undefined) data.discountEnabled = input.discountEnabled;
  if (input.discountType !== undefined) data.discountType = input.discountType;
  if (input.discountValue !== undefined) {
    data.discountValue = input.discountValue == null ? null : new Prisma.Decimal(input.discountValue);
  }

  const shouldDisableDiscount = input.discountEnabled === false || input.discountType === null;
  if (shouldDisableDiscount) {
    data.discountType = null;
    data.discountValue = null;
  }

  return prisma.storeSettings.update({
    where: { id: existing.id },
    data,
  });
}
