CREATE TABLE "stocks_favoris" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "stock_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stocks_favoris_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stocks_favoris_utilisateur_id_stock_id_key"
ON "stocks_favoris"("utilisateur_id", "stock_id");

CREATE INDEX "stocks_favoris_stock_id_idx"
ON "stocks_favoris"("stock_id");

ALTER TABLE "stocks_favoris"
ADD CONSTRAINT "stocks_favoris_utilisateur_id_fkey"
FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stocks_favoris"
ADD CONSTRAINT "stocks_favoris_stock_id_fkey"
FOREIGN KEY ("stock_id") REFERENCES "stocks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
