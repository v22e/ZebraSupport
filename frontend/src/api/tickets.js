import API_BASE_URL, { ApiClientError, apiRequest } from "./client";

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

export const assignTicket = (id, assignedTo) =>
  apiRequest(`/api/tickets/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assignedTo })
  });

export const exportTicketsCsv = async () => {
  const response = await fetch(`${API_BASE_URL}/api/tickets/export`, {
    credentials: "include"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiClientError((data && data.error) || "Failed to export tickets", {
      status: response.status,
      data
    });
  }

  const text = await response.text();
  return text;
};

export const resetAllTickets = () =>
  apiRequest("/api/tickets/reset", {
    method: "DELETE"
  });

export const loadDemoTickets = () =>
  apiRequest("/api/tickets/demo/load", {
    method: "POST"
  });

export const removeDemoTickets = () =>
  apiRequest("/api/tickets/demo/remove", {
    method: "DELETE"
  });
