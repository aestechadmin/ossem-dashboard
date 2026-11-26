import { claimAdminPortalSession } from "./session";
import { useAuthStore } from "@/store/authStore";
import type { LoginVerifyResponse } from "./auth";

/** After JWT is issued, claim single-device session, then finish login atomically. */
export async function completeAdminLogin(data: LoginVerifyResponse) {
  if (!data?.jwt) {
    throw new Error("Login succeeded but no JWT was returned");
  }

  // Put JWT in store for the claim request only — keep OTP pending until claim succeeds
  // (avoids OtpPage bouncing to /login mid-claim).
  useAuthStore.getState().setJwtForClaim(data.jwt, data.user);

  try {
    const sessionId = await claimAdminPortalSession();
    if (!sessionId) {
      throw new Error("Could not start session. Please try again.");
    }
    useAuthStore
      .getState()
      .finishLogin(data.jwt, data.user, sessionId, data.branches || [], data.branchId);
  } catch (err: any) {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "";

    // Clear half-login JWT only — keep otpToken so OtpPage can show the error.
    useAuthStore.setState({
      jwt: null,
      user: null,
      adminSessionId: null,
    });

    throw new Error(
      status === 403 || /only admin/i.test(String(message))
        ? "Only admin users can sign in"
        : "Could not start session. Please try again."
    );
  }
}
