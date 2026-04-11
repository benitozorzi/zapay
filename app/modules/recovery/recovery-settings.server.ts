import { DiscountType, Prisma } from "@prisma/client";

import prisma from "../../db.server";

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return undefined;
}

function parseInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
  }

  return undefined;
}

function parseDecimal(value: unknown): Prisma.Decimal | null | undefined {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Prisma.Decimal(value);
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? new Prisma.Decimal(parsed) : undefined;
  }

  return undefined;
}

function parseDiscountType(value: unknown): DiscountType | null | undefined {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === DiscountType.PERCENTAGE || normalized === DiscountType.FIXED_AMOUNT) {
    return normalized as DiscountType;
  }

  return undefined;
}

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

export async function updateStoreSettings(storeId: string, input: Record<string, unknown>) {
  const existing = await getOrCreateStoreSettings(storeId);

  const recoveryEnabled = parseBoolean(input.recoveryEnabled);
  const captureAbandoned = parseBoolean(input.captureAbandoned);
  const capturePendingOrders = parseBoolean(input.capturePendingOrders);
  const attributionWindowHours = parseInteger(input.attributionWindowHours);
  const discountEnabled = parseBoolean(input.discountEnabled);
  const discountType = parseDiscountType(input.discountType);
  const discountValue = parseDecimal(input.discountValue);

  const data: Prisma.StoreSettingsUpdateInput = {};

  if (recoveryEnabled !== undefined) data.recoveryEnabled = recoveryEnabled;
  if (captureAbandoned !== undefined) data.captureAbandoned = captureAbandoned;
  if (capturePendingOrders !== undefined) data.capturePendingOrders = capturePendingOrders;
  if (attributionWindowHours !== undefined) data.attributionWindowHours = Math.max(1, attributionWindowHours);
  if (discountEnabled !== undefined) data.discountEnabled = discountEnabled;
  if (discountType !== undefined) data.discountType = discountType;
  if (discountValue !== undefined) data.discountValue = discountValue;

  const shouldDisableDiscount = (discountEnabled === false) || (discountType === null);
  if (shouldDisableDiscount) {
    data.discountType = null;
    data.discountValue = null;
  }

  return prisma.storeSettings.update({
    where: { id: existing.id },
    data,
  });
}
