import { apiRequest, apiRequestBlob, JsonRecord } from "./api";

export type ClientPrescription = {
  id: string;
  titre: string | null;
  prescrit_le: string | null;
  expire_le: string | null;
  notes: string | null;
  nom_fichier: string | null;
  type_fichier: string | null;
  est_active: boolean;
  document_present: boolean;
};

export const clientsService = {
  me: () => apiRequest<JsonRecord>("clients/me"),
  updateMe: (input: JsonRecord) =>
    apiRequest<JsonRecord>("clients/me", { method: "PATCH", body: JSON.stringify(input) }),
  prescriptions: () => apiRequest<ClientPrescription[]>("clients/me/prescriptions"),
  createPrescription: (input: JsonRecord) =>
    apiRequest<JsonRecord>("clients/me/prescriptions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  uploadPrescription: (
    file: File,
    input: {
      titre?: string;
      prescrit_le?: string;
      expire_le?: string;
      notes?: string;
      est_active?: boolean;
    },
  ) => {
    const body = new FormData();
    body.append("file", file);
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) body.append(key, String(value));
    }
    return apiRequest<JsonRecord>("clients/me/prescriptions/upload", {
      method: "POST",
      body,
    });
  },
  replacePrescriptionFile: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<JsonRecord>(`clients/me/prescriptions/${id}/file`, {
      method: "POST",
      body,
    });
  },
  updatePrescription: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`clients/me/prescriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  prescriptionFile: (id: string) =>
    apiRequestBlob(`clients/me/prescriptions/${id}/file`),
  removePrescription: (id: string) =>
    apiRequest<JsonRecord>(`clients/me/prescriptions/${id}`, { method: "DELETE" }),
};
