import { SyncStatus, SyncType } from "@prisma/client";

import prisma from "../../db.server";

function stringifySyncError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown sync error";
  }
}

export async function getOrCreateSyncCheckpoint(storeId: string, syncType: SyncType) {
  return prisma.syncCheckpoint.upsert({
    where: {
      storeId_syncType: {
        storeId,
        syncType,
      },
    },
    update: {},
    create: {
      storeId,
      syncType,
      lastStatus: SyncStatus.IDLE,
    },
  });
}

export async function markSyncStarted(storeId: string, syncType: SyncType) {
  await getOrCreateSyncCheckpoint(storeId, syncType);

  return prisma.syncCheckpoint.update({
    where: {
      storeId_syncType: {
        storeId,
        syncType,
      },
    },
    data: {
      lastStartedAt: new Date(),
      lastStatus: SyncStatus.RUNNING,
      lastError: null,
    },
  });
}

export async function markSyncSucceeded(params: {
  storeId: string;
  syncType: SyncType;
  lastCursor?: string | null;
  lastSyncedAt?: Date;
}) {
  await getOrCreateSyncCheckpoint(params.storeId, params.syncType);

  const now = new Date();

  return prisma.syncCheckpoint.update({
    where: {
      storeId_syncType: {
        storeId: params.storeId,
        syncType: params.syncType,
      },
    },
    data: {
      lastCursor: params.lastCursor ?? null,
      lastSyncedAt: params.lastSyncedAt ?? now,
      lastFinishedAt: now,
      lastStatus: SyncStatus.SUCCEEDED,
      lastError: null,
    },
  });
}

export async function markSyncFailed(params: {
  storeId: string;
  syncType: SyncType;
  error: unknown;
}) {
  await getOrCreateSyncCheckpoint(params.storeId, params.syncType);

  return prisma.syncCheckpoint.update({
    where: {
      storeId_syncType: {
        storeId: params.storeId,
        syncType: params.syncType,
      },
    },
    data: {
      lastFinishedAt: new Date(),
      lastStatus: SyncStatus.FAILED,
      lastError: stringifySyncError(params.error),
    },
  });
}
