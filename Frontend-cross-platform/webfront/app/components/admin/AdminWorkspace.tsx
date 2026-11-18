"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  Eye,
  LayoutDashboard,
  LoaderCircle,
  Megaphone,
  MousePointerClick,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Settings2,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  adminService,
  type AdminAiUsage,
  type AdminAuditEvent,
  type AdminAdvertisement,
  type AdminCampaign,
  type AdminClickSummary,
  type AdminOrder,
  type AdminPlan,
  type AdminPlatformControls,
  type AdminStore,
  type AdminUser,
} from "@/services/admin.service";
import { ApiError } from "@/services/api";

type Section =
  | "overview"
  | "shops"
  | "people"
  | "orders"
  | "activity"
  | "usage"
  | "plans"
  | "advertisements"
  | "campaigns"
  | "controls";

const MODULES = [
  ["dashboard", "Dashboard"],
  ["inventory", "Inventory"],
  ["orders", "Orders"],
  ["customers", "Customers"],
  ["employees", "Employees"],
  ["transactions", "Transactions"],
  ["shop", "Shop"],
  ["activity", "Activity history"],
  ["appointments", "Appointments"],
] as const;

const STORE_STATUSES = [
  ["ACTIVE", "Active"],
  ["BROUILLON", "Draft"],
  ["EN_PAUSE", "Paused"],
  ["SUSPENDU", "Suspended"],
  ["FERME", "Closed"],
] as const;
const USER_STATUSES = [
  ["ACTIVE", "Active"],
  ["EN_ATTENTE_VERIFICATION", "Pending verification"],
  ["SUSPENDU", "Suspended"],
  ["DESACTIVE", "Deactivated"],
] as const;
const adStatuses = ["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"];

const navigation: Array<{
  id: Section;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "shops", label: "Shops", icon: Store },
  { id: "people", label: "People", icon: Users },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "activity", label: "Audit journal", icon: Activity },
  { id: "usage", label: "Clicks & AI", icon: BarChart3 },
  { id: "plans", label: "Subscriptions", icon: ShieldCheck },
  { id: "advertisements", label: "Advertisements", icon: Megaphone },
  { id: "campaigns", label: "Ad campaigns", icon: BarChart3 },
  { id: "controls", label: "Emergency controls", icon: Settings2 },
];

type PlanDraft = {
  id?: string;
  code: string;
  name: string;
  description: string;
  modules: string[];
  maxEmployees: string;
  maxListings: string;
  monthlyAiTokens: string;
  active: boolean;
  reason: string;
};

const emptyPlan: PlanDraft = {
  code: "",
  name: "",
  description: "",
  modules: [],
  maxEmployees: "",
  maxListings: "",
  monthlyAiTokens: "",
  active: true,
  reason: "",
};

type AdvertisementDraft = {
  id?: string;
  campaignId: string;
  title: string;
  description: string;
  imageUrl: string;
  destinationUrl: string;
  advertiser: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  internalNotes: string;
  reason: string;
};

type CampaignDraft = {
  id?: string;
  name: string;
  status: string;
  targetAudience: string;
  targetLocation: string;
  startsAt: string;
  endsAt: string;
  budget: string;
  internalNotes: string;
  reason: string;
};

export function AdminWorkspace() {
  const { user, status, signOut } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [clicks, setClicks] = useState<AdminClickSummary[]>([]);
  const [usage, setUsage] = useState<AdminAiUsage | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [advertisements, setAdvertisements] = useState<AdminAdvertisement[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [controls, setControls] = useState<AdminPlatformControls | null>(null);
  const [audit, setAudit] = useState<AdminAuditEvent[]>([]);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [userKind, setUserKind] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [planDraft, setPlanDraft] = useState<PlanDraft | null>(null);
  const [advertisementDraft, setAdvertisementDraft] = useState<AdvertisementDraft | null>(null);
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft | null>(null);
  const [controlsReason, setControlsReason] = useState("");

  const fetchData = useCallback(async () => {
    const [
      metrics, storePage, userPage, orderPage, clickPage, ai, planRows,
      auditPage, advertisements, campaigns, controls,
    ] =
      await Promise.all([
        adminService.overview(),
        adminService.stores(search),
        adminService.users(search, userKind || undefined),
        adminService.orders(search),
        adminService.clicks(search),
        adminService.aiUsage(),
        adminService.plans(),
        adminService.audit({
          ...(entityFilter ? { entite_id: entityFilter } : {}),
          ...(storeFilter ? { magasin_id: storeFilter } : {}),
          ...(userFilter ? { utilisateur_id: userFilter } : {}),
        }),
        adminService.advertisements(),
        adminService.campaigns(),
        adminService.platformControls(),
      ]);
    return {
      metrics,
      stores: storePage.data,
      users: userPage.data,
      orders: orderPage.data,
      clicks: clickPage.data,
      ai,
      plans: planRows,
      audit: auditPage.data,
      advertisements,
      campaigns,
      controls,
    };
  }, [entityFilter, search, storeFilter, userFilter, userKind]);

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchData>>) => {
    setOverview(data.metrics);
    setStores(data.stores);
    setUsers(data.users);
    setOrders(data.orders);
    setClicks(data.clicks);
    setUsage(data.ai);
    setPlans(data.plans);
    setAudit(data.audit);
    setAdvertisements(data.advertisements);
    setCampaigns(data.campaigns);
    setControls(data.controls);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      applyData(await fetchData());
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load admin data. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyData, fetchData]);

  useEffect(() => {
    if (status === "authenticated" && isSuperAdmin(user?.role)) {
      fetchData()
        .then(applyData)
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Unable to load admin data. Please retry.",
          );
        })
        .finally(() => setLoading(false));
    }
  }, [applyData, fetchData, status, user?.role]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchText.trim());
  };

  const showError = (reason: unknown) => {
    setError(
      reason instanceof ApiError
        ? reason.message
        : "The action could not be completed.",
    );
    setNotice("");
  };

  const runAction = async (action: (reason: string) => Promise<unknown>, message: string) => {
    const reason = window.prompt("Provide a reason for this administrative action:");
    if (!reason?.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action(reason.trim());
      setNotice(message);
      await loadData();
    } catch (reason) {
      showError(reason);
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planDraft) return;
    const payload = {
      code: planDraft.code,
      name: planDraft.name,
      description: planDraft.description || null,
      modules: planDraft.modules,
      maxEmployees: parseOptionalLimit(planDraft.maxEmployees),
      maxListings: parseOptionalLimit(planDraft.maxListings),
      monthlyAiTokens: parseOptionalLimit(planDraft.monthlyAiTokens),
      active: planDraft.active,
      reason: planDraft.reason.trim(),
    };
    if (payload.reason.length < 3) {
      setError("Enter a reason of at least 3 characters for this plan change.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (planDraft.id) {
        await adminService.updatePlan(planDraft.id, payload);
      } else {
        await adminService.createPlan(payload);
      }
      setPlanDraft(null);
      setNotice(planDraft.id ? "Plan updated." : "Plan created.");
      await loadData();
    } catch (reason) {
      showError(reason);
    } finally {
      setSaving(false);
    }
  };

  const saveAdvertisement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!advertisementDraft) return;
    const draft = advertisementDraft;
    const payload = {
      campaignId: draft.campaignId || null,
      title: draft.title.trim(),
      description: draft.description || null,
      imageUrl: draft.imageUrl || null,
      destinationUrl: draft.destinationUrl.trim(),
      advertiser: draft.advertiser.trim(),
      type: draft.type,
      status: draft.status,
      startsAt: dateToIso(draft.startsAt),
      endsAt: dateToIso(draft.endsAt),
      internalNotes: draft.internalNotes || null,
      reason: draft.reason.trim(),
    };
    if (payload.reason.length < 3) {
      setError("Enter a reason of at least 3 characters for this ad change.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (draft.id) await adminService.updateAdvertisement(draft.id, payload);
      else await adminService.createAdvertisement(payload);
      setAdvertisementDraft(null);
      setNotice(draft.id ? "Advertisement updated." : "Advertisement created.");
      await loadData();
    } catch (reason) {
      showError(reason);
    } finally {
      setSaving(false);
    }
  };

  const saveCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaignDraft) return;
    const draft = campaignDraft;
    const payload = {
      name: draft.name.trim(),
      status: draft.status,
      targetAudience: draft.targetAudience || null,
      targetLocation: draft.targetLocation || null,
      startsAt: dateToIso(draft.startsAt),
      endsAt: dateToIso(draft.endsAt),
      budget: draft.budget.trim() ? Number(draft.budget) : null,
      internalNotes: draft.internalNotes || null,
      reason: draft.reason.trim(),
    };
    if (payload.reason.length < 3) {
      setError("Enter a reason of at least 3 characters for this campaign change.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (draft.id) await adminService.updateCampaign(draft.id, payload);
      else await adminService.createCampaign(payload);
      setCampaignDraft(null);
      setNotice(draft.id ? "Campaign updated." : "Campaign created.");
      await loadData();
    } catch (reason) {
      showError(reason);
    } finally {
      setSaving(false);
    }
  };

  const saveControls = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!controls || controlsReason.trim().length < 3) {
      setError("Enter a reason of at least 3 characters for emergency-control changes.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminService.updatePlatformControls({
        storeRegistrationsEnabled: controls.inscriptions_magasins,
        advertisementsEnabled: controls.publicites_activees,
        reason: controlsReason.trim(),
      });
      setControlsReason("");
      setNotice("Emergency controls updated.");
      await loadData();
    } catch (reason) {
      showError(reason);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return <AdminLoading />;
  }
  if (!user || status !== "authenticated") {
    return (
      <AdminGate
        title="Sign in required"
        detail="Sign in with an administrator account to open the platform console."
      />
    );
  }
  if (!isSuperAdmin(user.role)) {
    return (
      <AdminGate
        title="Super Admin access only"
        detail="Only accounts with the SUPER_ADMIN platform role can access this dashboard."
      />
    );
  }

  const pageTitle =
    navigation.find((item) => item.id === section)?.label ?? "Overview";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          <span className="admin-brand-mark">L</span>
          <span>
            <strong>LUNETTY</strong>
            <small>SUPER ADMIN</small>
          </span>
        </Link>
        <div className="admin-sidebar-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin sections">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-nav-item ${section === id ? "is-active" : ""}`}
              onClick={() => setSection(id)}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-user">
          <span className="admin-avatar">{user.prenom?.slice(0, 1) ?? "A"}</span>
          <span className="admin-sidebar-user-copy">
            <strong>{user.prenom} {user.nom}</strong>
            <small>Super administrator</small>
          </span>
          <button type="button" className="admin-logout" onClick={signOut} title="Sign out">
            <X size={16} />
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-breadcrumb">Lunetty / Administration</div>
            <h1>{pageTitle}</h1>
          </div>
          <div className="admin-topbar-actions">
            <form className="admin-search" onSubmit={submitSearch}>
              <Search size={16} aria-hidden="true" />
              <input
                aria-label="Search shops, people, or orders"
                placeholder="Search platform"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <button type="submit">Search</button>
            </form>
            <span className="admin-role-pill"><ShieldCheck size={14} /> SUPER ADMIN</span>
          </div>
        </header>

        {(error || notice) && (
          <div className={`admin-message ${error ? "is-error" : "is-success"}`} role="status">
            <span>{error || notice}</span>
            {error && <button type="button" onClick={() => void loadData()}>Retry</button>}
          </div>
        )}

        {loading && <div className="admin-loading-line"><LoaderCircle size={15} /> Refreshing data…</div>}

        {section === "overview" && overview && (
          <OverviewSection
            overview={overview}
            stores={stores.slice(0, 5)}
            onNavigate={setSection}
            onViewShop={(id) => {
              setStoreFilter(id);
              setUserFilter("");
              setEntityFilter("");
              setSection("activity");
            }}
          />
        )}
        {section === "shops" && (
          <ShopsSection
            stores={stores}
            plans={plans}
            saving={saving}
            onAssignPlan={(storeId, planId) =>
              void runAction(
              (reason) =>
                  planId
                  ? adminService.assignStorePlan(storeId, planId, reason)
                  : adminService.removeStorePlan(storeId, reason),
                "Shop subscription updated.",
              )
            }
            onChangeStatus={(storeId, nextStatus) =>
              void runAction(
              (reason) => adminService.updateStoreStatus(storeId, nextStatus, reason),
                "Shop status updated.",
              )
            }
            onViewActivity={(id) => {
              setStoreFilter(id);
              setUserFilter("");
              setEntityFilter("");
              setSection("activity");
            }}
          />
        )}
        {section === "people" && (
          <PeopleSection
            users={users}
            plans={plans}
            kind={userKind}
            onChangeKind={setUserKind}
            saving={saving}
            onAssignPlan={(id, planId) =>
              void runAction(
                (reason) =>
                  planId
                    ? adminService.assignUserPlan(id, planId, reason)
                    : adminService.removeUserPlan(id, reason),
                "User subscription updated.",
              )
            }
            onChangeStatus={(id, nextStatus) =>
              void runAction(
                (reason) => adminService.updateUserStatus(id, nextStatus, reason),
                "User status updated.",
              )
            }
            onViewActivity={(id) => {
              setUserFilter(id);
              setStoreFilter("");
              setEntityFilter("");
              setSection("activity");
            }}
          />
        )}
        {section === "orders" && <OrdersSection orders={orders} />}
        {section === "activity" && (
          <ActivitySection
            audit={audit}
            storeFilter={storeFilter}
            userFilter={userFilter}
            entityFilter={entityFilter}
            onStoreFilterChange={(value) => {
              setStoreFilter(value);
              if (value) setUserFilter("");
            }}
            onUserFilterChange={(value) => {
              setUserFilter(value);
              if (value) setStoreFilter("");
            }}
            onEntityFilterChange={setEntityFilter}
            onSubmit={() => void loadData()}
          />
        )}
        {section === "usage" && <UsageSection clicks={clicks} usage={usage} />}
        {section === "plans" && (
          <PlansSection
            plans={plans}
            onCreate={() => setPlanDraft({ ...emptyPlan })}
            onEdit={(plan) => setPlanDraft(toPlanDraft(plan))}
            onToggle={(plan) =>
              void runAction(
                (reason) =>
                  adminService.updatePlan(plan.id, {
                    code: plan.code,
                    name: plan.nom,
                    description: plan.description,
                    modules: plan.modules,
                    maxEmployees: plan.max_employes,
                    maxListings: plan.max_annonces,
                    monthlyAiTokens: plan.tokens_ia_mensuels,
                    active: !plan.actif,
                    reason,
                  }),
                `Plan ${plan.actif ? "disabled" : "enabled"}.`,
              )
            }
          />
        )}
        {section === "advertisements" && (
          <AdvertisementsSection
            advertisements={advertisements}
            campaigns={campaigns}
            onCreate={() =>
              setAdvertisementDraft({
                campaignId: "",
                title: "",
                description: "",
                imageUrl: "",
                destinationUrl: "",
                advertiser: "",
                type: "BANNER",
                status: "DRAFT",
                startsAt: "",
                endsAt: "",
                internalNotes: "",
                reason: "",
              })
            }
            onEdit={(ad) => setAdvertisementDraft(toAdvertisementDraft(ad))}
          />
        )}
        {section === "campaigns" && (
          <CampaignsSection
            campaigns={campaigns}
            onCreate={() =>
              setCampaignDraft({
                name: "",
                status: "DRAFT",
                targetAudience: "",
                targetLocation: "",
                startsAt: "",
                endsAt: "",
                budget: "",
                internalNotes: "",
                reason: "",
              })
            }
            onEdit={(campaign) => setCampaignDraft(toCampaignDraft(campaign))}
          />
        )}
        {section === "controls" && controls && (
          <PlatformControlsSection
            controls={controls}
            reason={controlsReason}
            saving={saving}
            onReasonChange={setControlsReason}
            onChange={(patch) => setControls({ ...controls, ...patch })}
            onSubmit={saveControls}
          />
        )}
      </main>

      {planDraft && (
        <PlanModal
          draft={planDraft}
          saving={saving}
          onChange={setPlanDraft}
          onClose={() => setPlanDraft(null)}
          onSubmit={savePlan}
        />
      )}
      {advertisementDraft && (
        <AdvertisementModal
          draft={advertisementDraft}
          campaigns={campaigns}
          saving={saving}
          onChange={setAdvertisementDraft}
          onClose={() => setAdvertisementDraft(null)}
          onSubmit={saveAdvertisement}
        />
      )}
      {campaignDraft && (
        <CampaignModal
          draft={campaignDraft}
          saving={saving}
          onChange={setCampaignDraft}
          onClose={() => setCampaignDraft(null)}
          onSubmit={saveCampaign}
        />
      )}
    </div>
  );
}

function OverviewSection({
  overview,
  stores,
  onNavigate,
  onViewShop,
}: {
  overview: Record<string, number>;
  stores: AdminStore[];
  onNavigate: (section: Section) => void;
  onViewShop: (id: string) => void;
}) {
  const cards = [
    { label: "Clients", value: overview.clients, icon: Users, tone: "gold" },
    { label: "Opticians", value: overview.opticians, icon: Store, tone: "blue" },
    { label: "Shops", value: overview.stores, icon: Building2, tone: "violet" },
    { label: "Employees", value: overview.employees, icon: ShieldCheck, tone: "green" },
    { label: "Orders", value: overview.orders, icon: ClipboardList, tone: "orange" },
    { label: "Clicks", value: overview.clicks, icon: MousePointerClick, tone: "pink" },
    { label: "AI tokens this month", value: overview.aiTokensThisMonth, icon: Sparkles, tone: "purple" },
    { label: "Audit events", value: overview.auditEvents, icon: Activity, tone: "slate" },
  ];
  return (
    <div className="admin-content">
      <div className="admin-welcome">
        <div>
          <span className="admin-eyebrow">PLATFORM OVERVIEW</span>
          <h2>One view across your optical network.</h2>
          <p>Monitor shops, teams, customer activity, orders, and subscription usage.</p>
        </div>
        <div className="admin-welcome-icon"><BarChart3 size={27} /></div>
      </div>
      <div className="admin-stat-grid">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div className="admin-stat-card" key={label}>
            <span className={`admin-stat-icon tone-${tone}`}><Icon size={18} /></span>
            <span className="admin-stat-label">{label}</span>
            <strong>{formatNumber(value ?? 0)}</strong>
          </div>
        ))}
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><h3>Recently added shops</h3><p>Latest active platform accounts</p></div>
          <button className="admin-text-button" type="button" onClick={() => onNavigate("shops")}>View all <Eye size={14} /></button>
        </div>
        {stores.length === 0 ? <EmptyState text="No shops have been created yet." /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Shop</th><th>Owner</th><th>Team</th><th>Orders</th><th>Plan</th><th>Status</th><th /></tr></thead>
              <tbody>{stores.map((shop) => (
                <tr key={shop.id}>
                  <td><strong>{shop.nom}</strong><small>/{shop.slug}</small></td>
                  <td>{shop.owner?.prenom ?? "—"} {shop.owner?.nom ?? ""}</td>
                  <td>{formatNumber(shop.employees)}</td>
                  <td>{formatNumber(shop.orders)}</td>
                  <td>{shop.plan?.nom ?? <span className="admin-muted">No plan</span>}</td>
                  <td><StatusBadge value={shop.statut} /></td>
                  <td><button className="admin-icon-button" type="button" title="View shop activity" onClick={() => onViewShop(shop.id)}><Activity size={15} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ShopsSection({
  stores,
  plans,
  saving,
  onAssignPlan,
  onChangeStatus,
  onViewActivity,
}: {
  stores: AdminStore[];
  plans: AdminPlan[];
  saving: boolean;
  onAssignPlan: (storeId: string, planId: string) => void;
  onChangeStatus: (storeId: string, status: string) => void;
  onViewActivity: (id: string) => void;
}) {
  return (
    <div className="admin-content">
      <SectionIntro title="Shop directory" detail={`${stores.length} shops in this view. Select a plan or update a shop’s platform status.`} />
      <div className="admin-panel">
        {stores.length === 0 ? <EmptyState text="No shops match your search." /> : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-wide-table">
              <thead><tr><th>Shop & owner</th><th>Team</th><th>Listings</th><th>Orders</th><th>Clicks</th><th>AI tokens</th><th>Subscription</th><th>Status</th><th>Journal</th></tr></thead>
              <tbody>{stores.map((shop) => (
                <tr key={shop.id}>
                  <td><strong>{shop.nom}</strong><small>{shop.owner?.email ?? shop.email ?? shop.slug}</small></td>
                  <td>{formatNumber(shop.employees)}</td>
                  <td>{formatNumber(shop.listings)}</td>
                  <td>{formatNumber(shop.orders)}</td>
                  <td>{formatNumber(shop.clicks)}</td>
                  <td>{formatNumber(shop.aiTokens)}</td>
                  <td>
                    <select
                      aria-label={`Subscription plan for ${shop.nom}`}
                      value={shop.plan?.id ?? ""}
                      disabled={saving}
                      onChange={(event) => onAssignPlan(shop.id, event.target.value)}
                    >
                      <option value="">No plan assigned</option>
                      {plans.filter((plan) => plan.actif).map((plan) => <option value={plan.id} key={plan.id}>{plan.nom}</option>)}
                    </select>
                  </td>
                  <td><select aria-label={`Status for ${shop.nom}`} value={shop.statut} disabled={saving} onChange={(event) => onChangeStatus(shop.id, event.target.value)}>{STORE_STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
                  <td><button className="admin-icon-button" type="button" title="Shop audit journal" onClick={() => onViewActivity(shop.id)}><Activity size={15} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PeopleSection({
  users,
  plans,
  kind,
  onChangeKind,
  saving,
  onAssignPlan,
  onChangeStatus,
  onViewActivity,
}: {
  users: AdminUser[];
  plans: AdminPlan[];
  kind: string;
  onChangeKind: (value: string) => void;
  saving: boolean;
  onAssignPlan: (id: string, planId: string) => void;
  onChangeStatus: (id: string, status: string) => void;
  onViewActivity: (id: string) => void;
}) {
  return (
    <div className="admin-content">
      <SectionIntro title="People & access" detail="Review client and optician accounts, shop memberships, status, plans, and AI usage." />
      <div className="admin-filter-row">
        <label className="admin-field-label">Account type
          <select value={kind} onChange={(event) => onChangeKind(event.target.value)}>
            <option value="">All people</option>
            <option value="clients">Clients</option>
            <option value="opticians">Opticians</option>
            <option value="employees">Employees</option>
          </select>
        </label>
      </div>
      <div className="admin-panel">
        {users.length === 0 ? <EmptyState text="No people match the selected filters." /> : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-wide-table">
              <thead><tr><th>Person</th><th>Account</th><th>Shop memberships</th><th>Orders</th><th>AI tokens</th><th>Subscription</th><th>Status</th><th>Journal</th></tr></thead>
              <tbody>{users.map((person) => (
                <tr key={person.id}>
                  <td><strong>{person.prenom} {person.nom}</strong><small>{person.email}</small></td>
                  <td>{person.profil_opticien ? "Optician" : person.profil_client ? "Client" : "Platform account"}</td>
                  <td>{person.adhesions.length ? person.adhesions.map((membership) => `${membership.magasin.nom} · ${membership.role}`).join(", ") : "—"}</td>
                  <td>{formatNumber(person.orders)}</td>
                  <td>{formatNumber(person.aiTokens)}</td>
                  <td>
                    <select
                      aria-label={`Subscription plan for ${person.prenom} ${person.nom}`}
                      value={person.plan?.id ?? ""}
                      disabled={saving}
                      onChange={(event) => onAssignPlan(person.id, event.target.value)}
                    >
                      <option value="">No plan assigned</option>
                      {plans.filter((plan) => plan.actif).map((plan) => <option value={plan.id} key={plan.id}>{plan.nom}</option>)}
                    </select>
                  </td>
                  <td><select aria-label={`Status for ${person.email}`} value={person.statut} disabled={saving} onChange={(event) => onChangeStatus(person.id, event.target.value)}>{USER_STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
                  <td><button className="admin-icon-button" type="button" title="User audit journal" onClick={() => onViewActivity(person.id)}><Activity size={15} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersSection({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="admin-content">
      <SectionIntro title="Platform orders" detail="Cross-shop order visibility with customer, shop, total, and current status." />
      <div className="admin-panel">
        {orders.length === 0 ? <EmptyState text="No orders match your search." /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Shop</th><th>Customer</th><th>Total</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>{orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>#{order.numero_commande}</strong></td>
                  <td>{order.magasin.nom}</td>
                  <td>{order.utilisateur.prenom} {order.utilisateur.nom}<small>{order.utilisateur.email}</small></td>
                  <td>{formatMoney(order.total_general, order.devise)}</td>
                  <td><StatusBadge value={order.statut} /></td>
                  <td>{formatDate(order.cree_le)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivitySection({
  audit,
  storeFilter,
  userFilter,
  entityFilter,
  onStoreFilterChange,
  onUserFilterChange,
  onEntityFilterChange,
  onSubmit,
}: {
  audit: AdminAuditEvent[];
  storeFilter: string;
  userFilter: string;
  entityFilter: string;
  onStoreFilterChange: (value: string) => void;
  onUserFilterChange: (value: string) => void;
  onEntityFilterChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="admin-content">
      <SectionIntro title="Audit journal" detail="Immutable audit history across shops and platform-managed accounts." />
      <form className="admin-journal-filter" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <div className="admin-journal-fields">
          <label>Shop ID<input value={storeFilter} onChange={(event) => onStoreFilterChange(event.target.value)} placeholder="Filter by shop" /></label>
          <label>User ID<input value={userFilter} onChange={(event) => onUserFilterChange(event.target.value)} placeholder="Filter actions by or about user" /></label>
          <label>Entity ID<input value={entityFilter} onChange={(event) => onEntityFilterChange(event.target.value)} placeholder="Filter by entity" /></label>
          <button className="admin-button admin-button-dark" type="submit"><Search size={15} /> Filter journal</button>
        </div>
      </form>
      <div className="admin-panel">
        {audit.length === 0 ? <EmptyState text="No audit events match this filter." /> : (
          <div className="admin-audit-list">
            {audit.map((event) => (
              <article className="admin-audit-row" key={event.id}>
                <span className="admin-audit-icon"><Activity size={16} /></span>
                <div className="admin-audit-copy">
                  <div><strong>{event.description || event.action}</strong><span className="admin-audit-action">{event.action}</span></div>
                  <p>{event.acteur_identite || "System"} · {event.type_entite}{event.entite_id ? ` · ${event.entite_id}` : ""}{event.magasin_id ? ` · shop ${event.magasin_id}` : ""}</p>
                  {event.raison && <p>Reason: {event.raison}</p>}
                </div>
                <time>{formatDate(event.cree_le)}</time>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsageSection({
  clicks,
  usage,
}: {
  clicks: AdminClickSummary[];
  usage: AdminAiUsage | null;
}) {
  return (
    <div className="admin-content">
      <SectionIntro title="Clicks & AI usage" detail="Monthly AI token usage is reported from provider responses; over-limit usage is flagged, not blocked." />
      <div className="admin-usage-cards">
        <div className="admin-usage-summary"><MousePointerClick size={20} /><span>Total recorded clicks</span><strong>{formatNumber(clicks.reduce((sum, item) => sum + item.profileClicks + item.listingClicks, 0))}</strong><small>Shop profiles + product listings</small></div>
        <div className="admin-usage-summary"><Sparkles size={20} /><span>AI tokens this month</span>        <strong>{formatNumber([...(usage?.stores ?? []), ...(usage?.users ?? [])].reduce((sum, item) => sum + item.tokens, 0))}</strong><small>{usage?.month ? `Since ${formatDate(usage.month)}` : "No usage recorded"}</small></div>
      </div>
      <div className="admin-two-column">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><h3>Shop clicks</h3><p>Profile and listing activity</p></div></div>
          {clicks.length === 0 ? <EmptyState text="No click events have been recorded yet." /> : (
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Shop</th><th>Profile</th><th>Listings</th><th>Total</th></tr></thead><tbody>
              {clicks.map((row) => <tr key={row.magasin_id}><td><strong>{row.store?.nom ?? "Deleted shop"}</strong><small>{row.store?.slug ?? row.magasin_id}</small></td><td>{formatNumber(row.profileClicks)}</td><td>{formatNumber(row.listingClicks)}</td><td>{formatNumber(row.profileClicks + row.listingClicks)}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><h3>AI usage by shop</h3><p>Allowance warnings do not block requests</p></div></div>
          {!usage?.stores.length ? <EmptyState text="No provider token usage is available for this month." /> : (
            <div className="admin-usage-list">{usage.stores.map((row) => <UsageRow key={row.id ?? row.name} name={row.name} tokens={row.tokens} requests={row.requests} limit={row.limit} overLimit={row.overLimit} />)}</div>
          )}
        </section>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><h3>AI usage by user</h3><p>Includes the account that initiated a shop AI request; no client-side AI calls currently exist.</p></div></div>
        {!usage?.users.length ? <EmptyState text="No per-user AI usage is available for this month." /> : (
          <div className="admin-usage-list">{usage.users.map((row) => <UsageRow key={row.id ?? row.name} name={row.name} detail={row.email ?? undefined} tokens={row.tokens} requests={row.requests} limit={row.limit} overLimit={row.overLimit} />)}</div>
        )}
      </section>
    </div>
  );
}

function UsageRow({
  name,
  detail,
  tokens,
  requests,
  limit,
  overLimit,
}: {
  name: string;
  detail?: string;
  tokens: number;
  requests: number;
  limit: number | null;
  overLimit: boolean;
}) {
  const percentage = limit ? Math.min(100, Math.round((tokens / limit) * 100)) : 0;
  return (
    <div className={`admin-usage-row ${overLimit ? "is-over-limit" : ""}`}>
      <div className="admin-usage-row-head"><span><strong>{name}</strong>{detail && <small>{detail}</small>}</span><span>{formatNumber(tokens)} tokens / {requests} requests</span></div>
      <div className="admin-progress-track"><span style={{ width: `${percentage}%` }} /></div>
      <div className="admin-usage-row-foot"><span>{limit === null ? "No monthly limit set" : `${formatNumber(limit)} token limit`}</span>{overLimit && <strong>Over limit · warning only</strong>}</div>
    </div>
  );
}

function PlansSection({
  plans,
  onCreate,
  onEdit,
  onToggle,
}: {
  plans: AdminPlan[];
  onCreate: () => void;
  onEdit: (plan: AdminPlan) => void;
  onToggle: (plan: AdminPlan) => void;
}) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro">
        <div><span className="admin-eyebrow">ACCESS & LIMITS</span><h2>Subscription plans</h2><p>Create tiers, choose enabled shop modules, and set employee, listing, and monthly AI token limits.</p></div>
        <button className="admin-button admin-button-dark" type="button" onClick={onCreate}><Plus size={16} /> New plan</button>
      </div>
      {plans.length === 0 ? (
        <div className="admin-panel"><EmptyState text="Create a plan to start assigning subscription access to shops and users." /></div>
      ) : (
        <div className="admin-plan-grid">
          {plans.map((plan) => (
            <article className={`admin-plan-card ${!plan.actif ? "is-disabled" : ""}`} key={plan.id}>
              <div className="admin-plan-card-top"><span className="admin-plan-symbol"><ShieldCheck size={19} /></span><span className={`admin-plan-status ${plan.actif ? "is-active" : ""}`}>{plan.actif ? "ACTIVE" : "DISABLED"}</span></div>
              <h3>{plan.nom}</h3><p>{plan.description || "No description"}</p>
              <div className="admin-plan-code">{plan.code} · {plan._count.attributions} assignments</div>
              <div className="admin-plan-limits">
                <span><Users size={15} /> {plan.max_employes ?? "Unlimited"} employees</span>
                <span><Package size={15} /> {plan.max_annonces ?? "Unlimited"} listings</span>
                <span><Sparkles size={15} /> {plan.tokens_ia_mensuels === null ? "No AI cap" : `${formatNumber(plan.tokens_ia_mensuels)} monthly tokens`}</span>
              </div>
              <div className="admin-module-tags">{plan.modules.map((module) => <span key={module}>{module}</span>)}</div>
              <div className="admin-plan-actions">
                <button className="admin-button admin-button-light" type="button" onClick={() => onEdit(plan)}><Pencil size={14} /> Edit plan</button>
                <button className="admin-button admin-button-quiet" type="button" onClick={() => onToggle(plan)}>{plan.actif ? "Disable" : "Enable"}</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="admin-note"><ShieldCheck size={16} /><span>Shop module access and employee/listing caps are enforced by the API when a plan is assigned. AI quotas currently warn only, as requested.</span></div>
    </div>
  );
}

function AdvertisementsSection({
  advertisements,
  campaigns,
  onCreate,
  onEdit,
}: {
  advertisements: AdminAdvertisement[];
  campaigns: AdminCampaign[];
  onCreate: () => void;
  onEdit: (advertisement: AdminAdvertisement) => void;
}) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro">
        <div>
          <span className="admin-eyebrow">MARKETING</span>
          <h2>Advertisements</h2>
          <p>Manage ad creatives and schedules. This admin-only module does not publish ads to customer pages.</p>
        </div>
        <button className="admin-button admin-button-dark" type="button" onClick={onCreate}><Plus size={16} /> New advertisement</button>
      </div>
      <div className="admin-panel">
        {advertisements.length === 0 ? <EmptyState text="No advertisements have been created." /> : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-wide-table">
              <thead><tr><th>Advertisement</th><th>Campaign</th><th>Advertiser</th><th>Status</th><th>Schedule</th><th>Impressions</th><th>Clicks / CTR</th><th /></tr></thead>
              <tbody>{advertisements.map((ad) => (
                <tr key={ad.id}>
                  <td><strong>{ad.titre}</strong><small>{humanize(ad.type)}</small></td>
                  <td>{ad.campagne?.nom ?? "—"}</td>
                  <td>{ad.annonceur}</td>
                  <td><StatusBadge value={ad.statut} /></td>
                  <td>{ad.date_debut ? formatDate(ad.date_debut) : "Unscheduled"}<small>{ad.date_fin ? `Until ${formatDate(ad.date_fin)}` : "No end date"}</small></td>
                  <td>{formatNumber(ad.impressions)}</td>
                  <td>{formatNumber(ad.clicks)} / {ad.clickThroughRate === null ? "—" : `${ad.clickThroughRate}%`}</td>
                  <td><button className="admin-button admin-button-light" type="button" onClick={() => onEdit(ad)}><Pencil size={14} /> Edit / archive</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      <div className="admin-note"><Megaphone size={16} /><span>Impressions and clicks come only from recorded event rows. No tracking endpoint or client-facing ad placement is enabled.</span></div>
      {campaigns.length === 0 && <p className="admin-muted">Create an ad campaign first if you want to associate creatives with campaign records.</p>}
    </div>
  );
}

function CampaignsSection({
  campaigns,
  onCreate,
  onEdit,
}: {
  campaigns: AdminCampaign[];
  onCreate: () => void;
  onEdit: (campaign: AdminCampaign) => void;
}) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro">
        <div><span className="admin-eyebrow">MARKETING</span><h2>Advertisement campaigns</h2><p>Set audience, location, budget, campaign schedule, and administrative notes.</p></div>
        <button className="admin-button admin-button-dark" type="button" onClick={onCreate}><Plus size={16} /> New campaign</button>
      </div>
      <div className="admin-panel">
        {campaigns.length === 0 ? <EmptyState text="No advertisement campaigns have been created." /> : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-wide-table">
              <thead><tr><th>Campaign</th><th>Status</th><th>Target</th><th>Schedule</th><th>Budget</th><th>Creatives</th><th /></tr></thead>
              <tbody>{campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td><strong>{campaign.nom}</strong></td>
                  <td><StatusBadge value={campaign.statut} /></td>
                  <td>{campaign.public_cible ?? "Any audience"}<small>{campaign.lieu_cible ?? "Any location"}</small></td>
                  <td>{campaign.date_debut ? formatDate(campaign.date_debut) : "Unscheduled"}<small>{campaign.date_fin ? `Until ${formatDate(campaign.date_fin)}` : "No end date"}</small></td>
                  <td>{campaign.budget === null ? "—" : formatMoney(campaign.budget, "TND")}</td>
                  <td>{formatNumber(campaign._count.publicites)}</td>
                  <td><button className="admin-button admin-button-light" type="button" onClick={() => onEdit(campaign)}><Pencil size={14} /> Edit</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformControlsSection({
  controls,
  reason,
  saving,
  onReasonChange,
  onChange,
  onSubmit,
}: {
  controls: AdminPlatformControls;
  reason: string;
  saving: boolean;
  onReasonChange: (reason: string) => void;
  onChange: (patch: Partial<AdminPlatformControls>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="admin-content">
      <SectionIntro title="Emergency controls" detail="Pause selected platform operations during incidents. Changes are audited with the administrator and reason." />
      <form className="admin-panel admin-controls-form" onSubmit={onSubmit}>
        <label className="admin-checkbox-row">
          <input type="checkbox" checked={controls.inscriptions_magasins} onChange={(event) => onChange({ inscriptions_magasins: event.target.checked })} />
          <span><strong>Allow new shop registrations</strong><small>When disabled, new shop creation is rejected by the backend.</small></span>
        </label>
        <label className="admin-checkbox-row">
          <input type="checkbox" checked={controls.publicites_activees} onChange={(event) => onChange({ publicites_activees: event.target.checked })} />
          <span><strong>Advertisements enabled</strong><small>Stored platform-wide switch for future ad delivery; customer-side ad rendering is not implemented.</small></span>
        </label>
        <label>Reason for this control change<textarea required minLength={3} maxLength={1000} value={reason} onChange={(event) => onReasonChange(event.target.value)} rows={3} /></label>
        <div className="admin-controls-meta">Last changed {formatDate(controls.modifie_le)}</div>
        <button className="admin-button admin-button-dark" type="submit" disabled={saving}>{saving ? "Saving…" : "Save emergency controls"}</button>
      </form>
    </div>
  );
}

function AdvertisementModal({
  draft,
  campaigns,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: AdvertisementDraft;
  campaigns: AdminCampaign[];
  saving: boolean;
  onChange: (draft: AdvertisementDraft | null) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const update = (patch: Partial<AdvertisementDraft>) => onChange({ ...draft, ...patch });
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-plan-modal" onSubmit={onSubmit}>
        <div className="admin-modal-heading"><div><span className="admin-eyebrow">MARKETING</span><h2>{draft.id ? "Edit advertisement" : "Create advertisement"}</h2></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        <div className="admin-form-grid">
          <label>Title<input required maxLength={160} value={draft.title} onChange={(event) => update({ title: event.target.value })} /></label>
          <label>Advertiser<input required maxLength={160} value={draft.advertiser} onChange={(event) => update({ advertiser: event.target.value })} /></label>
          <label>Type<select value={draft.type} onChange={(event) => update({ type: event.target.value })}><option value="BANNER">Banner</option><option value="SPONSORED_LISTING">Sponsored listing</option><option value="PROMOTION">Promotion</option></select></label>
          <label>Status<select value={draft.status} onChange={(event) => update({ status: event.target.value })}>{adStatuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select></label>
          <label>Campaign<select value={draft.campaignId} onChange={(event) => update({ campaignId: event.target.value })}><option value="">No campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.nom}</option>)}</select></label>
          <label>Image URL<input type="url" value={draft.imageUrl} onChange={(event) => update({ imageUrl: event.target.value })} placeholder="https://" /></label>
          <label className="admin-span-two">Destination URL<input required type="url" value={draft.destinationUrl} onChange={(event) => update({ destinationUrl: event.target.value })} placeholder="https://" /></label>
          <label>Starts at<input type="datetime-local" value={draft.startsAt} onChange={(event) => update({ startsAt: event.target.value })} /></label>
          <label>Ends at<input type="datetime-local" value={draft.endsAt} onChange={(event) => update({ endsAt: event.target.value })} /></label>
          <label className="admin-span-two">Description<textarea rows={2} value={draft.description} onChange={(event) => update({ description: event.target.value })} /></label>
          <label className="admin-span-two">Internal notes<textarea rows={2} value={draft.internalNotes} onChange={(event) => update({ internalNotes: event.target.value })} /></label>
          <label className="admin-span-two">Reason for this change<textarea required minLength={3} maxLength={1000} rows={2} value={draft.reason} onChange={(event) => update({ reason: event.target.value })} /></label>
        </div>
        <div className="admin-modal-actions"><button type="button" className="admin-button admin-button-light" onClick={onClose}>Cancel</button><button type="submit" className="admin-button admin-button-dark" disabled={saving}>{saving ? "Saving…" : draft.id ? "Save advertisement" : "Create advertisement"}</button></div>
      </form>
    </div>
  );
}

function CampaignModal({
  draft,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: CampaignDraft;
  saving: boolean;
  onChange: (draft: CampaignDraft | null) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const update = (patch: Partial<CampaignDraft>) => onChange({ ...draft, ...patch });
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-plan-modal" onSubmit={onSubmit}>
        <div className="admin-modal-heading"><div><span className="admin-eyebrow">MARKETING</span><h2>{draft.id ? "Edit campaign" : "Create campaign"}</h2></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        <div className="admin-form-grid">
          <label className="admin-span-two">Campaign name<input required maxLength={160} value={draft.name} onChange={(event) => update({ name: event.target.value })} /></label>
          <label>Status<select value={draft.status} onChange={(event) => update({ status: event.target.value })}>{adStatuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select></label>
          <label>Target audience<input maxLength={80} value={draft.targetAudience} onChange={(event) => update({ targetAudience: event.target.value })} /></label>
          <label>Target location<input maxLength={160} value={draft.targetLocation} onChange={(event) => update({ targetLocation: event.target.value })} /></label>
          <label>Budget (TND)<input type="number" min="0" step="0.001" value={draft.budget} onChange={(event) => update({ budget: event.target.value })} /></label>
          <label>Starts at<input type="datetime-local" value={draft.startsAt} onChange={(event) => update({ startsAt: event.target.value })} /></label>
          <label>Ends at<input type="datetime-local" value={draft.endsAt} onChange={(event) => update({ endsAt: event.target.value })} /></label>
          <label className="admin-span-two">Internal notes<textarea rows={3} value={draft.internalNotes} onChange={(event) => update({ internalNotes: event.target.value })} /></label>
          <label className="admin-span-two">Reason for this change<textarea required minLength={3} maxLength={1000} rows={2} value={draft.reason} onChange={(event) => update({ reason: event.target.value })} /></label>
        </div>
        <div className="admin-modal-actions"><button type="button" className="admin-button admin-button-light" onClick={onClose}>Cancel</button><button type="submit" className="admin-button admin-button-dark" disabled={saving}>{saving ? "Saving…" : draft.id ? "Save campaign" : "Create campaign"}</button></div>
      </form>
    </div>
  );
}

function PlanModal({
  draft,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: PlanDraft;
  saving: boolean;
  onChange: (draft: PlanDraft | null) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const update = (patch: Partial<PlanDraft>) => onChange({ ...draft, ...patch });
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-plan-modal" onSubmit={onSubmit}>
        <div className="admin-modal-heading"><div><span className="admin-eyebrow">{draft.id ? "EDIT SUBSCRIPTION" : "NEW SUBSCRIPTION"}</span><h2>{draft.id ? "Update plan" : "Create plan"}</h2></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        <div className="admin-form-grid">
          <label>Plan name<input required value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Starter" /></label>
          <label>Plan code<input required pattern="[A-Za-z0-9_-]+" value={draft.code} onChange={(event) => update({ code: event.target.value.toLowerCase() })} placeholder="starter" disabled={Boolean(draft.id)} /></label>
          <label className="admin-span-two">Description<textarea value={draft.description} onChange={(event) => update({ description: event.target.value })} rows={2} /></label>
          <label>Max employees<input type="number" min="0" value={draft.maxEmployees} onChange={(event) => update({ maxEmployees: event.target.value })} placeholder="Unlimited" /></label>
          <label>Max listings<input type="number" min="0" value={draft.maxListings} onChange={(event) => update({ maxListings: event.target.value })} placeholder="Unlimited" /></label>
          <label className="admin-span-two">Monthly AI tokens<input type="number" min="0" value={draft.monthlyAiTokens} onChange={(event) => update({ monthlyAiTokens: event.target.value })} placeholder="No limit" /></label>
          <label className="admin-span-two">Reason for this plan change<textarea required minLength={3} maxLength={1000} rows={2} value={draft.reason} onChange={(event) => update({ reason: event.target.value })} /></label>
        </div>
        <fieldset className="admin-module-fieldset"><legend>Shop modules included</legend><div className="admin-module-options">
          {MODULES.map(([code, label]) => <label key={code}><input type="checkbox" checked={draft.modules.includes(code)} onChange={(event) => update({ modules: event.target.checked ? [...draft.modules, code] : draft.modules.filter((value) => value !== code) })} /><span>{label}</span></label>)}
        </div></fieldset>
        <label className="admin-checkbox-row"><input type="checkbox" checked={draft.active} onChange={(event) => update({ active: event.target.checked })} /> Plan is active and assignable</label>
        <div className="admin-modal-actions"><button type="button" className="admin-button admin-button-light" onClick={onClose}>Cancel</button><button type="submit" className="admin-button admin-button-dark" disabled={saving}>{saving ? "Saving…" : "Save plan"}</button></div>
      </form>
    </div>
  );
}

function SectionIntro({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-section-intro"><div><span className="admin-eyebrow">PLATFORM DIRECTORY</span><h2>{title}</h2><p>{detail}</p></div></div>;
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`admin-status-badge status-${value.toLowerCase()}`}>{humanize(value)}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="admin-empty"><span><Eye size={19} /></span><p>{text}</p></div>;
}

function AdminLoading() {
  return <div className="admin-gate"><LoaderCircle size={24} className="admin-spin" /><span>Loading administrator session…</span></div>;
}

function AdminGate({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-gate"><span className="admin-gate-icon"><ShieldCheck size={23} /></span><h1>{title}</h1><p>{detail}</p><Link href="/">Return to Lunetty</Link></div>;
}

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function parseOptionalLimit(value: string) {
  return value.trim() === "" ? null : Number(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatMoney(value: string | number, currency: string) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("fr-TN", { style: "currency", currency }).format(amount)
    : `${value} ${currency}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toPlanDraft(plan: AdminPlan): PlanDraft {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.nom,
    description: plan.description ?? "",
    modules: plan.modules,
    maxEmployees: plan.max_employes?.toString() ?? "",
    maxListings: plan.max_annonces?.toString() ?? "",
    monthlyAiTokens: plan.tokens_ia_mensuels?.toString() ?? "",
    active: plan.actif,
    reason: "",
  };
}

function toAdvertisementDraft(ad: AdminAdvertisement): AdvertisementDraft {
  return {
    id: ad.id,
    campaignId: ad.campagne_id ?? "",
    title: ad.titre,
    description: ad.description ?? "",
    imageUrl: ad.url_image ?? "",
    destinationUrl: ad.url_destination,
    advertiser: ad.annonceur,
    type: ad.type,
    status: ad.statut,
    startsAt: dateToLocalInput(ad.date_debut),
    endsAt: dateToLocalInput(ad.date_fin),
    internalNotes: ad.notes_internes ?? "",
    reason: "",
  };
}

function toCampaignDraft(campaign: AdminCampaign): CampaignDraft {
  return {
    id: campaign.id,
    name: campaign.nom,
    status: campaign.statut,
    targetAudience: campaign.public_cible ?? "",
    targetLocation: campaign.lieu_cible ?? "",
    startsAt: dateToLocalInput(campaign.date_debut),
    endsAt: dateToLocalInput(campaign.date_fin),
    budget: campaign.budget?.toString() ?? "",
    internalNotes: campaign.notes_internes ?? "",
    reason: "",
  };
}

function dateToIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function dateToLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}