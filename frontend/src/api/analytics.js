import { apiRequest } from "./client";

export const fetchSummary = () => apiRequest("/api/analytics/summary");
export const fetchVolume = () => apiRequest("/api/analytics/volume");
export const fetchHealthScore = () => apiRequest("/api/analytics/health-score");