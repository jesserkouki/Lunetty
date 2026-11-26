#!/usr/bin/env sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$repo_root"

tmp_db="luneti_migration_check_$$"
database_user=$(docker compose exec -T backend node -p "new URL(process.env.DATABASE_URL).username" | tr -d '\r')
scratch_url=$(docker compose exec -T backend node -e "const u=new URL(process.env.DATABASE_URL);u.pathname='/$tmp_db';console.log(u.toString())" | tr -d '\r')
created=0

cleanup() {
  if [ "$created" -eq 1 ]; then
    docker compose exec -T postgres dropdb --if-exists -U "$database_user" "$tmp_db" >/dev/null
  fi
}
trap cleanup EXIT HUP INT TERM

docker compose exec -T postgres createdb -U "$database_user" "$tmp_db"
created=1

docker compose exec -T -e "DATABASE_URL=$scratch_url" backend \
  npx prisma migrate deploy --schema prisma/schema.prisma

docker compose exec -T -e "DATABASE_URL=$scratch_url" backend \
  npx prisma migrate diff \
    --from-url "$scratch_url" \
    --to-schema-datamodel prisma/schema.prisma \
    --exit-code

printf 'Fresh migration deploy and schema diff passed for %s.\n' "$tmp_db"
