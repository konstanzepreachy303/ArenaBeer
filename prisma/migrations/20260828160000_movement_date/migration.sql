ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "movementDate" DATE;

UPDATE "stock_movements"
SET "movementDate" = ("createdAt" AT TIME ZONE 'America/Sao_Paulo')::date
WHERE "movementDate" IS NULL;

ALTER TABLE "stock_movements" ALTER COLUMN "movementDate" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "stock_movements_productId_movementDate_createdAt_idx"
  ON "stock_movements"("productId", "movementDate", "createdAt");
