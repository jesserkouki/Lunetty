# Platform administration — implementation status

## Delivered

- Added `/admin` as a Super Admin workspace. All admin APIs require
  `SUPER_ADMIN`; normal `ADMIN` and other roles are denied server-side.
  Account lifecycle status remains separate from the platform role.
- Added platform overview metrics and searchable directories for shops,
  clients, opticians, employees, and cross-shop orders. The admin API returns
  safe profile and membership data; password and credential fields are never
  exposed.
- Added per-shop and per-user audit journal filtering, status management, and
  administrator audit records for status and plan changes.
- Added configurable subscription plans with per-shop modules, employee and
  listing caps, and monthly AI-token allowances; administrators can assign
  plans to shops or users.
- Assigned shop plans gate existing store API permission modules and enforce
  employee/listing caps. Shops without an assigned plan keep existing behavior
  for compatibility.
- Added monthly AI request/token reporting for successful Groq reference scans.
  AI allowances warn but do not block requests, as requested. Provider responses
  with no token counts are retained with unknown counts.
- Added a rate-limited click-event API for active shop profiles and active shop
  listings, plus per-shop click summaries.
- Added admin-only advertisement and campaign CRUD, scheduling/status fields,
  internal notes, and impression/click analytics derived from event records.
  Ads are not rendered or served on client-facing pages.
- Added auditable emergency switches for new-shop registration and
  advertisement enablement; disabling shop registration is enforced at shop
  creation.
- Required a reason for plan, account/shop status, campaign, advertisement,
  and emergency-control changes. Audit history has no administrative delete
  endpoint and remains append-only.
- Suspended, paused, draft, or closed shops no longer pass the shared active
  shop authorization check for shop management operations.

## Existing platform limitations

- The client-facing home page currently uses mock shops and products rather
  than real shop/listing IDs. Profile/listing click tracking is wired to the
  relevant home-page actions, but sends events only when real UUID-backed IDs
  are available; mock interactions do not create misleading production data.
- Client subscriptions can be recorded and assigned, but the current API has
  no client feature catalog or client-side AI operation to enforce or measure.
- No payment provider or subscription billing lifecycle exists. Plans and
  assignments are administrator-managed access/limit records, not paid billing
  subscriptions.
- Existing shops are not assigned a plan automatically; an administrator must
  create and assign one before subscription module/employee/listing policies
  apply.
- Shop applications still lack a document-verification workflow, rejection
  history, and owner notifications. Shop status changes are audited, but are
  not a substitute for application review.
- User creation/profile editing, time-series platform analytics, admin
  payment/appointment/social-content directories, suspicious-activity
  detection, and generic business-entity browsing are not yet complete.
- Ad-event tables and reporting are prepared, but no public impression/click
  endpoint exists; totals remain zero until a future trusted tracking
  integration records events.

## Schema and verification

Migrations `20261207120000_admin_console` and
`20261208120000_super_admin_controls` add admin plans/usage/clicks,
advertisement campaigns/creatives/event records, and platform control settings
without dropping existing records.
Application startup does not automatically apply migrations; run
`npx prisma migrate deploy` before using the new admin endpoints in an existing
database.

Related route detail is documented in [API_CHANGES.md](./API_CHANGES.md).