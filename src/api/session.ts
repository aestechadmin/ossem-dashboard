import api from "./client";

export async function claimAdminPortalSession() {
  const { data } = await api.post<{ sessionId: string }>("/admin-portal/claim-session");
  return data.sessionId;
}

export async function checkAdminPortalSession() {
  const { data } = await api.get<{ ok: boolean }>("/admin-portal/check-session");
  return data.ok;
}
