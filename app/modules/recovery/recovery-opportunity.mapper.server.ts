import { OpportunityStatus, OpportunityType, Prisma } from "@prisma/client";

import type {
  ShopifyAbandonedCheckoutNode,
  ShopifyMailingAddressSummary,
  ShopifyPendingOrderNode,
} from "./shopify/recovery-shopify.types";

function normalizeEmail(input?: string | null): string | null {
  const normalized = input?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function normalizePhone(input?: string | null): string | null {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const hasPlusPrefix = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D+/g, "");

  if (!digitsOnly) {
    return null;
  }

  return hasPlusPrefix ? `+${digitsOnly}` : digitsOnly;
}

function joinCustomerName(firstName?: string | null, lastName?: string | null): string | null {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function pickNameSources(address?: ShopifyMailingAddressSummary | null) {
  return {
    firstName: address?.firstName ?? null,
    lastName: address?.lastName ?? null,
  };
}

function resolveCustomerIdentity(params: {
  email?: string | null;
  phone?: string | null;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  billingAddress?: ShopifyMailingAddressSummary | null;
  shippingAddress?: ShopifyMailingAddressSummary | null;
}) {
  const billingName = pickNameSources(params.billingAddress);
  const shippingName = pickNameSources(params.shippingAddress);

  const firstName =
    params.customer?.firstName ??
    billingName.firstName ??
    shippingName.firstName ??
    null;

  const lastName =
    params.customer?.lastName ??
    billingName.lastName ??
    shippingName.lastName ??
    null;

  const customerName = joinCustomerName(firstName, lastName);
  const customerEmail = normalizeEmail(params.customer?.email ?? params.email ?? null);
  const customerPhoneNormalized = normalizePhone(
    params.customer?.phone ??
      params.phone ??
      params.billingAddress?.phone ??
      params.shippingAddress?.phone ??
      null,
  );

  return {
    customerFirstName: firstName,
    customerName,
    customerEmail,
    customerPhoneNormalized,
  };
}

function inferOpportunityStatus(params: {
  customerPhoneNormalized?: string | null;
  recoveryUrl?: string | null;
}): OpportunityStatus {
  return params.customerPhoneNormalized && params.recoveryUrl
    ? OpportunityStatus.ELIGIBLE
    : OpportunityStatus.CAPTURED;
}

export type RecoveryOpportunityMappedPayload = {
  storeId: string;
  opportunityType: OpportunityType;
  sourceShopifyId: string;
  create: Prisma.RecoveryOpportunityUncheckedCreateInput;
  update: Prisma.RecoveryOpportunityUncheckedUpdateInput;
};

export function mapAbandonedCheckoutToRecoveryOpportunity(
  storeId: string,
  checkout: ShopifyAbandonedCheckoutNode,
): RecoveryOpportunityMappedPayload {
  const identity = resolveCustomerIdentity({
    email: checkout.email,
    phone: checkout.phone,
    customer: checkout.customer,
    billingAddress: checkout.billingAddress,
    shippingAddress: checkout.shippingAddress,
  });

  const currency = checkout.totalPriceSet?.shopMoney.currencyCode ?? "BRL";
  const cartValue = checkout.totalPriceSet?.shopMoney.amount ?? "0";
  const recoveryUrl = checkout.abandonedCheckoutUrl ?? null;
  const status = inferOpportunityStatus({
    customerPhoneNormalized: identity.customerPhoneNormalized,
    recoveryUrl,
  });

  const baseData = {
    storeId,
    opportunityType: OpportunityType.ABANDONED_CHECKOUT,
    status,
    sourceShopifyId: checkout.id,
    orderGid: null,
    checkoutGid: checkout.id,
    orderName: null,
    customerName: identity.customerName,
    customerFirstName: identity.customerFirstName,
    customerEmail: identity.customerEmail,
    customerPhoneNormalized: identity.customerPhoneNormalized,
    currency,
    cartValue,
    recoveryUrl,
    checkoutUrl: recoveryUrl,
    discountCode: null,
    capturedAt: new Date(checkout.createdAt),
    lastAttemptAt: null,
    convertedAt: null,
    convertedOrderId: null,
    conversionType: null,
    expiresAt: null,
  } satisfies Prisma.RecoveryOpportunityUncheckedCreateInput;

  return {
    storeId,
    opportunityType: OpportunityType.ABANDONED_CHECKOUT,
    sourceShopifyId: checkout.id,
    create: baseData,
    update: {
      status,
      checkoutGid: checkout.id,
      customerName: identity.customerName,
      customerFirstName: identity.customerFirstName,
      customerEmail: identity.customerEmail,
      customerPhoneNormalized: identity.customerPhoneNormalized,
      currency,
      cartValue,
      recoveryUrl,
      checkoutUrl: recoveryUrl,
      capturedAt: new Date(checkout.createdAt),
      updatedAt: new Date(checkout.updatedAt),
    },
  };
}

export function mapPendingOrderToRecoveryOpportunity(
  storeId: string,
  order: ShopifyPendingOrderNode,
): RecoveryOpportunityMappedPayload {
  const identity = resolveCustomerIdentity({
    email: order.email,
    phone: order.phone,
    customer: order.customer,
    billingAddress: order.billingAddress,
    shippingAddress: order.shippingAddress,
  });

  const currency = order.currentTotalPriceSet?.shopMoney.currencyCode ?? "BRL";
  const cartValue = order.currentTotalPriceSet?.shopMoney.amount ?? "0";
  const recoveryUrl = order.statusPageUrl ?? null;
  const status = inferOpportunityStatus({
    customerPhoneNormalized: identity.customerPhoneNormalized,
    recoveryUrl,
  });

  const baseData = {
    storeId,
    opportunityType: OpportunityType.PENDING_PAYMENT_ORDER,
    status,
    sourceShopifyId: order.id,
    orderGid: order.id,
    checkoutGid: null,
    orderName: order.name ?? null,
    customerName: identity.customerName,
    customerFirstName: identity.customerFirstName,
    customerEmail: identity.customerEmail,
    customerPhoneNormalized: identity.customerPhoneNormalized,
    currency,
    cartValue,
    recoveryUrl,
    checkoutUrl: null,
    discountCode: null,
    capturedAt: new Date(order.createdAt),
    lastAttemptAt: null,
    convertedAt: null,
    convertedOrderId: null,
    conversionType: null,
    expiresAt: null,
  } satisfies Prisma.RecoveryOpportunityUncheckedCreateInput;

  return {
    storeId,
    opportunityType: OpportunityType.PENDING_PAYMENT_ORDER,
    sourceShopifyId: order.id,
    create: baseData,
    update: {
      status,
      orderGid: order.id,
      orderName: order.name ?? null,
      customerName: identity.customerName,
      customerFirstName: identity.customerFirstName,
      customerEmail: identity.customerEmail,
      customerPhoneNormalized: identity.customerPhoneNormalized,
      currency,
      cartValue,
      recoveryUrl,
      capturedAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
    },
  };
}
