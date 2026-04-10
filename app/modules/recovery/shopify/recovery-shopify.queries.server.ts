export interface RecoverySyncQueryVariables {
  first: number;
  after?: string | null;
  query?: string;
}

function formatShopifySearchDate(input: Date | string): string {
  return input instanceof Date ? input.toISOString() : new Date(input).toISOString();
}

export function buildShopifySearchQuery(params: {
  baseTerms?: string[];
  updatedAtMin?: Date | string | null;
}): string | undefined {
  const terms = [...(params.baseTerms ?? []).filter(Boolean)];

  if (params.updatedAtMin) {
    terms.push(`updated_at:>=${formatShopifySearchDate(params.updatedAtMin)}`);
  }

  return terms.length ? terms.join(" AND ") : undefined;
}

export const ABANDONED_CHECKOUTS_QUERY = `#graphql
  query ZapayAbandonedCheckouts($first: Int!, $after: String, $query: String) {
    abandonedCheckouts(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        createdAt
        updatedAt
        abandonedCheckoutUrl
        email
        phone
        customer {
          id
          firstName
          lastName
          email
          phone
        }
        billingAddress {
          firstName
          lastName
          phone
        }
        shippingAddress {
          firstName
          lastName
          phone
        }
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const PENDING_PAYMENT_ORDERS_QUERY = `#graphql
  query ZapayPendingPaymentOrders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        name
        createdAt
        updatedAt
        displayFinancialStatus
        email
        phone
        customer {
          id
          firstName
          lastName
          email
          phone
        }
        billingAddress {
          firstName
          lastName
          phone
        }
        shippingAddress {
          firstName
          lastName
          phone
        }
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        statusPageUrl
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
