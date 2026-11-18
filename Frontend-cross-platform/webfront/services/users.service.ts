import { apiRequest, apiRequestBlob, JsonRecord, queryString } from "./api";
import type { User } from "./auth.service";

export type ClientAddress = {
  ligne_1: string;
  ville: string;
  code_postal: string;
  code_pays: string;
};

export type ClientProfile = User & {
  langue_preferee?: string;
  email_verifie_le?: string | null;
  adresse: ClientAddress | null;
};

export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const usersService = {
  me: () => apiRequest<ClientProfile>("users/me"),
  updateMe: (input: JsonRecord) =>
    apiRequest<ClientProfile>("users/me", { method: "PATCH", body: JSON.stringify(input) }),
  uploadAvatar: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<{ url_image_profil: string }>("users/me/avatar", {
      method: "POST",
      body,
    });
  },
  deleteAvatar: () =>
    apiRequest<{ success: boolean }>("users/me/avatar", { method: "DELETE" }),
  exportMe: () => apiRequest<JsonRecord>("users/me/export"),
  deactivateMe: () =>
    apiRequest<{ success: boolean }>("users/me", { method: "DELETE" }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<JsonRecord>("auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  avatar: (path: string) =>
    apiRequestBlob(path.replace(/^\/api\/v1\//, "")),
  list: (page = 1) => apiRequest<Page<User>>(`users${queryString({ page, limit: 20 })}`),
  publicProfile: (id: string) => apiRequest<User>(`users/${id}`),
  followers: (id: string, page = 1) =>
    apiRequest<Page<User>>(`users/${id}/followers${queryString({ page, limit: 20 })}`),
  following: (id: string, page = 1) =>
    apiRequest<Page<User>>(`users/${id}/following${queryString({ page, limit: 20 })}`),
  follow: (id: string) => apiRequest<JsonRecord>(`users/${id}/follow`, { method: "POST" }),
  unfollow: (id: string) =>
    apiRequest<JsonRecord>(`users/${id}/follow`, { method: "DELETE" }),
};
