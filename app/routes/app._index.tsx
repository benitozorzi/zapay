import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BlockStack, Card, Layout, Page, Text } from "@shopify/polaris";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);

  return json({
    shop: session.shop,
    store,
  });
}

export default function AppIndexRoute() {
  const { shop, store } = useLoaderData<typeof loader>();

  return (
    <Page title="Zapay">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Etapa 1 concluída
              </Text>

              <Text as="p" variant="bodyMd">
                A base do app embedded já está pronta com autenticação admin,
                Prisma e resolução de Store por <code>session.shop</code>.
              </Text>

              <Text as="p" variant="bodyMd">
                Loja autenticada: <strong>{shop}</strong>
              </Text>

              <Text as="p" variant="bodyMd">
                Store persistida: <strong>{store.shopDomain}</strong>
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
