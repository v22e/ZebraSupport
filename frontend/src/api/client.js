const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export class ApiClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status || 500;
    this.data = options.data || null;
    this.upgrade = Boolean(options.data?.upgrade);
    this.plan = options.data?.plan || null;
    this.limit = options.data?.limit ?? null;
    this.current = options.data?.current ?? null;
  }
}

const tryParseJson = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await tryParseJson(response) : await response.text();

  if (!response.ok) {
    const message = isJson ? data?.error || "Request failed" : "Request failed";
    throw new ApiClientError(message, {
      status: response.status,
      data: isJson ? data : null
    });
  }

  return data;
};

export default API_BASE_URL;
