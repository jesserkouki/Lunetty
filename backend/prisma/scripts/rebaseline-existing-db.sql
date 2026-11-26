\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations"
    WHERE "migration_name" = '20261108224358_init'
      AND "finished_at" IS NOT NULL
      AND "rolled_back_at" IS NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations"
    WHERE "migration_name" = '20261109013937_traduire_noms_francais'
      AND "finished_at" IS NOT NULL
      AND "rolled_back_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'Expected the first two legacy migrations to be successfully applied';
  END IF;
END
$$;

UPDATE "_prisma_migrations"
SET "migration_name" = CASE "migration_name"
  WHEN '20261201120000_backoffice_audit_fields' THEN '20261120000100_backoffice_audit_fields'
  WHEN '20261202120000_member_permissions' THEN '20261120000200_member_permissions'
  WHEN '20261203120000_employee_account_password_change' THEN '20261120000300_employee_account_password_change'
  WHEN '20261204120000_custom_store_location_types' THEN '20261120000400_custom_store_location_types'
  WHEN '20261205120000_inventory_optical_stock_items' THEN '20261120000500_inventory_optical_stock_items'
  WHEN '20261206120000_frame_age_group' THEN '20261120000600_frame_age_group'
  WHEN '20261207120000_admin_console' THEN '20261120000700_admin_console'
  WHEN '20261208120000_super_admin_controls' THEN '20261120000800_super_admin_controls'
  WHEN '20261209120000_optician_platform_role' THEN '20261120000900_optician_platform_role'
  WHEN '20261210120000_shared_eyewear_catalogue' THEN '20261120001000_shared_eyewear_catalogue'
  WHEN '20261210130000_catalogue_inventory_integrity' THEN '20261120001100_catalogue_inventory_integrity'
  WHEN '20261211120000_idempotent_stock_creation' THEN '20261120001200_idempotent_stock_creation'
  WHEN '20261212120000_frame_image_uploads' THEN '20261120001300_frame_image_uploads'
  WHEN '20261213120000_stock_catalogue_image_and_contribution_reason' THEN '20261120001400_stock_catalogue_image_and_contribution_reason'
  WHEN '20261214120000_align_soft_delete_timestamp_types' THEN '20261120001500_align_soft_delete_timestamp_types'
END
WHERE "migration_name" IN (
  '20261201120000_backoffice_audit_fields',
  '20261202120000_member_permissions',
  '20261203120000_employee_account_password_change',
  '20261204120000_custom_store_location_types',
  '20261205120000_inventory_optical_stock_items',
  '20261206120000_frame_age_group',
  '20261207120000_admin_console',
  '20261208120000_super_admin_controls',
  '20261209120000_optician_platform_role',
  '20261210120000_shared_eyewear_catalogue',
  '20261210130000_catalogue_inventory_integrity',
  '20261211120000_idempotent_stock_creation',
  '20261212120000_frame_image_uploads',
  '20261213120000_stock_catalogue_image_and_contribution_reason',
  '20261214120000_align_soft_delete_timestamp_types'
);

DELETE FROM "_prisma_migrations"
WHERE "migration_name" IN (
  '20261108224358_init',
  '20261109013937_traduire_noms_francais',
  '20261114105114_init'
);

INSERT INTO "_prisma_migrations" (
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "started_at",
  "applied_steps_count"
)
SELECT
  gen_random_uuid()::text,
  '8615ed822b5b7af9a1977eacbbd36ef677966a9f4edb8ca974dd1581eb2bb5ef',
  transaction_timestamp(),
  '20261115120000_pre_clerk_baseline',
  transaction_timestamp(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations"
  WHERE "migration_name" = '20261115120000_pre_clerk_baseline'
);

COMMIT;
