CREATE TABLE "parametres_plateforme" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'global',
    "store_registrations_enabled" BOOLEAN NOT NULL DEFAULT true,
    "advertisements_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "parametres_plateforme_pkey" PRIMARY KEY ("id")
);

INSERT INTO "parametres_plateforme" ("id", "modifie_le")
VALUES ('global', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "campagnes_publicitaires" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(160) NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "target_audience" VARCHAR(80),
    "target_location" VARCHAR(160),
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "budget" DECIMAL(12,3),
    "internal_notes" TEXT,
    "created_by_id" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "campagnes_publicitaires_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "campagnes_publicitaires_status_check"
        CHECK ("statut" IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED')),
    CONSTRAINT "campagnes_publicitaires_dates_check"
        CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" >= "starts_at"),
    CONSTRAINT "campagnes_publicitaires_budget_check"
        CHECK ("budget" IS NULL OR "budget" >= 0)
);

CREATE TABLE "publicites_plateforme" (
    "id" UUID NOT NULL,
    "campagne_id" UUID,
    "titre" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(2048),
    "destination_url" VARCHAR(2048) NOT NULL,
    "annonceur" VARCHAR(160) NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "internal_notes" TEXT,
    "created_by_id" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "publicites_plateforme_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "publicites_plateforme_status_check"
        CHECK ("statut" IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED')),
    CONSTRAINT "publicites_plateforme_type_check"
        CHECK ("type" IN ('BANNER', 'SPONSORED_LISTING', 'PROMOTION')),
    CONSTRAINT "publicites_plateforme_dates_check"
        CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" >= "starts_at")
);

CREATE TABLE "evenements_publicites" (
    "id" UUID NOT NULL,
    "publicite_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evenements_publicites_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "evenements_publicites_type_check"
        CHECK ("type" IN ('IMPRESSION', 'CLICK'))
);

CREATE INDEX "campagnes_publicitaires_statut_starts_at_ends_at_idx"
    ON "campagnes_publicitaires"("statut", "starts_at", "ends_at");
CREATE INDEX "publicites_plateforme_statut_starts_at_ends_at_idx"
    ON "publicites_plateforme"("statut", "starts_at", "ends_at");
CREATE INDEX "publicites_plateforme_campagne_id_idx"
    ON "publicites_plateforme"("campagne_id");
CREATE INDEX "evenements_publicites_publicite_id_type_cree_le_idx"
    ON "evenements_publicites"("publicite_id", "type", "cree_le");

ALTER TABLE "campagnes_publicitaires"
    ADD CONSTRAINT "campagnes_publicitaires_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "utilisateurs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "publicites_plateforme"
    ADD CONSTRAINT "publicites_plateforme_campagne_id_fkey"
    FOREIGN KEY ("campagne_id") REFERENCES "campagnes_publicitaires"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "publicites_plateforme"
    ADD CONSTRAINT "publicites_plateforme_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "utilisateurs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evenements_publicites"
    ADD CONSTRAINT "evenements_publicites_publicite_id_fkey"
    FOREIGN KEY ("publicite_id") REFERENCES "publicites_plateforme"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
