-- CreateTable
CREATE TABLE "market_predictions" (
    "id" VARCHAR(36) NOT NULL,
    "commodity" VARCHAR(255) NOT NULL,
    "variety" VARCHAR(255) NOT NULL,
    "market" VARCHAR(255) NOT NULL,
    "prediction_date" DATE NOT NULL,
    "forecast_date" DATE NOT NULL,
    "forecast_price" DECIMAL(12,2) NOT NULL,
    "lower_bound" DECIMAL(12,2) NOT NULL,
    "upper_bound" DECIMAL(12,2) NOT NULL,
    "horizon_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_predictions_commodity_idx" ON "market_predictions"("commodity");

-- CreateIndex
CREATE INDEX "market_predictions_forecast_date_idx" ON "market_predictions"("forecast_date");
