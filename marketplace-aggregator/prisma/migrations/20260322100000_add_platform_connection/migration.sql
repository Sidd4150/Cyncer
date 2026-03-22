-- Delete MICHAELS seed data so we can remove it from the enum
DELETE FROM "Order" WHERE platform = 'MICHAELS';

-- Remove MICHAELS from Platform enum
ALTER TYPE "Platform" RENAME TO "Platform_old";
CREATE TYPE "Platform" AS ENUM ('ETSY', 'FAIRE', 'EBAY', 'AMAZON');
ALTER TABLE "Order" ALTER COLUMN "platform" TYPE "Platform" USING "platform"::text::"Platform";
DROP TYPE "Platform_old";

-- Create PlatformConnection table
CREATE TABLE "PlatformConnection" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "platform"     "Platform" NOT NULL,
  "accessToken"  TEXT NOT NULL,
  "refreshToken" TEXT,
  "expiresAt"    TIMESTAMP(3),
  "shopId"       TEXT,
  "shopName"     TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformConnection_userId_platform_key" ON "PlatformConnection"("userId", "platform");
