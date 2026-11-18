# API Changes — Optician Backoffice

Base prefix is `/api/v1`; all listed routes require a bearer access token.
All access is additionally scoped to the `storeId` in the path. Supplying a
different store ID does not grant access.

## Platform administration

The Super Admin console is available at `/admin`. Every `/admin/*` endpoint
requires an active `SUPER_ADMIN` bearer account; ordinary `ADMIN` accounts are
denied by the backend guard. Account status remains the separate
`ACTIVE` / `SUSPENDED` lifecycle field. Mutating status, plan, campaign,
advertisement, and emergency-control requests require a reason recorded in the
append-only audit journal.

- `GET /admin/overview` returns aggregate client, optician, shop, employee,
  order, click, monthly AI-token, and audit-event totals.
- `GET /admin/stores?page=&limit=&search=` lists non-deleted shops, active
  owners, employee/listing/order totals, click totals, AI tokens, and assigned
  plans.
- `GET /admin/users?page=&limit=&search=&kind=clients|opticians|employees`
  lists account status, shop memberships, orders, plan assignment, and AI
  usage. Password hashes and credential fields are never selected.
- `GET /admin/orders?page=&limit=&search=` lists cross-shop order summaries.
- `GET /admin/audit-logs?page=&limit=&type_entite=&acteur_id=&magasin_id=&utilisateur_id=&entite_id=`
  returns audit identity, action/entity, before/after snapshots, reason, and
  timestamp.
- `GET /admin/clicks` and `GET /admin/ai-usage` show per-shop click categories
  and current-month AI usage by shop and user.
- `GET|POST /admin/plans`, `PATCH /admin/plans/:planId`,
  `PUT|DELETE /admin/stores/:storeId/plan`, and
  `PUT|DELETE /admin/users/:userId/plan` manage feature modules,
  employee/listing caps, monthly AI-token allowances, and plan assignments.
- `PATCH /admin/stores/:storeId/status` and
  `PATCH /admin/users/:userId/status` change existing platform lifecycle
  statuses. These changes are audit-recorded.
- `POST /analytics/clicks` accepts `{ storeId, type, listingId? }`, where type
  is `STORE_PROFILE` or `STORE_LISTING`. It validates active shop/listing
  ownership and is rate-limited. No historic click records are fabricated.
- `GET|POST /admin/advertisements`, `PATCH /admin/advertisements/:id`
  manage ad creatives; setting status to `ARCHIVED` archives rather than
  deleting the creative.
- `GET|POST /admin/advertisement-campaigns`,
  `PATCH /admin/advertisement-campaigns/:id` manage campaign metadata,
  targeting, schedule, budget, status, and internal notes.
- `GET|PATCH /admin/platform-controls` reads and updates the shop-registration
  and advertisement-enable emergency switches. Disabling shop registrations
  is enforced by shop creation. Ads are not rendered or served to customers.
- Ad impression and click totals are derived only from persisted event rows.
  No public ad tracking endpoint or client ad placement is enabled.

An assigned shop plan gates the existing store API permission modules and
enforces employee/listing caps. Stores with no assigned plan retain their
current behavior for compatibility. AI-token allowances are warning-only:
successful Groq reference scans are recorded from provider-reported token
usage, and the admin UI flags over-limit usage without blocking requests.
If the provider omits token counts, the request is recorded but exact token
usage remains unknown. Client plan assignments and AI allowances are
administrative records; there is no separate client feature catalog or
client-side AI operation in the current API to enforce/measure.

The current platform schema does not capture shop verification documents or
reported-content cases. The shop status endpoint can activate, pause, suspend,
or close a shop with an audit reason, but it does not yet implement a separate
application review/notification workflow. Platform-wide analytics charts,
payment and appointment admin directories, and general-purpose database
record browsing are not provided; financial records remain read-only through
their existing APIs.

## Dashboard

- `GET /stores/:storeId/dashboard`
- Query: `range=today|7d|30d|3m|12m|custom`; custom requires ISO `from` and `to`.
- Requires active store membership; owners bypass granular permissions.
- Returns selected-period gross paid revenue and successfully processed
  refunds separately (plus net cash flow), counts for pending/refunded payments, status
  totals and recent orders, stock/on-hand and low/out counts, recent movements,
  employee counts/invitations, and recent store audit entries. Revenue remains
  grouped by currency. `sales_trend` is a dated, currency-specific series.
- Employees require `dashboard.view`; finance values/trends are included only
  with `dashboard.view_financials`. Each dashboard module is omitted unless its
  matching module permission is granted.

## Employees / memberships

Existing membership routes are reused:

- `GET|POST /stores/:storeId/members`
- `PATCH|DELETE /stores/:storeId/members/:memberId`
- Access is controlled by `employees.view`, `employees.create`,
  `employees.update`, and `employees.remove`; owner-only restrictions continue
  to protect manager assignment and ownership.
- `POST` creates a new employee account and active store membership in one
  transaction. It accepts `{ prenom, nom, email, temporaryPassword, role,
  preset, overrides }`. The owner chooses a temporary password of at least
  twelve characters; the employee must change it before any other authenticated
  API operation. The preset defaults to `read_only`; individual allow/deny
  overrides are saved with the account and audit event.
- `GET /stores/:storeId/permissions/catalog`
- `GET /stores/:storeId/members/:memberId/permissions`
- `PUT /stores/:storeId/members/:memberId/permissions` with
  `{ "preset": "custom", "overrides": [{ "code": "inventory.adjust_stock",
  "allowed": true }] }`. Only owners and managers explicitly granted
  `employees.manage_permissions` can use the member endpoints. Managers may
  delegate only permissions in their own current effective set.
- `GET /employee/me` and `GET /employee/stores` return only active memberships
  and their effective per-store permission sets.

Existing pending invitations remain readable and can still be accepted, but
new employees are created directly by the owner. Email delivery is not
configured.

## Orders

- `GET /stores/:storeId/orders?page=&limit=&status=&from=&to=&search=`
- `GET /stores/:storeId/orders/:orderId`
- `PATCH /stores/:storeId/orders/:orderId/status` with `{ "status": "...",
  "note": "optional reason" }`
- Requires `orders.view` to read. Status changes require `orders.accept`,
  `orders.update_status`, or `orders.cancel` as applicable. All list/detail
  queries include the store ID; delivery address snapshots require
  `customers.view_address`.
- Status changes are transactionally checked and create order-status-history
  and audit records. Only documented forward transitions are accepted.
  Cancellation is allowed only for unpaid orders, and releases reservations
  within the same transaction. The API does not mark payments as successful.

## Transactions

- `GET /stores/:storeId/transactions?page=&limit=&from=&to=&status=&provider=&search=`
- Requires `transactions.view`; refund details additionally require
  `transactions.view_refunds`. Read-only. Returns persisted payment records and
  associated order/customer summary plus refund details/amounts. Provider
  payloads, checkout URLs, and idempotency keys are not exposed.

The existing application does not currently configure provider checkout,
verified webhooks, or refund processing. This endpoint does not simulate any
payment state.

## Activity History

- `GET /stores/:storeId/activity?page=&limit=&from=&to=&actorId=&action=&entityType=&search=`
- `GET /stores/:storeId/activity/:activityId`
- Requires `activity.view_all` or `activity.view_own`. The latter is forced to
  the authenticated actor regardless of supplied actor filters. Results are
  store-scoped, chronological, and paginated.
- Events expose actor identity snapshot, action/entity, description, before and
  after values, reason, metadata, and UTC timestamp. Normal application
  operations cannot update or delete these rows; PostgreSQL enforces this with
  a trigger.

## Store profile / settings

- Existing `PATCH /stores/:storeId` now accepts existing schema fields for logo,
  cover image, timezone, and currency in addition to the prior name, slug,
  description, email, phone, and website fields.
- Successful store profile updates are audit-recorded transactionally.
- Read and update require `shop.view` and `shop.update`.
- No schema changes were made for opening hours or social links because those
  fields do not exist in the current data model.

## Inventory and listing audit

Existing inventory operations retain their routes. Each new stock record with
initial quantity receives an initial movement record. Movement records now
include before/after available and reserved quantities; matching audit events
are written in the stock transaction. Reorder-threshold changes are audited.
Store listing creation, publication/status changes, variant/availability
changes, and price changes also generate audit events.
Inventory reads/changes require the matching `inventory.view`, `inventory.create`,
`inventory.update`, `inventory.adjust_stock`, `inventory.view_history`, or
`inventory.manage_locations` permission. Store-listing mutations require
`shop.manage_products`. Appointment operations require `appointments.view`,
`appointments.update`, or `appointments.cancel`; appointment customer email
is hidden without `customers.view_contact`.

See [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for the full
API catalog and known unsupported integrations.
