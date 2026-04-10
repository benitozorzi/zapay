import { buildShopifySearchQuery, type RecoverySyncQueryVariables } from "./recovery-shopify.queries.server";

export { buildShopifySearchQuery };
export type { RecoverySyncQueryVariables };

export const PAID_ORDERS_QUERY = `#graphql
  query ZapayPaidOrders($first: Int!, $after: String, $query: String) {
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
