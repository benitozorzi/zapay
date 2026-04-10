import { fetchAdminConnectionPage } from "../../lib/server/shopify-graphql.server";

import {
  ABANDONED_CHECKOUTS_QUERY,
  buildShopifySearchQuery,
  type RecoverySyncQueryVariables,
} from "./shopify/recovery-shopify.queries.server";
import type { AbandonedCheckoutsQueryData } from "./shopify/recovery-shopify.types";
import { mapAbandonedCheckoutToRecoveryOpportunity } from "./recovery-opportunity.mapper.server";
import { upsertRecoveryOpportunityFromShopify } from "./recovery-opportunity.repository.server";

interface SyncAbandonedCheckoutsParams {
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

export async function syncAbandonedCheckouts({
  admin,
  storeId,
  first = 50,
  after = null,
  updatedAtMin = null,
}: SyncAbandonedCheckoutsParams) {
  const variables: RecoverySyncQueryVariables = {
    first,
    after,
    query: buildShopifySearchQuery({ updatedAtMin }),
  };

  const page = await fetchAdminConnectionPage<
    AbandonedCheckoutsQueryData,
    AbandonedCheckoutsQueryData["abandonedCheckouts"]["nodes"][number],
    RecoverySyncQueryVariables
  >({
    admin,
    query: ABANDONED_CHECKOUTS_QUERY,
    variables,
    selectConnection: (data) => data.abandonedCheckouts,
  });

  const persisted = [];

  for (const checkout of page.connection.nodes) {
    const mappedOpportunity = mapAbandonedCheckoutToRecoveryOpportunity(storeId, checkout);
    const opportunity = await upsertRecoveryOpportunityFromShopify(mappedOpportunity);
    persisted.push(opportunity);
  }

  return {
    opportunities: persisted,
    count: persisted.length,
    pageInfo: page.connection.pageInfo,
  };
}
