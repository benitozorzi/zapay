import prisma from "../../db.server";

import type { RecoveryOpportunityMappedPayload } from "./recovery-opportunity.mapper.server";

export async function upsertRecoveryOpportunityFromShopify(
  payload: RecoveryOpportunityMappedPayload,
) {
  return prisma.recoveryOpportunity.upsert({
    where: {
      storeId_opportunityType_sourceShopifyId: {
        storeId: payload.storeId,
        opportunityType: payload.opportunityType,
        sourceShopifyId: payload.sourceShopifyId,
      },
    },
    create: payload.create,
    update: payload.update,
  });
}
