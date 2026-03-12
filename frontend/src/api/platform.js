import { apiRequest } from "./client";

export const fetchPlatformSummary = () => apiRequest("/api/platform/summary");

export const fetchPlatformOrganisations = () => apiRequest("/api/platform/organisations");

export const fetchPlatformOrganisationById = (id) => apiRequest(`/api/platform/organisations/${id}`);

export const createPlatformOrganisation = (payload) =>
  apiRequest("/api/platform/organisations", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updatePlatformOrganisationPlan = (id, plan) =>
  apiRequest(`/api/platform/organisations/${id}/plan`, {
    method: "PATCH",
    body: JSON.stringify({ plan })
  });

export const suspendPlatformOrganisation = (id) =>
  apiRequest(`/api/platform/organisations/${id}/suspend`, {
    method: "PATCH"
  });

export const activatePlatformOrganisation = (id) =>
  apiRequest(`/api/platform/organisations/${id}/activate`, {
    method: "PATCH"
  });

export const deletePlatformOrganisation = (id) =>
  apiRequest(`/api/platform/organisations/${id}`, {
    method: "DELETE"
  });

export const fetchPlatformDemoRequests = () => apiRequest("/api/platform/demo-requests");

export const updatePlatformDemoRequestStatus = (id, status) =>
  apiRequest(`/api/platform/demo-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
