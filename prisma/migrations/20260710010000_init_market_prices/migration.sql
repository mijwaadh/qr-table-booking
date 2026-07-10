-- CreateTable
CREATE TABLE "market_prices" (
    "id" VARCHAR(36) NOT NULL,
    "commodity" VARCHAR(255) NOT NULL,
    "variety" VARCHAR(255) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "market" VARCHAR(255) NOT NULL,
    "arrival_date" DATE NOT NULL,
    "min_price" DECIMAL(12,2) NOT NULL,
    "max_price" DECIMAL(12,2) NOT NULL,
    "modal_price" DECIMAL(12,2) NOT NULL,
    "price_per_kg" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_prices_commodity_idx" ON "market_prices"("commodity");

-- CreateIndex
CREATE INDEX "market_prices_state_idx" ON "market_prices"("state");

-- CreateIndex
CREATE INDEX "market_prices_district_idx" ON "market_prices"("district");

-- CreateIndex
CREATE INDEX "market_prices_arrival_date_idx" ON "market_prices"("arrival_date");
