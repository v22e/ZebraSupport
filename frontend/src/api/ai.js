import { apiRequest } from "./client";

export const sendChatMessage = (messages) =>
  apiRequest("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages })
  });
