import { fetchAdminConnectionPage } from "../../lib/server/shopify-graphql.server";

import {
  buildShopifySearchQuery,
  PENDING_PAYMENT_ORDERS_QUERY,
  type RecoverySyncQueryVariables,
} from "./shopify/recovery-shopify.queries.server";
import type { PendingPaymentOrdersQueryData } from "./shopify/recovery-shopify.types";
import { mapPendingOrderToRecoveryOpportunity } from "./recovery-opportunity.mapper.server";
import { upsertRecoveryOpportunityFromShopify } from "./recovery-opportunity.repository.server";

interface SyncPendingOrdersParams {
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
  updatedAtMin?: Date | string | null;
}

export async function syncPendingOrders({
  admin,
  storeId,
  first = 50,
  after = null,
  updatedAtMin = null,
}: SyncPendingOrdersParams) {
  const variables: RecoverySyncQueryVariables = {
    first,
    after,
    query: buildShopifySearchQuery({
      baseTerms: ["financial_status:pending"],
      updatedAtMin,
    }),
  };

  const page = await fetchAdminConnectionPage<
    PendingPaymentOrdersQueryData,
    PendingPaymentOrdersQueryData["orders"]["nodes"][number],
    RecoverySyncQueryVariables
  >({
    admin,
    query: PENDING_PAYMENT_ORDERS_QUERY,
    variables,
    selectConnection: (data) => data.orders,
  });

  const persisted = [];

  for (const order of page.connection.nodes) {
    const mappedOpportunity = mapPendingOrderToRecoveryOpportunity(storeId, order);
    const opportunity = await upsertRecoveryOpportunityFromShopify(mappedOpportunity);
    persisted.push(opportunity);
  }

  return {
    opportunities: persisted,
    count: persisted.length,
    pageInfo: page.connection.pageInfo,
  };
}
