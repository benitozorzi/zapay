import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Layout,
  List,
  Page,
  Text,
} from "@shopify/polaris";
import { useEffect } from "react";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { getDashboardSummary } from "../modules/recovery/dashboard-summary.server";
import { authenticate } from "../shopify.server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function MetricCard(props: { title: string; value: string; tone?: "success" | "base" }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="bodyMd" tone="subdued">
          {props.title}
        </Text>
        <Text as="p" variant="headingLg" tone={props.tone === "success" ? "success" : undefined}>
          {props.value}
        </Text>
      </BlockStack>
    </Card>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const summary = await getDashboardSummary(store.id);

  return json({
    shop: session.shop,
    summary,
  });
}

export default function DashboardPage() {
  const { shop, summary } = useLoaderData<typeof loader>();
  const syncFetcher = useFetcher<typeof import("./app.api.sync").action>();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (syncFetcher.state === "idle" && syncFetcher.data) {
      revalidator.revalidate();
    }
  }, [revalidator, syncFetcher.data, syncFetcher.state]);

  return (
    <Page
      title="Dashboard"
      subtitle={shop}
      primaryAction={{
        content: syncFetcher.state === "submitting" ? "Sincronizando..." : "Sincronizar agora",
        disabled: syncFetcher.state !== "idle",
        onAction: () => {
          syncFetcher.submit(
            { first: "50", includeReconciliation: "true" },
            { action: "/app/api/sync", method: "post" },
          );
        },
      }}
    >
      <Layout>
        {syncFetcher.data ? (
          <Layout.Section>
            <Banner tone="success" title="Sincronização concluída">
              <List>
                <List.Item>
                  Abandonados: {syncFetcher.data.sync.results.abandonedCheckouts.count}
                </List.Item>
                <List.Item>
                  Pendentes: {syncFetcher.data.sync.results.pendingPaymentOrders.count}
                </List.Item>
                <List.Item>
                  Reconciliações: {syncFetcher.data.reconciliation?.matchedCount ?? 0}
                </List.Item>
              </List>
            </Banner>
          </Layout.Section>
        ) : null}

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            <MetricCard title="Total capturado" value={String(summary.totals.totalCaptured)} />
            <MetricCard title="Total elegível" value={String(summary.totals.totalEligible)} />
            <MetricCard title="Total enviado" value={String(summary.totals.totalSent)} />
            <MetricCard title="Total convertido" value={String(summary.totals.totalConverted)} tone="success" />
            <MetricCard title="Valor bruto recuperado" value={formatCurrency(summary.totals.grossRecoveredValue)} tone="success" />
            <MetricCard title="Taxa de recuperação" value={`${summary.totals.recoveryRate}%`} />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Breakdown por origem
                </Text>
                <Button url="/app/opportunities">Ver oportunidades</Button>
              </InlineStack>

              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                {summary.breakdown.map((item) => (
                  <Card key={item.opportunityType}>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        {item.opportunityType}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Capturado: {item.totalCaptured}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Elegível: {item.totalEligible}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Enviado: {item.totalSent}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Convertido: {item.totalConverted}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Recuperado: {formatCurrency(item.grossRecoveredValue)}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Taxa: {item.recoveryRate}%
                      </Text>
                    </BlockStack>
                  </Card>
                ))}
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Próximas áreas do app
              </Text>
              <Box>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <Link to="/app/opportunities">Lista de oportunidades</Link>
                  </li>
                  <li>
                    <Link to="/app/settings">Configurações da loja</Link>
                  </li>
                </ul>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
