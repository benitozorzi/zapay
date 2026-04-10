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

export interface ShopifyPaidOrderNode {
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
}

export interface PaidOrdersQueryData {
  orders: {
    nodes: ShopifyPaidOrderNode[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
  };
}
