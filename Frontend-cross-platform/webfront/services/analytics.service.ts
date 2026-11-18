import { apiRequest } from "./api";

export const analyticsService = {
  recordClick: (input: {
    storeId: string;
    type: "STORE_PROFILE" | "STORE_LISTING";
    listingId?: string;
  }) =>
    apiRequest<{ id: string }>("analytics/clicks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
