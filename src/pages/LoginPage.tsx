import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginWithPassword, loginWithPhone } from "@/api/auth";
import { completeAdminLogin } from "@/api/completeLogin";
import AuthShell from "@/components/AuthShell";
import {
  AUTH_ERROR_STORAGE_KEY,
  SESSION_REVOKED_STORAGE_KEY,
  useAuthStore,
} from "@/store/authStore";
import { isJwtExpired } from "@/utils/jwt";

type Channel = "phone" | "email";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function LoginPage() {
  const navigate = useNavigate();
  const jwt = useAuthStore((s) => s.jwt);
  const adminSessionId = useAuthStore((s) => s.adminSessionId);
  const logout = useAuthStore((s) => s.logout);
  const setOtpPending = useAuthStore((s) => s.setOtpPending);

  const [channel, setChannel] = useState<Channel>("phone");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Drop half-finished login (JWT without admin session) so OTP claim cannot race
    if (jwt && !adminSessionId) {
      logout();
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
  }, [jwt, adminSessionId, logout]);

  if (jwt && adminSessionId && !isJwtExpired(jwt)) {
    return <Navigate to="/" replace />;
  }

  function handleChannelChange(value: Channel) {
    setChannel(value);
    setError("");
    if (value === "phone") {
      setEmail("");
      setPassword("");
    } else {
      setMobile("");
    }
  }

  async function handleLogin() {
    logout();

    if (channel === "phone") {
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
      return;
    }

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    const data = await loginWithPassword(email.trim(), password);
    if ("jwt" in data && data.jwt) {
      await completeAdminLogin(data);
      navigate("/", { replace: true });
      return;
    }
    if ("token" in data && data.token) {
      setOtpPending(data.token, email.trim(), "email", password);
      navigate("/otp", { replace: true });
      return;
    }
    setError("Unexpected login response");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await handleLogin();
    } catch (err: any) {
      setError(
        err?.message ||
          err?.response?.data?.error?.message ||
          err?.response?.data?.message?.[0]?.messages?.[0]?.message ||
          err?.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Choose phone or email to continue into the management console."
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0.5,
          mb: 3,
          p: 0.5,
          borderRadius: 2,
          bgcolor: "#EDF1F3",
        }}
      >
        {(
          [
            { value: "phone" as const, label: "Phone", icon: <PhoneIphoneRoundedIcon sx={{ fontSize: 15 }} /> },
            { value: "email" as const, label: "Email", icon: <EmailRoundedIcon sx={{ fontSize: 15 }} /> },
          ] as const
        ).map((item) => {
          const active = channel === item.value;
          return (
            <Box
              key={item.value}
              role="button"
              tabIndex={0}
              onClick={() => handleChannelChange(item.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleChannelChange(item.value);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                py: 1.15,
                borderRadius: 1.5,
                cursor: "pointer",
                fontFamily: '"Josefin Sans", sans-serif',
                fontWeight: 600,
                fontSize: 13,
                userSelect: "none",
                color: active ? "#0A2E36" : "#5C6B73",
                bgcolor: active ? "#fff" : "transparent",
                boxShadow: active ? "0 6px 16px rgba(10,46,54,0.08)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {item.icon}
              {item.label}
            </Box>
          );
        })}
      </Box>

      <Box component="form" onSubmit={handleSubmit} display="grid" gap={2.1}>
        {channel === "phone" ? (
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
        ) : (
          <>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailRoundedIcon fontSize="small" sx={{ color: "#5C6B73" }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRoundedIcon fontSize="small" sx={{ color: "#5C6B73" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        )}

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} className="auth-primary-btn">
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : channel === "phone" ? (
            "Send OTP"
          ) : (
            "Continue"
          )}
        </Button>
      </Box>
    </AuthShell>
  );
}
