export type ShopifyAdminGraphQLVariables = Record<string, unknown>;

export interface ShopifyAdminGraphQLClient {
  graphql: (
    query: string,
    options?: {
      variables?: ShopifyAdminGraphQLVariables;
    },
  ) => Promise<Response>;
}

export interface ShopifyGraphQLErrorShape {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface ShopifyGraphQLResponseEnvelope<TData> {
  data?: TData;
  errors?: ShopifyGraphQLErrorShape[];
  extensions?: Record<string, unknown>;
}

export interface ShopifyConnectionEdge<TNode> {
  cursor: string;
  node: TNode;
}

export interface ShopifyConnectionPageInfo {
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

export interface ShopifyConnection<TNode> {
  nodes?: TNode[];
  edges?: Array<ShopifyConnectionEdge<TNode>>;
  pageInfo: ShopifyConnectionPageInfo;
}

export interface NormalizedConnectionPage<TNode> {
  nodes: TNode[];
  edges: Array<ShopifyConnectionEdge<TNode>>;
  pageInfo: ShopifyConnectionPageInfo;
}

export class ShopifyAdminHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly responseBody?: string;

  constructor(params: { status: number; statusText: string; responseBody?: string }) {
    super(`Shopify Admin GraphQL HTTP error: ${params.status} ${params.statusText}`);
    this.name = "ShopifyAdminHttpError";
    this.status = params.status;
    this.statusText = params.statusText;
    this.responseBody = params.responseBody;
  }
}

export class ShopifyAdminGraphQLResponseError extends Error {
  public readonly graphQLErrors: ShopifyGraphQLErrorShape[];
  public readonly responseBody?: ShopifyGraphQLResponseEnvelope<unknown>;

  constructor(params: {
    message: string;
    graphQLErrors: ShopifyGraphQLErrorShape[];
    responseBody?: ShopifyGraphQLResponseEnvelope<unknown>;
  }) {
    super(params.message);
    this.name = "ShopifyAdminGraphQLResponseError";
    this.graphQLErrors = params.graphQLErrors;
    this.responseBody = params.responseBody;
  }
}

async function parseAdminGraphQLResponse<TData>(response: Response): Promise<ShopifyGraphQLResponseEnvelope<TData>> {
  const responseText = await response.text();

  if (!response.ok) {
    throw new ShopifyAdminHttpError({
      status: response.status,
      statusText: response.statusText,
      responseBody: responseText,
    });
  }

  if (!responseText) {
    return {};
  }

  return JSON.parse(responseText) as ShopifyGraphQLResponseEnvelope<TData>;
}

export async function executeAdminGraphQL<
  TData,
  TVariables extends ShopifyAdminGraphQLVariables = ShopifyAdminGraphQLVariables,
>(params: {
  admin: ShopifyAdminGraphQLClient;
  query: string;
  variables?: TVariables;
}): Promise<{ data: TData; extensions?: Record<string, unknown> }> {
  const response = await params.admin.graphql(params.query, {
    variables: params.variables,
  });

  const envelope = await parseAdminGraphQLResponse<TData>(response);

  if (envelope.errors?.length) {
    throw new ShopifyAdminGraphQLResponseError({
      message: envelope.errors.map((error) => error.message).join(" | "),
      graphQLErrors: envelope.errors,
      responseBody: envelope as ShopifyGraphQLResponseEnvelope<unknown>,
    });
  }

  if (!envelope.data) {
    throw new ShopifyAdminGraphQLResponseError({
      message: "Shopify Admin GraphQL response did not include data.",
      graphQLErrors: [{ message: "Response did not include data." }],
      responseBody: envelope as ShopifyGraphQLResponseEnvelope<unknown>,
    });
  }

  return {
    data: envelope.data,
    extensions: envelope.extensions,
  };
}

export function normalizeConnectionPage<TNode>(connection: ShopifyConnection<TNode>): NormalizedConnectionPage<TNode> {
  const edges = connection.edges ?? [];
  const nodes = connection.nodes ?? edges.map((edge) => edge.node);

  return {
    nodes,
    edges,
    pageInfo: connection.pageInfo,
  };
}

export async function fetchAdminConnectionPage<
  TData,
  TNode,
  TVariables extends ShopifyAdminGraphQLVariables = ShopifyAdminGraphQLVariables,
>(params: {
  admin: ShopifyAdminGraphQLClient;
  query: string;
  variables?: TVariables;
  selectConnection: (data: TData) => ShopifyConnection<TNode>;
}): Promise<{
  data: TData;
  connection: NormalizedConnectionPage<TNode>;
  extensions?: Record<string, unknown>;
}> {
  const result = await executeAdminGraphQL<TData, TVariables>({
    admin: params.admin,
    query: params.query,
    variables: params.variables,
  });

  return {
    data: result.data,
    connection: normalizeConnectionPage(params.selectConnection(result.data)),
    extensions: result.extensions,
  };
}
