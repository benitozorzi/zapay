import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";

import { getStoreForSessionShop } from "../lib/server/store.server";
import { getRecoveryOpportunityDetail } from "../modules/recovery/recovery-opportunities.server";
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const store = await getStoreForSessionShop(session.shop);
  const id = params.id;

  if (!id) {
    throw new Response("Opportunity id is required.", { status: 400 });
  }

  const opportunity = await getRecoveryOpportunityDetail(store.id, id);
  if (!opportunity) {
    throw new Response("Opportunity not found.", { status: 404 });
  }

  return json({ opportunity });
}

export default function OpportunityDetailPage() {
  const { opportunity } = useLoaderData<typeof loader>();
  const sendFetcher = useFetcher<typeof import("./app.api.opportunities.$id.send").action>();

  return (
    <Page
      title={opportunity.orderName ?? opportunity.customerName ?? "Oportunidade"}
      backAction={{ content: "Oportunidades", url: "/app/opportunities" }}
    >
      <BlockStack gap="500">
        {sendFetcher.data?.error ? (
          <Banner tone="critical" title="Não foi possível preparar o envio">
            {sendFetcher.data.error}
          </Banner>
        ) : null}

        {sendFetcher.data?.whatsappUrl ? (
          <Banner tone="success" title="Mensagem pronta para envio">
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                Tentativa registrada com sucesso. Agora você pode abrir o WhatsApp para enviar a mensagem.
              </Text>
              <Box>
                <Button url={sendFetcher.data.whatsappUrl} target="_blank" variant="primary">
                  Abrir WhatsApp
                </Button>
              </Box>
            </BlockStack>
          </Banner>
        ) : null}

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <Card>
            <BlockStack gap="250">
              <Text as="h2" variant="headingMd">
                Dados da oportunidade
              </Text>
              <Text as="p" variant="bodyMd">Origem: {opportunity.opportunityType}</Text>
              <Text as="p" variant="bodyMd">Status: {opportunity.status}</Text>
              <Text as="p" variant="bodyMd">Cliente: {opportunity.customerName ?? "-"}</Text>
              <Text as="p" variant="bodyMd">Primeiro nome: {opportunity.customerFirstName ?? "-"}</Text>
              <Text as="p" variant="bodyMd">E-mail: {opportunity.customerEmail ?? "-"}</Text>
              <Text as="p" variant="bodyMd">Telefone: {opportunity.customerPhoneNormalized ?? "-"}</Text>
              <Text as="p" variant="bodyMd">Valor: {formatCurrency(opportunity.cartValue)}</Text>
              <Text as="p" variant="bodyMd">Capturado em: {formatDate(opportunity.capturedAt)}</Text>
              <Text as="p" variant="bodyMd">Última tentativa: {formatDate(opportunity.lastAttemptAt)}</Text>
              <Text as="p" variant="bodyMd">Convertido em: {formatDate(opportunity.convertedAt)}</Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="250">
              <Text as="h2" variant="headingMd">
                Ações
              </Text>
              <Text as="p" variant="bodyMd">
                Use o envio manual para abrir o WhatsApp Web com a mensagem montada e registrar a tentativa no histórico.
              </Text>
              <Box>
                <Button
                  variant="primary"
                  loading={sendFetcher.state !== "idle"}
                  onClick={() => {
                    sendFetcher.submit(null, {
                      action: `/app/api/opportunities/${opportunity.id}/send`,
                      method: "post",
                    });
                  }}
                >
                  Enviar no WhatsApp
                </Button>
              </Box>
              {opportunity.recoveryUrl ? (
                <Button url={opportunity.recoveryUrl} target="_blank">
                  Abrir link de retomada
                </Button>
              ) : null}
            </BlockStack>
          </Card>
        </InlineGrid>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Histórico de tentativas
            </Text>

            {opportunity.attempts.length === 0 ? (
              <Text as="p" variant="bodyMd">
                Ainda não há tentativas registradas para esta oportunidade.
              </Text>
            ) : (
              <BlockStack gap="300">
                {opportunity.attempts.map((attempt) => (
                  <Card key={attempt.id}>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Tentativa #{attempt.attemptNumber}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Canal: {attempt.channel}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Enviado em: {formatDate(attempt.sentAt)}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Mensagem: {attempt.messageRendered}
                      </Text>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
