export interface ShopifyMoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface ShopifyMoneyBag {
  shopMoney: ShopifyMoneyV2;
}

export interface ShopifyCustomerSummary {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ShopifyMailingAddressSummary {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface ShopifyAbandonedCheckoutNode {
  id: string;
  createdAt: string;
  updatedAt: string;
  abandonedCheckoutUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  customer?: ShopifyCustomerSummary | null;
  billingAddress?: ShopifyMailingAddressSummary | null;
  shippingAddress?: ShopifyMailingAddressSummary | null;
  totalPriceSet?: ShopifyMoneyBag | null;
}

export interface ShopifyPendingOrderNode {
  id: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  displayFinancialStatus?: string | null;
  email?: string | null;
  phone?: string | null;
  customer?: ShopifyCustomerSummary | null;
  billingAddress?: ShopifyMailingAddressSummary | null;
  shippingAddress?: ShopifyMailingAddressSummary | null;
  currentTotalPriceSet?: ShopifyMoneyBag | null;
  statusPageUrl?: string | null;
}

export interface AbandonedCheckoutsQueryData {
  abandonedCheckouts: {
    nodes: ShopifyAbandonedCheckoutNode[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
  };
}

export interface PendingPaymentOrdersQueryData {
  orders: {
    nodes: ShopifyPendingOrderNode[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
  };
}
