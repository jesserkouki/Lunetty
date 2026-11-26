# Prisma migrations

## Creating migrations

From `backend/`, create migrations with:

```sh
npx prisma migrate dev --name <name>
```

Keep migration directories directly under `prisma/migrations/`; never place
them in a nested `migrations/` directory. Do not edit SQL for a migration
already applied to a shared database.

Run `sh backend/scripts/check-migrations.sh` from the repository root to verify
a clean deploy and schema diff in a temporary database. The script drops only
the temporary database it creates.

## Existing databases: one-time history rebaseline

The old first three migrations are replaced by
`20261115120000_pre_clerk_baseline`. For an existing database with the old
history, first take a `pg_dump` backup outside the repository. Then run the
combined history update once; it also applies the timestamp renames:

```powershell
$dbUser = (docker compose exec -T backend node -p "new URL(process.env.DATABASE_URL).username").Trim()
$dbName = (docker compose exec -T backend node -p "new URL(process.env.DATABASE_URL).pathname.slice(1)").Trim()
cmd /c "docker compose exec -T postgres psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 < backend\prisma\scripts\rebaseline-existing-db.sql"
```

`rebaseline-existing-db.sql` inserts the SHA-256 checksum of the new baseline
and replaces the old three history entries. It includes the same rename mapping
as `scripts/rename-migrations.sql`; use the combined script above for a database
with the old baseline, not both scripts separately. Afterward, run
`prisma migrate deploy`, `prisma migrate status`, and the Prisma schema diff.

The three archived migrations are in `_archived_migrations/` for reference.
They must not be copied back under `migrations/`.

## Timestamp conversion caveat

`20261120001500_align_soft_delete_timestamp_types` converts these columns from
`timestamptz` to `timestamp(3)` using UTC:

- `annonces_magasins.supprime_le`
- `produits.supprime_le`
- `publications.supprime_le`

Before deploying it to another environment, check the affected row counts and
confirm the UTC interpretation. PostgreSQL rounds values to the nearest
millisecond when converting to `timestamp(3)`:

```sql
SELECT count(supprime_le) FROM annonces_magasins;
SELECT count(supprime_le) FROM produits;
SELECT count(supprime_le) FROM publications;
```
