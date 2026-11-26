ALTER TABLE "stocks"
    ADD COLUMN "creation_request_id" UUID;

CREATE UNIQUE INDEX "stocks_creation_request_id_key"
    ON "stocks"("creation_request_id");
