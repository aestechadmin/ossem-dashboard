import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginWithPhone } from "@/api/auth";
import AuthHelp from "@/components/AuthHelp";
import AuthShell from "@/components/AuthShell";
import {
  AUTH_ERROR_STORAGE_KEY,
  SESSION_REVOKED_STORAGE_KEY,
  useAuthStore,
} from "@/store/authStore";
import { isJwtExpired } from "@/utils/jwt";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function LoginPage() {
  const navigate = useNavigate();
  const jwt = useAuthStore((s) => s.jwt);
  const adminSessionId = useAuthStore((s) => s.adminSessionId);
  const clearOtpPending = useAuthStore((s) => s.clearOtpPending);
  const setOtpPending = useAuthStore((s) => s.setOtpPending);

  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // After persist rehydrate only — do NOT depend on jwt (claim-session briefly
  // sets JWT without adminSessionId; a jwt-deps effect would abort login).
  useEffect(() => {
    if (!hasHydrated) return;
    const state = useAuthStore.getState();
    if (state.jwt && !state.adminSessionId) {
      state.logout();
    }
    if (sessionStorage.getItem(SESSION_REVOKED_STORAGE_KEY)) {
      sessionStorage.removeItem(SESSION_REVOKED_STORAGE_KEY);
      setError("Logged in on another device");
    }
    const authError = sessionStorage.getItem(AUTH_ERROR_STORAGE_KEY);
    if (authError) {
      sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
      setError(authError);
    }
  }, [hasHydrated]);

  // Never blank the login screen while waiting on hydrate — only gate the redirect
  if (hasHydrated && jwt && adminSessionId && !isJwtExpired(jwt)) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin() {
    // Clear OTP draft + any leftover JWT so /auth/local is a clean request.
    // Do not use logout() here — that races with claim-session after password login.
    clearOtpPending();
    useAuthStore.setState({
      jwt: null,
      user: null,
      adminSessionId: null,
    });

    const phone = digitsOnly(mobile);
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    const data = await loginWithPhone(phone);
    if (data.token) {
      setOtpPending(data.token, phone, "phone");
      navigate("/otp", { replace: true });
      return;
    }
    setError("OTP could not be sent");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await handleLogin();
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message?.[0]?.messages?.[0]?.message ||
        (typeof err?.response?.data?.message === "string"
          ? err.response.data.message
          : null);
      setError(apiMessage || err?.message || "Login failed");
      // Keep Network tab easy to debug
      console.warn("[login]", err?.response?.status, err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Enter your phone number to continue into the management console."
    >
      <Typography
        sx={{
          textAlign: "center",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: "#0B2C34",
          mb: 2,
          lineHeight: 1.2,
        }}
      >
        Sign in
      </Typography>

      <Box component="form" onSubmit={handleSubmit} display="grid" gap={2.1}>
        <TextField
          label="Mobile number"
          value={mobile}
          onChange={(e) => setMobile(digitsOnly(e.target.value).slice(0, 10))}
          placeholder="10-digit number"
          fullWidth
          required
          inputProps={{ inputMode: "numeric", maxLength: 10 }}
          helperText="We’ll send a one-time password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography fontWeight={600} color="text.secondary" fontSize={14}>
                  +91
                </Typography>
              </InputAdornment>
            ),
          }}
        />

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} className="auth-primary-btn">
          {loading ? <CircularProgress size={22} color="inherit" /> : "Send OTP"}
        </Button>
      </Box>

      <AuthHelp />
    </AuthShell>
  );
}
