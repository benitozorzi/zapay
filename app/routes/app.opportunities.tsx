import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Page,
  Select,
  Text,
} from "@shopify/polaris";
import { useState } from "react";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { listRecoveryOpportunities } from "../modules/recovery/recovery-opportunities.server";
import { authenticate } from "../shopify.server";

function formatCurrency(value: string | number | null | undefined) {
  const numeric = value == null ? 0 : Number(value);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const url = new URL(request.url);

  const data = await listRecoveryOpportunities({
    storeId: store.id,
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    opportunityType: url.searchParams.get("opportunityType"),
    status: url.searchParams.get("status"),
  });

  return json(data);
}

export default function OpportunitiesPage() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [opportunityType, setOpportunityType] = useState(data.filters.opportunityType ?? "");
  const [status, setStatus] = useState(data.filters.status ?? "");
  const [limit, setLimit] = useState(String(data.pagination.limit));

  const submitFilters = (page = 1) => {
    submit(
      {
        page: String(page),
        limit,
        opportunityType,
        status,
      },
      { method: "get" },
    );
  };

  return (
    <Page title="Oportunidades">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Filtros
            </Text>

            <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
              <Select
                label="Origem"
                options={[
                  { label: "Todas", value: "" },
                  { label: "Checkout abandonado", value: "ABANDONED_CHECKOUT" },
                  { label: "Pedido pendente", value: "PENDING_PAYMENT_ORDER" },
                ]}
                value={opportunityType}
                onChange={setOpportunityType}
              />

              <Select
                label="Status"
                options={[
                  { label: "Todos", value: "" },
                  { label: "Capturado", value: "CAPTURED" },
                  { label: "Elegível", value: "ELIGIBLE" },
                  { label: "Enviado uma vez", value: "SENT_ONCE" },
                  { label: "Enviado múltiplas vezes", value: "SENT_MULTIPLE" },
                  { label: "Convertido", value: "CONVERTED" },
                  { label: "Expirado", value: "EXPIRED" },
                  { label: "Inelegível", value: "INELIGIBLE" },
                ]}
                value={status}
                onChange={setStatus}
              />

              <Select
                label="Itens por página"
                options={[
                  { label: "20", value: "20" },
                  { label: "50", value: "50" },
                  { label: "100", value: "100" },
                ]}
                value={limit}
                onChange={setLimit}
              />
            </InlineGrid>

            <InlineStack gap="300">
              <Button variant="primary" onClick={() => submitFilters(1)}>
                Aplicar filtros
              </Button>
              <Button
                onClick={() => {
                  setOpportunityType("");
                  setStatus("");
                  setLimit("20");
                  submit({ page: "1", limit: "20", opportunityType: "", status: "" }, { method: "get" });
                }}
              >
                Limpar
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {data.items.length === 0 ? (
          <Banner tone="info" title="Nenhuma oportunidade encontrada">
            Ajuste os filtros ou rode uma nova sincronização.
          </Banner>
        ) : (
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            {data.items.map((item) => (
              <Card key={item.id}>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingMd">
                      {item.orderName ?? item.customerName ?? item.sourceShopifyId}
                    </Text>
                    <Button url={`/app/opportunities/${item.id}`}>Detalhe</Button>
                  </InlineStack>

                  <Text as="p" variant="bodyMd">
                    Origem: {item.opportunityType}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Status: {item.status}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Cliente: {item.customerName ?? "-"}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    E-mail: {item.customerEmail ?? "-"}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Telefone: {item.customerPhoneNormalized ?? "-"}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Valor: {formatCurrency(item.cartValue)}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Capturado em: {formatDate(item.capturedAt)}
                  </Text>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        )}

        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <Text as="p" variant="bodyMd">
              Página {data.pagination.page} de {data.pagination.totalPages} · {data.pagination.total} registros
            </Text>
            <InlineStack gap="300">
              <Button
                disabled={data.pagination.page <= 1}
                onClick={() => submitFilters(data.pagination.page - 1)}
              >
                Anterior
              </Button>
              <Button
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => submitFilters(data.pagination.page + 1)}
              >
                Próxima
              </Button>
            </InlineStack>
          </InlineStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
