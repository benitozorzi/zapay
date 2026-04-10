-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('ABANDONED_CHECKOUT', 'PENDING_PAYMENT_ORDER');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('CAPTURED', 'ELIGIBLE', 'SENT_ONCE', 'SENT_MULTIPLE', 'CONVERTED', 'EXPIRED', 'INELIGIBLE');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('ABANDONED_CHECKOUTS', 'PENDING_PAYMENT_ORDERS', 'CONVERSION_RECONCILIATION');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConversionType" AS ENUM ('CHECKOUT_COMPLETED', 'ORDER_PAID', 'MANUAL_MATCH');

-- CreateEnum
CREATE TYPE "RecoveryChannel" AS ENUM ('WHATSAPP_WEB');

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "recoveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "captureAbandoned" BOOLEAN NOT NULL DEFAULT true,
    "capturePendingOrders" BOOLEAN NOT NULL DEFAULT true,
    "attributionWindowHours" INTEGER NOT NULL DEFAULT 72,
    "discountEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryOpportunity" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "opportunityType" "OpportunityType" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'CAPTURED',
    "sourceShopifyId" TEXT NOT NULL,
    "orderGid" TEXT,
    "checkoutGid" TEXT,
    "orderName" TEXT,
    "customerName" TEXT,
    "customerFirstName" TEXT,
    "customerEmail" TEXT,
    "customerPhoneNormalized" TEXT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "cartValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "recoveryUrl" TEXT,
    "checkoutUrl" TEXT,
    "discountCode" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "convertedOrderId" TEXT,
    "conversionType" "ConversionType",
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryAttempt" (
    "id" TEXT NOT NULL,
    "recoveryOpportunityId" TEXT NOT NULL,
    "channel" "RecoveryChannel" NOT NULL DEFAULT 'WHATSAPP_WEB',
    "messageRendered" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCheckpoint" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "syncType" "SyncType" NOT NULL,
    "lastCursor" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastStartedAt" TIMESTAMP(3),
    "lastFinishedAt" TIMESTAMP(3),
    "lastStatus" "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreSettings_storeId_key" ON "StoreSettings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryOpportunity_storeId_opportunityType_sourceShopifyId_key" ON "RecoveryOpportunity"("storeId", "opportunityType", "sourceShopifyId");

-- CreateIndex
CREATE INDEX "RecoveryOpportunity_storeId_status_idx" ON "RecoveryOpportunity"("storeId", "status");

-- CreateIndex
CREATE INDEX "RecoveryOpportunity_storeId_opportunityType_status_idx" ON "RecoveryOpportunity"("storeId", "opportunityType", "status");

-- CreateIndex
CREATE INDEX "RecoveryOpportunity_storeId_customerEmail_idx" ON "RecoveryOpportunity"("storeId", "customerEmail");

-- CreateIndex
CREATE INDEX "RecoveryOpportunity_storeId_customerPhoneNormalized_idx" ON "RecoveryOpportunity"("storeId", "customerPhoneNormalized");

-- CreateIndex
CREATE INDEX "RecoveryOpportunity_storeId_capturedAt_idx" ON "RecoveryOpportunity"("storeId", "capturedAt");

-- CreateIndex
CREATE INDEX "RecoveryOpportunity_convertedAt_idx" ON "RecoveryOpportunity"("convertedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAttempt_recoveryOpportunityId_attemptNumber_key" ON "RecoveryAttempt"("recoveryOpportunityId", "attemptNumber");

-- CreateIndex
CREATE INDEX "RecoveryAttempt_recoveryOpportunityId_sentAt_idx" ON "RecoveryAttempt"("recoveryOpportunityId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncCheckpoint_storeId_syncType_key" ON "SyncCheckpoint"("storeId", "syncType");

-- CreateIndex
CREATE INDEX "SyncCheckpoint_storeId_lastStatus_idx" ON "SyncCheckpoint"("storeId", "lastStatus");

-- AddForeignKey
ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryOpportunity" ADD CONSTRAINT "RecoveryOpportunity_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAttempt" ADD CONSTRAINT "RecoveryAttempt_recoveryOpportunityId_fkey" FOREIGN KEY ("recoveryOpportunityId") REFERENCES "RecoveryOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncCheckpoint" ADD CONSTRAINT "SyncCheckpoint_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
