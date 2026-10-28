import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:1337/api",
  headers: {
    "Content-Type": "application/json",
  },
});

function isSessionRevoked401(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("response" in error)) return false;
  const response = (error as { response?: { status?: number; data?: unknown } }).response;
  if (response?.status !== 401) return false;
  const data = response.data as
    | { error?: { message?: string; code?: string }; message?: string }
    | undefined;
  const message = data?.error?.message ?? data?.message ?? "";
  const code = data?.error?.code ?? "";
  return (
    code === "SESSION_REVOKED" ||
    message === "SESSION_REVOKED" ||
    /another device/i.test(String(message))
  );
}

function requestUrl(error: unknown): string {
  if (!error || typeof error !== "object" || !("config" in error)) return "";
  const config = (error as { config?: { url?: string; baseURL?: string } }).config;
  return `${config?.baseURL || ""}${config?.url || ""}`;
}

api.interceptors.request.use((config) => {
  const url = `${config.baseURL || ""}${config.url || ""}`;
  // Login / OTP must not send a leftover Bearer — Strapi can return
  // "Invalid credentials" when an expired/old JWT is attached.
  const isAuthLocal = /\/auth\/local/i.test(url);
  const { jwt, adminSessionId } = useAuthStore.getState();
  if (jwt && !isAuthLocal) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  if (adminSessionId && !isAuthLocal) {
    config.headers["X-Admin-Session"] = adminSessionId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = requestUrl(error);
    // Never wipe auth while verifying OTP / logging in
    if (/\/auth\/local/i.test(url)) {
      return Promise.reject(error);
    }
    // Claim failures are handled by completeAdminLogin
    if (/\/admin-portal\/claim-session/i.test(url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Any 401 while using the app means the session/JWT is dead.
      // Users don't reload — they open another menu/page, API 401s, and used
      // to stay stuck on the dashboard shell. Always clear auth + leave now.
      if (isSessionRevoked401(error)) {
        useAuthStore.getState().logout("session_revoked");
      } else {
        useAuthStore.getState().logout(
          "auth_error",
          "Your session has expired. Please sign in again."
        );
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
