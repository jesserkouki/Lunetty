CREATE TABLE "catalogue_products" (
    "id" UUID NOT NULL,
    "brand" VARCHAR(120) NOT NULL,
    "normalized_brand" VARCHAR(120) NOT NULL,
    "reference" VARCHAR(160) NOT NULL,
    "normalized_reference" VARCHAR(160) NOT NULL,
    "model" VARCHAR(160),
    "product_type" "ProductType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalogue_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalogue_product_variants" (
    "id" UUID NOT NULL,
    "catalogue_product_id" UUID NOT NULL,
    "color_code" VARCHAR(60),
    "color_name" VARCHAR(100),
    "ean" VARCHAR(14),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalogue_product_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalogue_product_images" (
    "id" UUID NOT NULL,
    "catalogue_product_id" UUID NOT NULL,
    "variant_id" UUID,
    "image_url" VARCHAR(2048) NOT NULL,
    "storage_key" VARCHAR(1024),
    "image_source" VARCHAR(40) NOT NULL,
    "source_url" VARCHAR(2048),
    "license_information" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "verified_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalogue_product_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalogue_products_normalized_brand_normalized_reference_key"
    ON "catalogue_products"("normalized_brand", "normalized_reference");
CREATE INDEX "catalogue_products_brand_reference_idx"
    ON "catalogue_products"("brand", "reference");
CREATE INDEX "catalogue_products_normalized_brand_normalized_reference_is_idx"
    ON "catalogue_products"("normalized_brand", "normalized_reference", "is_active");
CREATE INDEX "catalogue_products_product_type_is_active_idx"
    ON "catalogue_products"("product_type", "is_active");

CREATE UNIQUE INDEX "catalogue_product_variants_ean_key"
    ON "catalogue_product_variants"("ean");
CREATE UNIQUE INDEX "catalogue_product_variants_catalogue_product_id_color_code_key"
    ON "catalogue_product_variants"("catalogue_product_id", "color_code");
CREATE INDEX "catalogue_product_variants_catalogue_product_id_color_name_idx"
    ON "catalogue_product_variants"("catalogue_product_id", "color_name");

CREATE INDEX "catalogue_product_images_catalogue_product_id_is_verified_i_idx"
    ON "catalogue_product_images"("catalogue_product_id", "is_verified", "is_primary");
CREATE INDEX "catalogue_product_images_variant_id_is_verified_idx"
    ON "catalogue_product_images"("variant_id", "is_verified");

ALTER TABLE "catalogue_product_variants"
    ADD CONSTRAINT "catalogue_product_variants_catalogue_product_id_fkey"
    FOREIGN KEY ("catalogue_product_id") REFERENCES "catalogue_products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalogue_product_images"
    ADD CONSTRAINT "catalogue_product_images_catalogue_product_id_fkey"
    FOREIGN KEY ("catalogue_product_id") REFERENCES "catalogue_products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalogue_product_images"
    ADD CONSTRAINT "catalogue_product_images_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "catalogue_product_variants"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalogue_product_images"
    ADD CONSTRAINT "catalogue_product_images_verified_by_id_fkey"
    FOREIGN KEY ("verified_by_id") REFERENCES "utilisateurs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
