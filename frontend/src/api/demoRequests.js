import { apiRequest } from "./client";

export const createDemoRequest = (payload) =>
  apiRequest("/api/demo-requests", {
    method: "POST",
    body: JSON.stringify(payload)
  });
