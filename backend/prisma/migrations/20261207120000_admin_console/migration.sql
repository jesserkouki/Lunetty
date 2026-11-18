CREATE TABLE "plans_plateforme" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "max_employees" INTEGER,
    "max_listings" INTEGER,
    "monthly_ai_tokens" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "plans_plateforme_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attributions_plans_plateforme" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "magasin_id" UUID,
    "utilisateur_id" UUID,
    "attribue_par_id" UUID,
    "attribue_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attributions_plans_plateforme_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "attributions_plans_plateforme_one_target_check"
        CHECK (("magasin_id" IS NOT NULL)::int + ("utilisateur_id" IS NOT NULL)::int = 1)
);

CREATE TABLE "utilisations_ia" (
    "id" UUID NOT NULL,
    "magasin_id" UUID,
    "utilisateur_id" UUID,
    "fournisseur" VARCHAR(60) NOT NULL,
    "modele" VARCHAR(120) NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "utilisations_ia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clics_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "annonce_id" UUID,
    "type" VARCHAR(30) NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clics_magasins_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "clics_magasins_type_check" CHECK ("type" IN ('STORE_PROFILE', 'STORE_LISTING'))
);

CREATE UNIQUE INDEX "plans_plateforme_code_key" ON "plans_plateforme"("code");
CREATE UNIQUE INDEX "attributions_plans_plateforme_magasin_id_key" ON "attributions_plans_plateforme"("magasin_id");
CREATE UNIQUE INDEX "attributions_plans_plateforme_utilisateur_id_key" ON "attributions_plans_plateforme"("utilisateur_id");
CREATE INDEX "attributions_plans_plateforme_plan_id_idx" ON "attributions_plans_plateforme"("plan_id");
CREATE INDEX "utilisations_ia_magasin_id_cree_le_idx" ON "utilisations_ia"("magasin_id", "cree_le");
CREATE INDEX "utilisations_ia_utilisateur_id_cree_le_idx" ON "utilisations_ia"("utilisateur_id", "cree_le");
CREATE INDEX "clics_magasins_magasin_id_cree_le_idx" ON "clics_magasins"("magasin_id", "cree_le");
CREATE INDEX "clics_magasins_annonce_id_cree_le_idx" ON "clics_magasins"("annonce_id", "cree_le");

ALTER TABLE "attributions_plans_plateforme"
    ADD CONSTRAINT "attributions_plans_plateforme_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "plans_plateforme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attributions_plans_plateforme"
    ADD CONSTRAINT "attributions_plans_plateforme_magasin_id_fkey"
    FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attributions_plans_plateforme"
    ADD CONSTRAINT "attributions_plans_plateforme_utilisateur_id_fkey"
    FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "utilisations_ia"
    ADD CONSTRAINT "utilisations_ia_magasin_id_fkey"
    FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "utilisations_ia"
    ADD CONSTRAINT "utilisations_ia_utilisateur_id_fkey"
    FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clics_magasins"
    ADD CONSTRAINT "clics_magasins_magasin_id_fkey"
    FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clics_magasins"
    ADD CONSTRAINT "clics_magasins_annonce_id_fkey"
    FOREIGN KEY ("annonce_id") REFERENCES "annonces_magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
