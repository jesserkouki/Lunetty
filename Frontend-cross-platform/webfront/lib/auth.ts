export const API = '/backend';
const TOKEN_KEY = 'lunetty_token';

/** Fired on window when an authenticated request comes back 401 (token expired/invalid). */
export const AUTH_EXPIRED_EVENT = 'auth:expired';
const SPACE_KEY = 'lunetty_space';
export type AccountType = 'CLIENT' | 'OPTICIAN';

export type AuthUser = {
  id: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  prenom: string;
  nom: string;
  email: string;
  nom_utilisateur: string | null;
  telephone: string | null;
  url_image_profil: string | null;
  langue_preferee: string;
};

export type CurrentUser = AuthUser & { name: string; accountType: AccountType };

export type ProfilePatch = Partial<
  Pick<
    AuthUser,
    'prenom' | 'nom' | 'nom_utilisateur' | 'telephone' | 'url_image_profil' | 'langue_preferee'
  >
>;

export const toCurrentUser = (user: AuthUser, accountType: AccountType): CurrentUser => ({
  ...user,
  name: `${user.prenom} ${user.nom}`,
  accountType,
});

// ---- token storage (guarded: storage can throw in private mode) ----
export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};


export const getSpace = (): AccountType => {
  try { return localStorage.getItem(SPACE_KEY) === 'OPTICIAN' ? 'OPTICIAN' : 'CLIENT'; }
  catch { return 'CLIENT'; }
};
export const setSpace = (space: AccountType | null) => {
  try {
    if (space) localStorage.setItem(SPACE_KEY, space);
    else localStorage.removeItem(SPACE_KEY);
  } catch {}
};


// ---- errors ----
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const FR_MESSAGES: Record<string, string> = {
  'Invalid email or password': 'Email ou mot de passe incorrect.',
  'This account is not active': "Ce compte n'est pas actif.",
  'Account is unavailable': 'Ce compte est indisponible.',
  'A valid email address is required': 'Adresse email invalide.',
  'Password must be at least 12 characters': 'Le mot de passe doit contenir au moins 12 caractères.',
  'An account already exists for that email or username': 'Un compte existe déjà avec cet email.',
  'That username is already in use': "Ce nom d'utilisateur est déjà pris.",
  'Bearer access token is required': 'Veuillez vous connecter.',
  'Invalid or expired access token': 'Votre session a expiré. Veuillez vous reconnecter.',
  'Invalid access token': 'Votre session a expiré. Veuillez vous reconnecter.',
  'No supported profile fields were provided': 'Aucune modification à enregistrer.',
};

function toMessage(status: number, data: any): string {
  if (status === 429) return 'Trop de tentatives. Réessayez dans une minute.';
  const raw = Array.isArray(data?.message) ? data.message[0] : data?.message;
  if (typeof raw === 'string') return FR_MESSAGES[raw] ?? raw;
  return 'Une erreur est survenue.';
}

const hasAuthHeader = (headers: HeadersInit | undefined): boolean => {
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has('Authorization');
  if (Array.isArray(headers)) return headers.some(([k]) => k.toLowerCase() === 'authorization');
  return Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'Impossible de contacter le serveur.');
  }
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // A 401 on a request that carried a token means the session is dead
    // (expired after 15 min, or account deactivated). A wrong-password 401
    // on /auth/login sends no token, so it does NOT trigger this.
    if (res.status === 401 && hasAuthHeader(init.headers) && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, toMessage(res.status, data));
  }
  return data as T;
}

const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

// ---- endpoints ----
type AuthResponse = { user: AuthUser; accessToken: string };

export const login = (email: string, password: string) =>
  request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (input: { prenom: string; nom: string; email: string; password: string }) =>
  request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) });

export const fetchMe = (token: string) =>
  request<AuthUser>('/auth/me', { headers: authed(token) });

export const updateProfile = (token: string, patch: ProfilePatch) =>
  request<AuthUser>('/auth/me', {
    method: 'PATCH',
    headers: authed(token),
    body: JSON.stringify(patch),
  });

export const deactivateAccount = (token: string) =>
  request<{ success: boolean }>('/auth/me', { method: 'DELETE', headers: authed(token) });

// The ONE place to change once the store/optician logic is decided.
// For now every authenticated user is a client.
// Later: call the memberships endpoint and return 'OPTICIAN' if the user
// has an ACTIVE MembreMagasin, otherwise 'CLIENT'.
export async function resolveAccountType(_token: string): Promise<AccountType> {
   return getSpace();
}