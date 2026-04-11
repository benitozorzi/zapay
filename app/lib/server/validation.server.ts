import { DiscountType, OpportunityStatus, OpportunityType } from "@prisma/client";
import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function emptyStringToNull(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function booleanish(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return value;
}

function integerish(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }

  return value;
}

function numberish(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }

  return value;
}

export const opportunityIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const opportunitiesQuerySchema = z.object({
  page: z.preprocess(integerish, z.number().int().min(1).max(10000)).default(1),
  limit: z.preprocess(integerish, z.number().int().min(1).max(100)).default(20),
  opportunityType: z.preprocess(
    emptyStringToUndefined,
    z.nativeEnum(OpportunityType).optional(),
  ),
  status: z.preprocess(
    emptyStringToUndefined,
    z.nativeEnum(OpportunityStatus).optional(),
  ),
});

export const settingsUpdateSchema = z.object({
  recoveryEnabled: z.preprocess(booleanish, z.boolean().optional()),
  captureAbandoned: z.preprocess(booleanish, z.boolean().optional()),
  capturePendingOrders: z.preprocess(booleanish, z.boolean().optional()),
  attributionWindowHours: z.preprocess(integerish, z.number().int().min(1).max(24 * 30).optional()),
  discountEnabled: z.preprocess(booleanish, z.boolean().optional()),
  discountType: z.preprocess(
    emptyStringToNull,
    z.nativeEnum(DiscountType).nullable().optional(),
  ),
  discountValue: z.preprocess(
    emptyStringToNull,
    z.number().min(0).max(1000000).nullable().optional(),
  ),
}).transform((input) => ({
  ...input,
  discountValue: input.discountValue == null ? input.discountValue : numberish(input.discountValue),
})).pipe(
  z.object({
    recoveryEnabled: z.boolean().optional(),
    captureAbandoned: z.boolean().optional(),
    capturePendingOrders: z.boolean().optional(),
    attributionWindowHours: z.number().int().min(1).max(24 * 30).optional(),
    discountEnabled: z.boolean().optional(),
    discountType: z.nativeEnum(DiscountType).nullable().optional(),
    discountValue: z.preprocess(numberish, z.number().min(0).max(1000000).nullable().optional()),
  }),
);

export const syncActionSchema = z.object({
  first: z.preprocess(integerish, z.number().int().min(1).max(250)).default(50),
  includeReconciliation: z.preprocess(booleanish, z.boolean()).default(false),
});

export type OpportunitiesQueryInput = z.infer<typeof opportunitiesQuerySchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type SyncActionInput = z.infer<typeof syncActionSchema>;
