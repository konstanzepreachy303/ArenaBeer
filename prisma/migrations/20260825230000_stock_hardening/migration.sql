ALTER TYPE "MovementReason" ADD VALUE IF NOT EXISTS 'VENDA';
ALTER TYPE "MovementReason" ADD VALUE IF NOT EXISTS 'PERDA';
ALTER TYPE "MovementReason" ADD VALUE IF NOT EXISTS 'QUEBRA';
ALTER TYPE "MovementReason" ADD VALUE IF NOT EXISTS 'CONSUMO_INTERNO';
ALTER TYPE "MovementReason" ADD VALUE IF NOT EXISTS 'BAIXA_DIARIA';

DO $$ BEGIN
  CREATE TYPE "DailyBatchStatus" AS ENUM ('FECHADO', 'REABERTO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "dailyBatchId" TEXT;
ALTER TABLE "daily_batches" ADD COLUMN IF NOT EXISTS "referenceDate" TEXT;
ALTER TABLE "daily_batches" ADD COLUMN IF NOT EXISTS "status" "DailyBatchStatus" NOT NULL DEFAULT 'FECHADO';
ALTER TABLE "daily_batches" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false;

UPDATE "daily_batches"
SET "referenceDate" = to_char("date" AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
WHERE "referenceDate" IS NULL;

-- Se houver mais de um fechamento legado no mesmo dia, preserva o primeiro e diferencia os demais
-- para que a migração não falhe. Novos fechamentos terão 1 registro por dia.
WITH duplicated AS (
  SELECT id, "referenceDate", ROW_NUMBER() OVER (PARTITION BY "referenceDate" ORDER BY "createdAt", id) AS rn
  FROM "daily_batches"
)
UPDATE "daily_batches" b
SET "referenceDate" = b."referenceDate" || '-LEGADO-' || d.rn
FROM duplicated d
WHERE b.id = d.id AND d.rn > 1;

ALTER TABLE "daily_batches" ALTER COLUMN "referenceDate" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "daily_batches_referenceDate_key" ON "daily_batches"("referenceDate");
CREATE INDEX IF NOT EXISTS "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "stock_movements_dailyBatchId_idx" ON "stock_movements"("dailyBatchId");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_createdAt_idx" ON "audit_logs"("entity", "entityId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_batch_items_dailyBatchId_productId_key" ON "daily_batch_items"("dailyBatchId", "productId");

DO $$ BEGIN
  ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_dailyBatchId_fkey"
  FOREIGN KEY ("dailyBatchId") REFERENCES "daily_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Data de negócio da movimentação (separada do horário técnico de criação)
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "movementDate" DATE;
UPDATE "stock_movements"
SET "movementDate" = ("createdAt" AT TIME ZONE 'America/Sao_Paulo')::date
WHERE "movementDate" IS NULL;
ALTER TABLE "stock_movements" ALTER COLUMN "movementDate" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "stock_movements_productId_movementDate_createdAt_idx"
  ON "stock_movements"("productId", "movementDate", "createdAt");
