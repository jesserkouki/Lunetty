ALTER TABLE "ordonnances"
  ADD COLUMN "file_name" VARCHAR(255),
  ADD COLUMN "file_type" VARCHAR(100),
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ordonnances_client_profile_id_is_active_idx"
  ON "ordonnances"("client_profile_id", "is_active");

CREATE UNIQUE INDEX "ordonnances_one_active_per_client_idx"
  ON "ordonnances"("client_profile_id")
  WHERE "is_active" = true;

ALTER TABLE "rendez_vous"
  ADD COLUMN "prescription_id" UUID;

CREATE INDEX "rendez_vous_prescription_id_idx"
  ON "rendez_vous"("prescription_id");

ALTER TABLE "rendez_vous"
  ADD CONSTRAINT "rendez_vous_prescription_id_fkey"
  FOREIGN KEY ("prescription_id") REFERENCES "ordonnances"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD COLUMN "appointment_id" UUID;

CREATE UNIQUE INDEX "notifications_appointment_id_key"
  ON "notifications"("appointment_id");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "rendez_vous"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
