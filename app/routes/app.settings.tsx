import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  InlineGrid,
  Page,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { useEffect, useState } from "react";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { getOrCreateStoreSettings } from "../modules/recovery/recovery-settings.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const settings = await getOrCreateStoreSettings(store.id);

  return json({ settings });
}

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof import("./app.api.settings").action>();

  const [recoveryEnabled, setRecoveryEnabled] = useState(settings.recoveryEnabled);
  const [captureAbandoned, setCaptureAbandoned] = useState(settings.captureAbandoned);
  const [capturePendingOrders, setCapturePendingOrders] = useState(settings.capturePendingOrders);
  const [attributionWindowHours, setAttributionWindowHours] = useState(String(settings.attributionWindowHours));
  const [discountEnabled, setDiscountEnabled] = useState(settings.discountEnabled);
  const [discountType, setDiscountType] = useState(settings.discountType ?? "");
  const [discountValue, setDiscountValue] = useState(settings.discountValue ? String(settings.discountValue) : "");

  useEffect(() => {
    if (!fetcher.data) return;

    setRecoveryEnabled(fetcher.data.recoveryEnabled);
    setCaptureAbandoned(fetcher.data.captureAbandoned);
    setCapturePendingOrders(fetcher.data.capturePendingOrders);
    setAttributionWindowHours(String(fetcher.data.attributionWindowHours));
    setDiscountEnabled(fetcher.data.discountEnabled);
    setDiscountType(fetcher.data.discountType ?? "");
    setDiscountValue(fetcher.data.discountValue ? String(fetcher.data.discountValue) : "");
  }, [fetcher.data]);

  const isSaving = fetcher.state !== "idle";

  return (
    <Page title="Configurações">
      <BlockStack gap="500">
        {fetcher.data ? (
          <Banner tone="success" title="Configurações salvas">
            As preferências da loja foram atualizadas com sucesso.
          </Banner>
        ) : null}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Captura e operação
            </Text>

            <Checkbox
              label="Ativar recuperação de vendas"
              checked={recoveryEnabled}
              onChange={setRecoveryEnabled}
            />
            <Checkbox
              label="Capturar checkouts abandonados"
              checked={captureAbandoned}
              onChange={setCaptureAbandoned}
            />
            <Checkbox
              label="Capturar pedidos com pagamento pendente"
              checked={capturePendingOrders}
              onChange={setCapturePendingOrders}
            />

            <TextField
              label="Janela de atribuião (horas)"
              type="number"
              autoComplete="off"
              value={attributionWindowHours}
              onChange={setAttributionWindowHours}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Desconto
            </Text>

            <Checkbox
              label="Habilitar desconto na recuperação"
              checked={discountEnabled}
              onChange={setDiscountEnabled}
            />

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              <Select
                label="Tipo de desconto"
                options={[
                  { label: "Nenhum", value: "" },
                  { label: "Percentual", value: "PERCENTAGE" },
                  { label: "Valor fixo", value: "FIXED_AMOUNT" },
                ]}
                value={discountType}
                onChange={setDiscountType}
                disabled={!discountEnabled}
              />

              <TextField
                label="Valor do desconto"
                autoComplete="off"
                value={discountValue}
                onChange={setDiscountValue}
                disabled={!discountEnabled}
              />
            </InlineGrid>
          </BlockStack>
        </Card>

        <Button
          variant="primary"
          loading={isSaving}
          onClick={() => {
            fetcher.submit(
              {
                recoveryEnabled: String(recoveryEnabled),
                captureAbandoned: String(captureAbandoned),
                capturePendingOrders: String(capturePendingOrders),
                attributionWindowHours,
                discountEnabled: String(discountEnabled),
                discountType,
                discountValue,
              },
              {
                action: "/app/api/settings",
                method: "post",
              },
            );
          }}
        >
          Salvar configurações 
        </Button>
      </BlockStack>
    </Page>
  );
}
