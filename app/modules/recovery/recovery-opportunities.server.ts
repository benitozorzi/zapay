import { OpportunityStatus, OpportunityType } from "@prisma/client";

import prisma from "../../db.server";

function parsePositiveInteger(value: string | null, fallback: number, max: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.trunc(parsed), max);
}

function parseOpportunityType(value: string | null): OpportunityType | undefined {
  if (!value) {
    return undefined;
  }

  return Object.values(OpportunityType).includes(value as OpportunityType)
    ? (value as OpportunityType)
    : undefined;
}

function parseOpportunityStatus(value: string | null): OpportunityStatus | undefined {
  if (!value) {
    return undefined;
  }

  return Object.values(OpportunityStatus).includes(value as OpportunityStatus)
    ? (value as OpportunityStatus)
    : undefined;
}

export async function listRecoveryOpportunities(params: {
  storeId: string;
  page?: string | null;
  limit?: string | null;
  opportunityType?: string | null;
  status?: string | null;
}) {
  const page = parsePositiveInteger(params.page ?? null, 1, 10_000);
  const limit = parsePositiveInteger(params.limit ?? null, 20, 100);
  const skip = (page - 1) * limit;
  const opportunityType = parseOpportunityType(params.opportunityType ?? null);
  const status = parseOpportunityStatus(params.status ?? null);

  const where = {
    storeId: params.storeId,
    ...(opportunityType ? { opportunityType } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.recoveryOpportunity.findMany({
      where,
      orderBy: [
        { capturedAt: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
    }),
    prisma.recoveryOpportunity.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    filters: {
      opportunityType: opportunityType ?? null,
      status: status ?? null,
    },
  };
}

export async function getRecoveryOpportunityDetail(storeId: string, id: string) {
  return prisma.recoveryOpportunity.findFirst({
    where: {
      id,
      storeId,
    },
    include: {
      attempts: {
        orderBy: {
          attemptNumber: "desc",
        },
      },
    },
  });
}
