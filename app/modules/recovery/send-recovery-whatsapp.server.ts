import { OpportunityStatus } from "@prisma/client";

import prisma from "../../db.server";

function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D+/g, "");
}

function buildRecoveryMessage(params: {
  firstName?: string | null;
  recoveryUrl: string;
  orderName?: string | null;
}) {
  const greetingName = params.firstName?.trim() || "tudo bem";
  const orderContext = params.orderName ? ` do pedido ${params.orderName}` : " da sua compra";

  return [
    `Olá, ${greetingName}.`,
    `Identificamos que o pagamento${orderContext} ainda não foi concluído.`,
    `Você pode retomar por este link: ${params.recoveryUrl}`,
    "Se precisar, seguimos à disposição.",
  ].join(" ");
}

export async function sendRecoveryOpportunityViaWhatsApp(params: {
  storeId: string;
  opportunityId: string;
}) {
  const opportunity = await prisma.recoveryOpportunity.findFirst({
    where: {
      id: params.opportunityId,
      storeId: params.storeId,
    },
    include: {
      attempts: {
        orderBy: {
          attemptNumber: "desc",
        },
        take: 1,
      },
    },
  });

  if (!opportunity) {
    throw new Error("Recovery opportunity not found.");
  }

  if (!opportunity.customerPhoneNormalized) {
    throw new Error("Opportunity does not have a normalized phone number.");
  }

  const recoveryUrl = opportunity.recoveryUrl ?? opportunity.checkoutUrl;
  if (!recoveryUrl) {
    throw new Error("Opportunity does not have a recovery URL.");
  }

  const attemptNumber = (opportunity.attempts[0]?.attemptNumber ?? 0) + 1;
  const messageRendered = buildRecoveryMessage({
    firstName: opportunity.customerFirstName,
    recoveryUrl,
    orderName: opportunity.orderName,
  });

  const nextStatus = attemptNumber === 1 ? OpportunityStatus.SENT_ONCE : OpportunityStatus.SENT_MULTIPLE;
  const sentAt = new Date();

  await prisma.$transaction([
    prisma.recoveryAttempt.create({
      data: {
        recoveryOpportunityId: opportunity.id,
        messageRendered,
        attemptNumber,
        sentAt,
      },
    }),
    prisma.recoveryOpportunity.update({
      where: { id: opportunity.id },
      data: {
        lastAttemptAt: sentAt,
        status: nextStatus,
      },
    }),
  ]);

  const phoneForWa = normalizePhoneForWhatsApp(opportunity.customerPhoneNormalized);
  const whatsappUrl = `https://wa.me/${phoneForWa}?text=${encodeURIComponent(messageRendered)}`;

  return {
    opportunityId: opportunity.id,
    attemptNumber,
    status: nextStatus,
    messageRendered,
    whatsappUrl,
  };
}
