import { SyncType } from "@prisma/client";

import prisma from "../../db.server";
import { syncAbandonedCheckouts } from "./sync-abandoned-checkouts.server";
import { syncPendingOrders } from "./sync-pending-orders.server";
import {
  getOrCreateSyncCheckpoint,
  markSyncFailed,
  markSyncStarted,
  markSyncSucceeded,
} from "./sync-checkpoints.server";

interface ShopifyAdminLike {
  graphql: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    },
  ) => Promise<Response>;
}

interface RunRecoverySyncForStoreParams {
  admin: ShopifyAdminLike;
  storeId: string;
  first?: number;
}

interface SingleSyncResult {
  syncType: SyncType;
  enabled: boolean;
  success: boolean;
  skipped: boolean;
  count: number;
  hasNextPage: boolean;
  lastCursor: string | null;
  error: string | null;
}

export interface RunRecoverySyncForStoreResult {
  storeId: string;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  results: {
    abandonedCheckouts: SingleSyncResult;
    pendingPaymentOrders: SingleSyncResult;
  };
}

async function getStoreWithSettings(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { settings: true },
  });

  if (!store) {
    throw new Error(`Store not found for id ${storeId}`);
  }

  if (store.settings) {
    return store;
  }

  const settings = await prisma.storeSettings.create({
    data: {
      storeId: store.id,
    },
  });

  return {
    ...store,
    settings,
  };
}

function buildSkippedResult(syncType: SyncType): SingleSyncResult {
  return {
    syncType,
    enabled: false,
    success: true,
    skipped: true,
    count: 0,
    hasNextPage: false,
    lastCursor: null,
    error: null,
  };
}

export async function runRecoverySyncForStore({
  admin,
  storeId,
  first = 50,
}: RunRecoverySyncForStoreParams): Promise<RunRecoverySyncForStoreResult> {
  const startedAt = new Date();
  const store = await getStoreWithSettings(storeId);

  const abandonedCheckpoint = await getOrCreateSyncCheckpoint(storeId, SyncType.ABANDONED_CHECKOUTS);
  const pendingOrdersCheckpoint = await getOrCreateSyncCheckpoint(storeId, SyncType.PENDING_PAYMENT_ORDERS);

  let abandonedCheckoutsResult: SingleSyncResult = buildSkippedResult(SyncType.ABANDONED_CHECKOUTS);
  let pendingPaymentOrdersResult: SingleSyncResult = buildSkippedResult(SyncType.PENDING_PAYMENT_ORDERS);

  if (store.settings.recoveryEnabled && store.settings.captureAbandoned) {
    try {
      await markSyncStarted(storeId, SyncType.ABANDONED_CHECKOUTS);

      const syncResult = await syncAbandonedCheckouts({
        admin,
        storeId,
        first,
        after: abandonedCheckpoint.lastCursor,
        updatedAtMin: abandonedCheckpoint.lastSyncedAt,
      });

      const lastCursor = syncResult.pageInfo.endCursor ?? abandonedCheckpoint.lastCursor ?? null;

      await markSyncSucceeded({
        storeId,
        syncType: SyncType.ABANDONED_CHECKOUTS,
        lastCursor,
        lastSyncedAt: new Date(),
      });

      abandonedCheckoutsResult = {
        syncType: SyncType.ABANDONED_CHECKOUTS,
        enabled: true,
        success: true,
        skipped: false,
        count: syncResult.count,
        hasNextPage: syncResult.pageInfo.hasNextPage,
        lastCursor,
        error: null,
      };
    } catch (error) {
      await markSyncFailed({
        storeId,
        syncType: SyncType.ABANDONED_CHECKOUTS,
        error,
      });

      abandonedCheckoutsResult = {
        syncType: SyncType.ABANDONED_CHECKOUTS,
        enabled: true,
        success: false,
        skipped: false,
        count: 0,
        hasNextPage: false,
        lastCursor: abandonedCheckpoint.lastCursor ?? null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  if (store.settings.recoveryEnabled && store.settings.capturePendingOrders) {
    try {
      await markSyncStarted(storeId, SyncType.PENDING_PAYMENT_ORDERS);

      const syncResult = await syncPendingOrders({
        admin,
        storeId,
        first,
        after: pendingOrdersCheckpoint.lastCursor,
        updatedAtMin: pendingOrdersCheckpoint.lastSyncedAt,
      });

      const lastCursor = syncResult.pageInfo.endCursor ?? pendingOrdersCheckpoint.lastCursor ?? null;

      await markSyncSucceeded({
        storeId,
        syncType: SyncType.PENDING_PAYMENT_ORDERS,
        lastCursor,
        lastSyncedAt: new Date(),
      });

      pendingPaymentOrdersResult = {
        syncType: SyncType.PENDING_PAYMENT_ORDERS,
        enabled: true,
        success: true,
        skipped: false,
        count: syncResult.count,
        hasNextPage: syncResult.pageInfo.hasNextPage,
        lastCursor,
        error: null,
      };
    } catch (error) {
      await markSyncFailed({
        storeId,
        syncType: SyncType.PENDING_PAYMENT_ORDERS,
        error,
      });

      pendingPaymentOrdersResult = {
        syncType: SyncType.PENDING_PAYMENT_ORDERS,
        enabled: true,
        success: false,
        skipped: false,
        count: 0,
        hasNextPage: false,
        lastCursor: pendingOrdersCheckpoint.lastCursor ?? null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const finishedAt = new Date();

  return {
    storeId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    success: abandonedCheckoutsResult.success && pendingPaymentOrdersResult.success,
    results: {
      abandonedCheckouts: abandonedCheckoutsResult,
      pendingPaymentOrders: pendingPaymentOrdersResult,
    },
  };
}
