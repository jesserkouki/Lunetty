ALTER TABLE "stocks"
ADD COLUMN "catalogue_image_id" UUID;

CREATE INDEX "stocks_catalogue_image_id_idx"
ON "stocks"("catalogue_image_id");

ALTER TABLE "stocks"
ADD CONSTRAINT "stocks_catalogue_image_id_fkey"
FOREIGN KEY ("catalogue_image_id")
REFERENCES "catalogue_product_images"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "frame_image_uploads"
ADD COLUMN "rejection_reason" VARCHAR(500);
