ALTER TABLE "annonces_magasins"
  ALTER COLUMN "supprime_le" TYPE TIMESTAMP(3)
  USING "supprime_le" AT TIME ZONE 'UTC';

ALTER TABLE "produits"
  ALTER COLUMN "supprime_le" TYPE TIMESTAMP(3)
  USING "supprime_le" AT TIME ZONE 'UTC';

ALTER TABLE "publications"
  ALTER COLUMN "supprime_le" TYPE TIMESTAMP(3)
  USING "supprime_le" AT TIME ZONE 'UTC';
