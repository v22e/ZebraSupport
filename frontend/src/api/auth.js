import { apiRequest } from "./client";

export const registerUser = (payload) =>
  apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const loginUser = (payload) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const logoutUser = () =>
  apiRequest("/api/auth/logout", {
    method: "POST"
  });

export const fetchMe = () => apiRequest("/api/auth/me");