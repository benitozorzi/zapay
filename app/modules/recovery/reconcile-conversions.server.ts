import { ConversionType, OpportunityStatus, Prisma } from "@prisma/client";

import prisma from "../../db.server";
import { fetchAdminConnectionPage } from "../../lib/server/shopify-graphql.server";
import {
  buildShopifySearchQuery,
  PAID_ORDERS_QUERY,
  type RecoverySyncQueryVariables,
} from "./shopify/reconciliation-shopify.queries.server";
import type { PaidOrdersQueryData, ShopifyMailingAddressSummary, ShopifyPaidOrderNode } from "./shopify/reconciliation-shopify.types";

const OPEN_RECONCILABLE_STATUSES = [
  OpportunityStatus.SENT_ONCE,
  OpportunityStatus.SENT_MULTIPLE,
  OpportunityStatus.ELIGIBLE,
] as const;

const EXACT_AMOUNT_EPSILON = 0.01;
const APPROXIMATE_AMOUNT_PERCENT = 0.05;
const MINIMUM_MATCH_SCORE = 60;

type ReconciliationCandidate = Awaited<ReturnType<typeof getOpenAttemptedOpportunitiesForStore>>[number];

type MatchResult = {
  score: number;
  matched: boolean;
  conversionType: ConversionType | null;
  reasons: string[];
};

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

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value == null) {
    return 0;
  }

  return typeof value === "number" ? value : value.toNumber();
}

function amountApproximatelyMatches(left: number, right: number): boolean {
  if (!left && !right) {
    return true;
  }

  const delta = Math.abs(left - right);
  const maxBase = Math.max(left, right, 1);

  return delta / maxBase <= APPROXIMATE_AMOUNT_PERCENT;
}

function resolveOrderIdentity(order: ShopifyPaidOrderNode) {
  const customerEmail = normalizeEmail(order.customer?.email ?? order.email ?? null);
  const customerPhoneNormalized = normalizePhone(
    order.customer?.phone ??
      order.phone ??
      order.billingAddress?.phone ??
      order.shippingAddress?.phone ??
      null,
  );

  return {
    customerEmail,
    customerPhoneNormalized,
    amount: Number(order.currentTotalPriceSet?.shopMoney.amount ?? 0),
  };
}

async function getOrCreateStoreSettings(storeId: string) {
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

function getAttributionWindowStart(attributionWindowHours: number) {
  const now = Date.now();
  return new Date(now - attributionWindowHours * 60 * 60 * 1000);
}

async function getOpenAttemptedOpportunitiesForStore(storeId: string, attributionWindowStart: Date) {
  return prisma.recoveryOpportunity.findMany({
    where: {
      storeId,
      status: {
        in: [...OPEN_RECONCILABLE_STATUSES],
      },
      convertedAt: null,
      lastAttemptAt: {
        not: null,
        gte: attributionWindowStart,
      },
    },
    orderBy: [
      { lastAttemptAt: "desc" },
      { createdAt: "desc" },
    ],
  });
}

async function fetchRecentPaidOrders(params: {
  admin: {
    graphql: (
      query: string,
      options?: {
        variables?: Record<string, unknown>;
      },
    ) => Promise<Response>;
  };
  first?: number;
  after?: string | null;
  updatedAtMin: Date;
}) {
  const variables: RecoverySyncQueryVariables = {
    first: params.first ?? 50,
    after: params.after ?? null,
    query: buildShopifySearchQuery({
      baseTerms: ["financial_status:paid"],
      updatedAtMin: params.updatedAtMin,
    }),
  };

  return fetchAdminConnectionPage<
    PaidOrdersQueryData,
    PaidOrdersQueryData["orders"]["nodes"][number],
    RecoverySyncQueryVariables
  >({
    admin: params.admin,
    query: PAID_ORDERS_QUERY,
    variables,
    selectConnection: (data) => data.orders,
  });
}

function scoreOpportunityMatch(params: {
  opportunity: ReconciliationCandidate;
  order: ShopifyPaidOrderNode;
}): MatchResult {
  const { opportunity, order } = params;
  const orderIdentity = resolveOrderIdentity(order);
  const opportunityValue = decimalToNumber(opportunity.cartValue);
  const reasons: string[] = [];

  if (opportunity.orderGid && opportunity.orderGid === order.id) {
    return {
      score: 100,
      matched: true,
      conversionType: ConversionType.ORDER_PAID,
      reasons: ["order_gid_exact"],
    };
  }

  let score = 0;

  if (
    opportunity.customerEmail &&
    orderIdentity.customerEmail &&
    opportunity.customerEmail === orderIdentity.customerEmail
  ) {
    score += 45;
    reasons.push("email_exact");
  }

  if (
    opportunity.customerPhoneNormalized &&
    orderIdentity.customerPhoneNormalized &&
    opportunity.customerPhoneNormalized === orderIdentity.customerPhoneNormalized
  ) {
    score += 45;
    reasons.push("phone_exact");
  }

  if (Math.abs(opportunityValue - orderIdentity.amount) <= EXACT_AMOUNT_EPSILON) {
    score += 10;
    reasons.push("amount_exact");
  } else if (amountApproximatelyMatches(opportunityValue, orderIdentity.amount)) {
    score += 5;
    reasons.push("amount_approximate");
  }

  return {
    score,
    matched: score >= MINIMUM_MATCH_SCORE,
    conversionType: score >= MINIMUM_MATCH_SCORE ? ConversionType.MANUAL_MATCH : null,
    reasons,
  };
}

export interface ReconcileConversionsForStoreResult {
  storeId: string;
  scannedPaidOrders: number;
  scannedOpenOpportunities: number;
  matchedCount: number;
  hasNextPage: boolean;
  lastCursor: string | null;
  reconciledOpportunityIds: string[];
}

export async function reconcileConversionsForStore(params: {
  admin: {
    graphql: (
      query: string,
      options?: {
        variables?: Record<string, unknown>;
      },
    ) => Promise<Response>;
  };
  storeId: string;
  first?: number;
  after?: string | null;
}) : Promise<ReconcileConversionsForStoreResult> {
  const settings = await getOrCreateStoreSettings(params.storeId);
  const attributionWindowStart = getAttributionWindowStart(settings.attributionWindowHours);

  const [openOpportunities, paidOrdersPage] = await Promise.all([
    getOpenAttemptedOpportunitiesForStore(params.storeId, attributionWindowStart),
    fetchRecentPaidOrders({
      admin: params.admin,
      first: params.first,
      after: params.after,
      updatedAtMin: attributionWindowStart,
    }),
  ]);

  const consumedOpportunityIds = new Set<string>();
  const reconciledOpportunityIds: string[] = [];

  for (const order of paidOrdersPage.connection.nodes) {
    let bestCandidate: { opportunity: ReconciliationCandidate; match: MatchResult } | null = null;

    for (const opportunity of openOpportunities) {
      if (consumedOpportunityIds.has(opportunity.id)) {
        continue;
      }

      const match = scoreOpportunityMatch({ opportunity, order });

      if (!match.matched) {
        continue;
      }

      if (!bestCandidate || match.score > bestCandidate.match.score) {
        bestCandidate = { opportunity, match };
      }
    }

    if (!bestCandidate) {
      continue;
    }

    consumedOpportunityIds.add(bestCandidate.opportunity.id);
    reconciledOpportunityIds.push(bestCandidate.opportunity.id);

    await prisma.recoveryOpportunity.update({
      where: {
        id: bestCandidate.opportunity.id,
      },
      data: {
        status: OpportunityStatus.CONVERTED,
        convertedAt: new Date(order.updatedAt),
        convertedOrderId: order.id,
        conversionType: bestCandidate.match.conversionType,
      },
    });
  }

  return {
    storeId: params.storeId,
    scannedPaidOrders: paidOrdersPage.connection.nodes.length,
    scannedOpenOpportunities: openOpportunities.length,
    matchedCount: reconciledOpportunityIds.length,
    hasNextPage: paidOrdersPage.connection.pageInfo.hasNextPage,
    lastCursor: paidOrdersPage.connection.pageInfo.endCursor ?? params.after ?? null,
    reconciledOpportunityIds,
  };
}
