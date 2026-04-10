import { OpportunityStatus, OpportunityType, Prisma } from "@prisma/client";

import prisma from "../../db.server";

const SENT_STATUSES = [
  OpportunityStatus.SENT_ONCE,
  OpportunityStatus.SENT_MULTIPLE,
  OpportunityStatus.CONVERTED,
] as const;

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value == null) {
    return 0;
  }

  return typeof value === "number" ? value : value.toNumber();
}

function percentage(part: number, total: number): number {
  if (!total) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(2));
}

type BreakdownAccumulator = {
  opportunityType: OpportunityType;
  totalCaptured: number;
  totalEligible: number;
  totalSent: number;
  totalConverted: number;
  grossRecoveredValue: number;
  netRecoveredValue: number;
  recoveryRate: number;
};

export interface DashboardSummary {
  storeId: string;
  generatedAt: string;
  totals: {
    totalCaptured: number;
    totalEligible: number;
    totalSent: number;
    totalConverted: number;
    grossRecoveredValue: number;
    discountValue: number;
    netRecoveredValue: number;
    recoveryRate: number;
  };
  breakdown: BreakdownAccumulator[];
}

export async function getDashboardSummary(storeId: string): Promise<DashboardSummary> {
  const [
    totalCapturedAggregate,
    totalEligibleAggregate,
    totalSentAggregate,
    totalConvertedAggregate,
    convertedValueAggregate,
    typeStatusGroups,
    typeConvertedValueGroups,
  ] = await Promise.all([
    prisma.recoveryOpportunity.aggregate({
      where: { storeId },
      _count: { _all: true },
    }),
    prisma.recoveryOpportunity.aggregate({
      where: {
        storeId,
        status: OpportunityStatus.ELIGIBLE,
      },
      _count: { _all: true },
    }),
    prisma.recoveryOpportunity.aggregate({
      where: {
        storeId,
        status: {
          in: [...SENT_STATUSES],
        },
      },
      _count: { _all: true },
    }),
    prisma.recoveryOpportunity.aggregate({
      where: {
        storeId,
        status: OpportunityStatus.CONVERTED,
      },
      _count: { _all: true },
    }),
    prisma.recoveryOpportunity.aggregate({
      where: {
        storeId,
        status: OpportunityStatus.CONVERTED,
      },
      _sum: {
        cartValue: true,
      },
    }),
    prisma.recoveryOpportunity.groupBy({
      by: ["opportunityType", "status"],
      where: { storeId },
      _count: { _all: true },
    }),
    prisma.recoveryOpportunity.groupBy({
      by: ["opportunityType"],
      where: {
        storeId,
        status: OpportunityStatus.CONVERTED,
      },
      _sum: {
        cartValue: true,
      },
    }),
  ]);

  const totalCaptured = totalCapturedAggregate._count._all;
  const totalEligible = totalEligibleAggregate._count._all;
  const totalSent = totalSentAggregate._count._all;
  const totalConverted = totalConvertedAggregate._count._all;
  const grossRecoveredValue = decimalToNumber(convertedValueAggregate._sum.cartValue);
  const discountValue = 0;
  const netRecoveredValue = grossRecoveredValue - discountValue;

  const breakdownMap = new Map<OpportunityType, BreakdownAccumulator>();

  for (const opportunityType of Object.values(OpportunityType)) {
    breakdownMap.set(opportunityType, {
      opportunityType,
      totalCaptured: 0,
      totalEligible: 0,
      totalSent: 0,
      totalConverted: 0,
      grossRecoveredValue: 0,
      netRecoveredValue: 0,
      recoveryRate: 0,
    });
  }

  for (const group of typeStatusGroups) {
    const breakdown = breakdownMap.get(group.opportunityType);

    if (!breakdown) {
      continue;
    }

    breakdown.totalCaptured += group._count._all;

    if (group.status === OpportunityStatus.ELIGIBLE) {
      breakdown.totalEligible += group._count._all;
    }

    if (SENT_STATUSES.includes(group.status as (typeof SENT_STATUSES)[number])) {
      breakdown.totalSent += group._count._all;
    }

    if (group.status === OpportunityStatus.CONVERTED) {
      breakdown.totalConverted += group._count._all;
    }
  }

  for (const group of typeConvertedValueGroups) {
    const breakdown = breakdownMap.get(group.opportunityType);

    if (!breakdown) {
      continue;
    }

    const grossValue = decimalToNumber(group._sum.cartValue);
    breakdown.grossRecoveredValue = grossValue;
    breakdown.netRecoveredValue = grossValue;
  }

  const breakdown = [...breakdownMap.values()].map((item) => ({
    ...item,
    recoveryRate: percentage(item.totalConverted, item.totalCaptured),
  }));

  return {
    storeId,
    generatedAt: new Date().toISOString(),
    totals: {
      totalCaptured,
      totalEligible,
      totalSent,
      totalConverted,
      grossRecoveredValue,
      discountValue,
      netRecoveredValue,
      recoveryRate: percentage(totalConverted, totalCaptured),
    },
    breakdown,
  };
}
