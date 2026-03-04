import { apiRequest } from "./client";

export const fetchTickets = () => apiRequest("/api/tickets");

export const fetchTicketById = (id) => apiRequest(`/api/tickets/${id}`);

export const updateTicket = (id, payload) =>
  apiRequest(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const createTicket = (payload) =>
  apiRequest("/api/tickets", {
    method: "POST",
    body: JSON.stringify(payload)
  });