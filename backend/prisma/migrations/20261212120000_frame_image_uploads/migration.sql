CREATE TYPE "FrameImageVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

CREATE TYPE "FrameImageReviewStatus" AS ENUM (
    'NOT_REQUIRED',
    'PENDING',
    'APPROVED',
    'REJECTED'
);

ALTER TABLE "stocks"
ADD COLUMN "frame_image_upload_id" UUID;

CREATE TABLE "frame_image_uploads" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "uploader_id" UUID NOT NULL,
    "brand" VARCHAR(120) NOT NULL,
    "normalized_brand" VARCHAR(120) NOT NULL,
    "reference" VARCHAR(160) NOT NULL,
    "normalized_reference" VARCHAR(160) NOT NULL,
    "model" VARCHAR(160),
    "color" VARCHAR(100),
    "ean" VARCHAR(14),
    "visibility" "FrameImageVisibility" NOT NULL,
    "review_status" "FrameImageReviewStatus" NOT NULL,
    "image_url" VARCHAR(2048) NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "public_consent_at" TIMESTAMPTZ(6),
    "catalogue_image_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "frame_image_uploads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "frame_image_uploads_catalogue_image_id_key"
ON "frame_image_uploads"("catalogue_image_id");

CREATE INDEX "frame_image_uploads_store_id_normalized_brand_normalized_re_idx"
ON "frame_image_uploads"(
    "store_id",
    "normalized_brand",
    "normalized_reference",
    "visibility"
);

CREATE INDEX "frame_image_uploads_visibility_review_status_normalized_bra_idx"
ON "frame_image_uploads"(
    "visibility",
    "review_status",
    "normalized_brand",
    "normalized_reference"
);

ALTER TABLE "stocks"
ADD CONSTRAINT "stocks_frame_image_upload_id_fkey"
FOREIGN KEY ("frame_image_upload_id")
REFERENCES "frame_image_uploads"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "frame_image_uploads"
ADD CONSTRAINT "frame_image_uploads_store_id_fkey"
FOREIGN KEY ("store_id")
REFERENCES "magasins"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "frame_image_uploads"
ADD CONSTRAINT "frame_image_uploads_uploader_id_fkey"
FOREIGN KEY ("uploader_id")
REFERENCES "utilisateurs"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "frame_image_uploads"
ADD CONSTRAINT "frame_image_uploads_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id")
REFERENCES "utilisateurs"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "frame_image_uploads"
ADD CONSTRAINT "frame_image_uploads_catalogue_image_id_fkey"
FOREIGN KEY ("catalogue_image_id")
REFERENCES "catalogue_product_images"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
