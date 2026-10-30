import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import SmsRoundedIcon from "@mui/icons-material/SmsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginWithPhone, verifyOtp } from "@/api/auth";
import { completeAdminLogin } from "@/api/completeLogin";
import AuthHelp from "@/components/AuthHelp";
import AuthShell from "@/components/AuthShell";
import { useAuthStore } from "@/store/authStore";
import { isJwtExpired } from "@/utils/jwt";

export default function OtpPage() {
  const navigate = useNavigate();
  const jwt = useAuthStore((s) => s.jwt);
  const adminSessionId = useAuthStore((s) => s.adminSessionId);
  const otpToken = useAuthStore((s) => s.otpToken);
  const loginIdentifier = useAuthStore((s) => s.loginIdentifier);
  const setOtpPending = useAuthStore((s) => s.setOtpPending);
  const clearOtpPending = useAuthStore((s) => s.clearOtpPending);

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submittingRef = useRef(false);

  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function submitOtp(otpCode: string) {
    if (otpCode.length < 6 || submittingRef.current) return;
    submittingRef.current = true;
    setError("");
    setLoading(true);
    try {
      const token = useAuthStore.getState().otpToken;
      if (!token) {
        setError("Session expired. Please sign in again.");
        navigate("/login", { replace: true });
        return;
      }
      const data = await verifyOtp(token, otpCode);
      if (!data?.jwt) {
        setError("OTP verified but login token was missing. Try again.");
        return;
      }
      await completeAdminLogin(data);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(
        err?.message ||
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  // Auto-submit when all 6 digits are filled (typing or paste)
  useEffect(() => {
    if (code.length === 6 && otpToken && !loading) {
      void submitOtp(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when code becomes complete
  }, [code]);

  // Only leave OTP after full login (JWT + admin session). Mid-claim JWT alone must stay here.
  if (jwt && adminSessionId && !isJwtExpired(jwt)) {
    return <Navigate to="/" replace />;
  }
  if (!otpToken && !loading) return <Navigate to="/login" replace />;

  function updateDigit(index: number, value: string) {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = nextValue;
    setDigits(next);
    if (nextValue && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handlePaste(pasted: string) {
    const sanitized = pasted.replace(/\D/g, "").slice(0, 6);
    if (!sanitized) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < sanitized.length; i++) next[i] = sanitized[i];
    setDigits(next);
    inputsRef.current[Math.min(sanitized.length, 5)]?.focus();
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (code.length < 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    await submitOtp(code);
  }

  async function handleResend() {
    if (!loginIdentifier || secondsLeft > 0) return;
    setResending(true);
    setError("");
    try {
      const data = await loginWithPhone(loginIdentifier);
      setOtpPending(data.token, loginIdentifier, "phone");
      setDigits(["", "", "", "", "", ""]);
      setSecondsLeft(60);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Could not resend OTP");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Check your phone" subtitle="Enter the six-digit code to verify your session.">
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => {
          clearOtpPending();
          navigate("/login");
        }}
        sx={{
          mb: 2.5,
          px: 0,
          color: "#5C6B73",
          fontWeight: 500,
          fontSize: 13,
          "&:hover": { bgcolor: "transparent", color: "#0A2E36" },
        }}
      >
        Back to sign in
      </Button>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          p: 1.75,
          borderRadius: 2,
          bgcolor: "#F4F7F8",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#0A2E36",
            color: "#fff",
          }}
        >
          <SmsRoundedIcon fontSize="small" />
        </Box>
        <Box minWidth={0}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#5C6B73", letterSpacing: "0.04em" }}>
            SENT TO
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
            {loginIdentifier ? `+91 ${loginIdentifier}` : "—"}
          </Typography>
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <Box
          display="flex"
          justifyContent="space-between"
          gap={1}
          mb={2.5}
          onPaste={(e) => {
            e.preventDefault();
            handlePaste(e.clipboardData.getData("text/plain"));
          }}
        >
          {digits.map((digit, index) => (
            <TextField
              key={index}
              value={digit}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e.key)}
              inputRef={(el) => {
                inputsRef.current[index] = el;
              }}
              inputProps={{
                inputMode: "numeric",
                maxLength: 1,
                style: {
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  fontFamily: '"Josefin Sans", sans-serif',
                  padding: "13px 0",
                },
              }}
              error={Boolean(error)}
              sx={{ flex: 1, maxWidth: 52 }}
            />
          ))}
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading || code.length < 6}
          className="auth-primary-btn"
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : "Verify & continue"}
        </Button>
      </Box>

      <Box mt={3} textAlign="center">
        <Typography sx={{ fontSize: 13, color: "#5C6B73", mb: 0.75 }}>
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Didn’t receive a code?"}
        </Typography>
        <Button
          onClick={handleResend}
          disabled={secondsLeft > 0 || resending}
          sx={{ fontWeight: 600, color: "#B85A2E", fontSize: 13 }}
        >
          {resending ? "Sending…" : "Resend OTP"}
        </Button>
      </Box>

      <AuthHelp />
    </AuthShell>
  );
}
