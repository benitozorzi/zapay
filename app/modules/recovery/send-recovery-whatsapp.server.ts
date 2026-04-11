import { OpportunityStatus } from "@prisma/client";

import { HttpError } from "../../lib/server/route-errors.server";
import { logger } from "../../lib/server/logger.server";
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
    throw new HttpError({ status: 404, message: "Recovery opportunity not found.", code: "OPPORTUNITY_NOT_FOUND" });
  }

  if (!opportunity.customerPhoneNormalized) {
    throw new HttpError({ status: 400, message: "Opportunity does not have a normalized phone number.", code: "PHONE_REQUIRED" });
  }

  const recoveryUrl = opportunity.recoveryUrl ?? opportunity.checkoutUrl;
  if (!recoveryUrl) {
    throw new HttpError({ status: 400, message: "Opportunity does not have a recovery URL.", code: "RECOVERY_URL_REQUIRED" });
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

  logger.info("Recovery message prepared", {
    storeId: params.storeId,
    opportunityId: opportunity.id,
    attemptNumber,
  });

  return {
    opportunityId: opportunity.id,
    attemptNumber,
    status: nextStatus,
    messageRendered,
    whatsappUrl,
  };
}
