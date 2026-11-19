import { apiRequest } from "./api";

export interface OpticianAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OpticianAssistantProposal {
  token: string;
  type: "stock_adjustment" | "order_status_change";
  label: string;
  from: number | string;
  to: number | string;
  reason: string;
  expiresAt: string;
}

export interface OpticianAssistantReply {
  reply: string;
  proposals: OpticianAssistantProposal[];
}

export const opticianAssistantService = {
  chat: (storeId: string, messages: OpticianAssistantMessage[]) =>
    apiRequest<OpticianAssistantReply>(
      `stores/${encodeURIComponent(storeId)}/assistant/chat`,
      {
        method: "POST",
        body: JSON.stringify({ messages: messages.slice(-20) }),
      },
    ),

  confirm: (storeId: string, token: string) =>
    apiRequest<Record<string, unknown>>(
      `stores/${encodeURIComponent(storeId)}/assistant/confirm`,
      {
        method: "POST",
        body: JSON.stringify({ token }),
      },
    ),
};
