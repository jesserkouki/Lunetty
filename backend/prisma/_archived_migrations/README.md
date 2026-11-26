# Archived pre-squash migrations

These three migrations are retained for historical reference and must not be
copied back into `migrations/` or run individually:

- `20261108224358_init` creates the original English-named schema.
- `20261109013937_traduire_noms_francais` transforms that schema to the
  French-named schema.
- `20261114105114_init` is another full schema initialization. It recreates
  objects from the first two migrations and fails on the already-existing
  `PlatformRole` enum.

They are replaced by
`migrations/20261115120000_pre_clerk_baseline`, generated from the schema
after the first two migrations. Existing databases must use
`prisma/scripts/rebaseline-existing-db.sql` to update migration history.
