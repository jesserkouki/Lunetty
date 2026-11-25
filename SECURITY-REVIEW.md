# Phase 1 Shared Eyewear Catalogue - Final Architecture and Security Review

Review date: 2026-11-25

## Issues

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟡 MEDIUM | backend/prisma/migrations/20261210120000_shared_eyewear_catalogue/migration.sql | 75-78 | Variant deletion uses `ON DELETE SET NULL`, allowing variant-specific images to become product-wide images. | 9/10 |
| 2 | 🟡 MEDIUM | backend/prisma/schema.prisma | 686-710 | Shop stock records have no direct foreign keys to a catalogue product or catalogue variant; identity remains a free-text `marque_reference` plus optional store-listing linkage. | 9/10 |
| 3 | 🟡 MEDIUM | backend/src/catalogue/dto/create-catalogue-image.dto.ts | 7-39 | Image URL, source URL, and storage key accept unvalidated strings; licence metadata is also not structured or validated. | 7/10 |
| 4 | ⚪ LOW | backend/prisma/migrations/20261210120000_shared_eyewear_catalogue/migration.sql | 1-78 | The migration is present, but CI explicitly uses `prisma db push` rather than exercising `prisma migrate deploy` for this migration history. | 8/10 |

## Issues fixed

No implementation changes were made during this review. The review was read-only and
preserved the existing working catalogue implementation.

## Architecture findings

### Database relationships

The shared catalogue models are separate from shop inventory and contain products,
variants, and image metadata with cascade deletion for product/variant ownership
and referential integrity for the verifier. The catalogue contains no shop quantities
or prices.

However, existing `Stock` records are not directly linked to `CatalogueProduct` or
`CatalogueProductVariant`. They may reference a store listing variant, but that listing
variant is a shop-specific relation rather than a direct shared-catalogue identity.
This does not currently allow quantity or price sharing, but it does not enforce
catalogue-product identity through a database foreign key.

### Variant deletion and image integrity

Deleting a variant currently sets its image associations to `NULL`. Generic image
queries treat `variantId = NULL` as product-wide, so a deleted variant's image could
be displayed for another variant or for a product-level search.

The safest remediation is one of:

- Delete variant-scoped images transactionally when the variant is deleted.
- Reject variant deletion when variant-scoped images exist.
- Reassign them explicitly only after administrator confirmation.

Using `ON DELETE CASCADE` alone would delete variant-specific assets, but may also
be too destructive without a separate image reconciliation policy.

### Matching

The matching priority is implemented in the requested order:

1. Exact brand + reference + colour.
2. Exact EAN.
3. Exact brand + reference.
4. Normalized brand + normalized reference.
5. Approximate edit-similarity ranking.

Approximate matches are labeled `APPROXIMATE`. A colour match is only produced for
an existing variant with matching normalized colour code or name. Variant-scoped
searches include general product images and the matched variant images, never images
from a different variant.

EAN handling is exact and variant-specific. Normalized identity prevents
punctuation/case differences from producing obvious duplicate products.

### Security

Catalogue administration is protected by JWT authentication and
`PlatformRolesGuard` for `ADMIN` and `SUPER_ADMIN`. Opticians and employees cannot
create, edit, delete, or verify catalogue data through these endpoints.

Image suggestion search requires JWT authentication, active shop membership, and
`inventory.view` permission. It does not return unverified images.

The remaining security gap is not an authorization bypass. It is a deletion and
data-integrity edge case.

### Images

Image records support URLs, storage keys, source URLs, licence text, verification,
primary designation, and verifier identity. No paid provider or scraping behavior
was introduced.

Validation currently limits string lengths but does not enforce URL schemes,
storage-key prefixes, allowed source values, or licence format. A complete
implementation should use typed source/license values and URL validation before
production ingestion.

## Test results

- Prisma schema validation: passed.
- NestJS build: passed.
- Catalogue and authorization unit tests: 17 tests passed across 3 suites.
- Local PostgreSQL migration application: passed.
- Created and verified:
  - `catalogue_products`
  - `catalogue_product_variants`
  - `catalogue_product_images`

## Missing edge-case tests

- Variant deletion and retention/removal of variant-specific images.
- Database migration application and foreign-key behavior.
- E2E JWT coverage for `ADMIN`, `SUPER_ADMIN`, optician, and employee roles.
- E2E active-membership and `inventory.view` rejection.
- Verified-only response enforcement.
- Cross-shop isolation.
- Direct catalogue product/variant foreign-key linkage for shop stock.
- URL/source/storage/licence validation.

## Remaining limitations

- Shop stock is not yet directly linked to catalogue product/variant foreign keys.
- Variant deletion behavior can promote variant images unless explicitly reconciled.
- Image URL and source metadata lack scheme/source/license validation.
- The project migration history is repaired separately from this catalogue migration
  and CI does not deploy migrations, as documented by the existing workflow.
- External image providers and frontend workflows are not implemented.

## Phase 2 readiness

Core Phase 1 catalogue CRUD, matching, authorization, image metadata, and verified
suggestion behavior pass review and testing. Phase 2 should wait until the variant
deletion policy and shop-to-catalogue stock linkage are approved and remediated.
