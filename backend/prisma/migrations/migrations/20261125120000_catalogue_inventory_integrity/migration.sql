ALTER TABLE "catalogue_product_variants"
    ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

DROP INDEX IF EXISTS "catalogue_product_variants_catalogue_product_id_is_active_delet";

CREATE INDEX "catalogue_product_variants_catalogue_product_id_is_active_d_idx"
    ON "catalogue_product_variants"("catalogue_product_id", "is_active", "deleted_at");

ALTER TABLE "stocks"
    ADD COLUMN "catalogue_product_id" UUID,
    ADD COLUMN "catalogue_variant_id" UUID;

CREATE INDEX "stocks_catalogue_product_id_idx"
    ON "stocks"("catalogue_product_id");
CREATE INDEX "stocks_catalogue_variant_id_idx"
    ON "stocks"("catalogue_variant_id");

ALTER TABLE "stocks"
    ADD CONSTRAINT "stocks_catalogue_product_id_fkey"
    FOREIGN KEY ("catalogue_product_id")
    REFERENCES "catalogue_products"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stocks"
    ADD CONSTRAINT "stocks_catalogue_variant_id_fkey"
    FOREIGN KEY ("catalogue_variant_id")
    REFERENCES "catalogue_product_variants"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
