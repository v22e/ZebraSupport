import { apiRequest } from "./client";

export const fetchCurrentBilling = () => apiRequest("/api/billing/current");
