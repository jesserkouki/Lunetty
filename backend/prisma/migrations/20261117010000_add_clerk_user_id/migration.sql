ALTER TABLE "utilisateurs"
ADD COLUMN "clerk_user_id" VARCHAR(255);

CREATE UNIQUE INDEX "utilisateurs_clerk_user_id_key"
ON "utilisateurs"("clerk_user_id");
