import { apiRequest } from "./client";

export const fetchUsers = () => apiRequest("/api/users");

export const inviteUser = (payload) =>
  apiRequest("/api/users/invite", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateUserRole = (id, role) =>
  apiRequest(`/api/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });

export const deactivateUser = (id) =>
  apiRequest(`/api/users/${id}/deactivate`, {
    method: "PATCH"
  });

export const activateUser = (id) =>
  apiRequest(`/api/users/${id}/activate`, {
    method: "PATCH"
  });

export const deactivateCurrentUser = () =>
  apiRequest("/api/users/me/deactivate", {
    method: "PATCH"
  });

export const updateCurrentUser = (payload) =>
  apiRequest("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
