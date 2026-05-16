import { apiRequest } from "./client";

export const sendChatMessage = (messages, context) =>
  apiRequest("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages, context })
  });

export const sendTicketCopilotMessage = ({ ticketId, messages, mode }) =>
  apiRequest("/api/ai/ticket-copilot", {
    method: "POST",
    body: JSON.stringify({ ticketId, messages, mode })
  });
