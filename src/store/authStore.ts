import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isJwtExpired } from "@/utils/jwt";

type AuthUser = {
  id: number;
  email?: string;
  username?: string;
  type?: string;
  mobileNo?: string;
};

export type AuthBranch = {
  id: number;
  name: string;
  branchType?: string;
};

type AuthChannel = "phone" | "email";

export const SESSION_REVOKED_STORAGE_KEY = "ossem-admin-session-revoked";
export const AUTH_ERROR_STORAGE_KEY = "ossem-admin-auth-error";

type AuthState = {
  hasHydrated: boolean;
  jwt: string | null;
  user: AuthUser | null;
  adminSessionId: string | null;
  branches: AuthBranch[];
  selectedBranchId: number | null;
  otpToken: string | null;
  loginIdentifier: string | null;
  loginPassword: string | null;
  authChannel: AuthChannel | null;
  setHasHydrated: (value: boolean) => void;
  setOtpPending: (
    token: string,
    identifier: string,
    channel: AuthChannel,
    password?: string | null
  ) => void;
  setJwtForClaim: (jwt: string, user: AuthUser) => void;
  finishLogin: (
    jwt: string,
    user: AuthUser,
    sessionId: string,
    branches?: AuthBranch[],
    branchId?: number | null
  ) => void;
  setAdminSession: (sessionId: string) => void;
  setBranches: (branches: AuthBranch[]) => void;
  setSelectedBranch: (branchId: number) => void;
  clearOtpPending: () => void;
  logout: (reason?: "session_revoked" | "auth_error", message?: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      jwt: null,
      user: null,
      adminSessionId: null,
      branches: [],
      selectedBranchId: null,
      otpToken: null,
      loginIdentifier: null,
      loginPassword: null,
      authChannel: null,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setOtpPending: (token, identifier, channel, password = null) =>
        set({
          otpToken: token,
          loginIdentifier: identifier,
          authChannel: channel,
          loginPassword: channel === "email" ? password : null,
        }),
      setJwtForClaim: (jwt, user) => set({ jwt, user }),
      finishLogin: (jwt, user, sessionId, branches = [], branchId = null) => {
        const list = branches || [];
        // Prefer first branch in list; fall back to API branchId only if list empty of match
        const inList =
          branchId != null && list.some((b) => b.id === branchId)
            ? branchId
            : null;
        const defaultId = list.length > 0 ? list[0].id : inList;
        set({
          jwt,
          user,
          adminSessionId: sessionId,
          branches: list,
          selectedBranchId: defaultId,
          otpToken: null,
          loginIdentifier: null,
          loginPassword: null,
          authChannel: null,
        });
      },
      setAdminSession: (sessionId) => set({ adminSessionId: sessionId }),
      setBranches: (branches) => {
        const list = branches || [];
        set((state) => {
          const stillValid =
            state.selectedBranchId != null &&
            list.some((b) => b.id === state.selectedBranchId);
          return {
            branches: list,
            // Always keep a real selection — default to first row
            selectedBranchId: stillValid
              ? state.selectedBranchId
              : list.length > 0
                ? list[0].id
                : null,
          };
        });
      },
      setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),
      clearOtpPending: () =>
        set({
          otpToken: null,
          loginIdentifier: null,
          loginPassword: null,
          authChannel: null,
        }),
      logout: (reason, message) => {
        if (typeof sessionStorage !== "undefined") {
          if (reason === "session_revoked") {
            sessionStorage.setItem(SESSION_REVOKED_STORAGE_KEY, "1");
          }
          if (reason === "auth_error" && message) {
            sessionStorage.setItem(AUTH_ERROR_STORAGE_KEY, message);
          }
        }
        set({
          jwt: null,
          user: null,
          adminSessionId: null,
          branches: [],
          selectedBranchId: null,
          otpToken: null,
          loginIdentifier: null,
          loginPassword: null,
          authChannel: null,
        });
      },
    }),
    {
      name: "ossem-admin-auth",
      partialize: (state) => ({
        jwt: state.jwt,
        user: state.user,
        adminSessionId: state.adminSessionId,
        branches: state.branches,
        selectedBranchId: state.selectedBranchId,
      }),
      onRehydrateStorage: () => (state, _error) => {
        // JWT without admin session = half login — never keep it
        if (state?.jwt && (!state.adminSessionId || isJwtExpired(state.jwt))) {
          useAuthStore.getState().logout();
        } else if (
          state?.branches?.length &&
          (state.selectedBranchId == null ||
            !state.branches.some((b) => b.id === state.selectedBranchId))
        ) {
          // Always default to first branch if none selected
          useAuthStore.getState().setSelectedBranch(state.branches[0].id);
        }
      },
    }
  )
);

// Reliable hydrate flag — onRehydrateStorage alone can miss after HMR / sync storage
function markAuthHydrated() {
  useAuthStore.getState().setHasHydrated(true);
}
if (typeof window !== "undefined") {
  useAuthStore.persist.onFinishHydration(markAuthHydrated);
  if (useAuthStore.persist.hasHydrated()) {
    markAuthHydrated();
  }
}
