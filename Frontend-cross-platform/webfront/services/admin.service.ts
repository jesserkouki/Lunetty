import { apiRequest, JsonRecord, queryString } from "./api";

export type AdminPage<T = JsonRecord> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type AdminStore = {
  id: string;
  nom: string;
  slug: string;
  email: string | null;
  statut: string;
  cree_le: string;
  owner: { id: string; prenom: string; nom: string; email: string } | null;
  plan: { id: string; code: string; nom: string } | null;
  clicks: number;
  aiTokens: number;
  employees: number;
  orders: number;
  listings: number;
};

export type AdminUser = {
  id: string;
  role: string;
  statut: string;
  prenom: string;
  nom: string;
  nom_utilisateur: string | null;
  email: string;
  telephone: string | null;
  derniere_connexion_le: string | null;
  cree_le: string;
  profil_client: { id: string } | null;
  profil_opticien: { id: string } | null;
  adhesions: Array<{
    id: string;
    role: string;
    statut: string;
    magasin: { id: string; nom: string; slug: string };
  }>;
  plan: { id: string; code: string; nom: string } | null;
  aiTokens: number;
  orders: number;
};

export type AdminOrder = {
  id: string;
  numero_commande: string;
  statut: string;
  devise: string;
  total_general: string | number;
  cree_le: string;
  magasin: { id: string; nom: string };
  utilisateur: { id: string; prenom: string; nom: string; email: string };
};

export type AdminClickSummary = {
  magasin_id: string;
  store: { nom: string; slug: string } | undefined;
  profileClicks: number;
  listingClicks: number;
};

export type AdminAiUsage = {
  month: string;
  stores: Array<{
    id: string | null;
    name: string;
    tokens: number;
    requests: number;
    limit: number | null;
    overLimit: boolean;
  }>;
  users: Array<{
    id: string | null;
    name: string;
    email: string | null;
    tokens: number;
    requests: number;
    limit: number | null;
    overLimit: boolean;
  }>;
};

export type AdminPlan = {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  modules: string[];
  max_employes: number | null;
  max_annonces: number | null;
  tokens_ia_mensuels: number | null;
  actif: boolean;
  _count: { attributions: number };
};

export type AdminAuditEvent = {
  id: string;
  acteur_id: string | null;
  acteur_identite: string | null;
  magasin_id: string | null;
  action: string;
  type_entite: string;
  entite_id: string | null;
  description: string | null;
  valeurs_precedentes: unknown;
  nouvelles_valeurs: unknown;
  raison: string | null;
  cree_le: string;
  acteur: { prenom: string; nom: string; email: string } | null;
};

export type AdminAdvertisement = {
  id: string;
  campagne_id: string | null;
  titre: string;
  description: string | null;
  url_image: string | null;
  url_destination: string;
  annonceur: string;
  type: string;
  statut: string;
  date_debut: string | null;
  date_fin: string | null;
  notes_internes: string | null;
  campagne: { id: string; nom: string; statut: string } | null;
  impressions: number;
  clicks: number;
  clickThroughRate: number | null;
};

export type AdminCampaign = {
  id: string;
  nom: string;
  statut: string;
  public_cible: string | null;
  lieu_cible: string | null;
  date_debut: string | null;
  date_fin: string | null;
  budget: string | number | null;
  notes_internes: string | null;
  _count: { publicites: number };
};

export type AdminPlatformControls = {
  inscriptions_magasins: boolean;
  publicites_activees: boolean;
  modifie_le: string;
};

const adminApi = {
  overview: () => apiRequest<Record<string, number>>("admin/overview"),
  stores: (search = "") =>
    apiRequest<AdminPage<AdminStore>>("admin/stores" + queryString({ page: 1, limit: 100, search })),
  users: (search = "", kind?: string) =>
    apiRequest<AdminPage<AdminUser>>("admin/users" + queryString({ page: 1, limit: 100, search, kind })),
  orders: (search = "") =>
    apiRequest<AdminPage<AdminOrder>>("admin/orders" + queryString({ page: 1, limit: 100, search })),
  clicks: (search = "") =>
    apiRequest<AdminPage<AdminClickSummary>>("admin/clicks" + queryString({ page: 1, limit: 100, search })),
  aiUsage: () => apiRequest<AdminAiUsage>("admin/ai-usage"),
  plans: () => apiRequest<AdminPlan[]>("admin/plans"),
  audit: (filters: Record<string, string | number | undefined> = {}) =>
    apiRequest<AdminPage<AdminAuditEvent>>(
      "admin/audit-logs" + queryString({ page: 1, limit: 100, ...filters }),
    ),
  createPlan: (input: JsonRecord) =>
    apiRequest<AdminPlan>("admin/plans", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updatePlan: (planId: string, input: JsonRecord) =>
    apiRequest<AdminPlan>(`admin/plans/${planId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  advertisements: () => apiRequest<AdminAdvertisement[]>("admin/advertisements"),
  campaigns: () => apiRequest<AdminCampaign[]>("admin/advertisement-campaigns"),
  platformControls: () => apiRequest<AdminPlatformControls>("admin/platform-controls"),
  updatePlatformControls: (input: JsonRecord) =>
    apiRequest<AdminPlatformControls>("admin/platform-controls", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  createAdvertisement: (input: JsonRecord) =>
    apiRequest<AdminAdvertisement>("admin/advertisements", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateAdvertisement: (id: string, input: JsonRecord) =>
    apiRequest<AdminAdvertisement>(`admin/advertisements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  createCampaign: (input: JsonRecord) =>
    apiRequest<AdminCampaign>("admin/advertisement-campaigns", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCampaign: (id: string, input: JsonRecord) =>
    apiRequest<AdminCampaign>(`admin/advertisement-campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  assignStorePlan: (storeId: string, planId: string, reason: string) =>
    apiRequest<JsonRecord>(`admin/stores/${storeId}/plan`, {
      method: "PUT",
      body: JSON.stringify({ planId, reason }),
    }),
  removeStorePlan: (storeId: string, reason: string) =>
    apiRequest<JsonRecord>(`admin/stores/${storeId}/plan`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),
  assignUserPlan: (userId: string, planId: string, reason: string) =>
    apiRequest<JsonRecord>(`admin/users/${userId}/plan`, {
      method: "PUT",
      body: JSON.stringify({ planId, reason }),
    }),
  removeUserPlan: (userId: string, reason: string) =>
    apiRequest<JsonRecord>(`admin/users/${userId}/plan`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),
  updateStoreStatus: (storeId: string, status: string, reason: string) =>
    apiRequest<JsonRecord>(`admin/stores/${storeId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
  updateUserStatus: (userId: string, status: string, reason: string) =>
    apiRequest<JsonRecord>(`admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
};

export const adminService = adminApi;