import { apiRequest } from "./client";

export const fetchNotifications = (params = {}) => {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", params.limit);
  if (params.offset) search.set("offset", params.offset);
  if (params.unread !== undefined) search.set("unread", String(params.unread));
  if (params.type) search.set("type", params.type);

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiRequest(`/api/notifications${suffix}`);
};

export const fetchUnreadNotificationCount = () => apiRequest("/api/notifications/unread-count");

export const markNotificationRead = (id) =>
  apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH"
  });

export const markAllNotificationsRead = () =>
  apiRequest("/api/notifications/read-all", {
    method: "PATCH"
  });

export const deleteNotification = (id) =>
  apiRequest(`/api/notifications/${id}`, {
    method: "DELETE"
  });

export const updateNotificationPreference = (payload) =>
  apiRequest("/api/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
