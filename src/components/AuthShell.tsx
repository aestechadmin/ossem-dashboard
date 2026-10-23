import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import OssemLogo from "@/components/OssemLogo";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <Box
      minHeight="100vh"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.08fr 0.92fr" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 300, lg: "100vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          px: { xs: 3, sm: 5, lg: 7 },
          py: { xs: 4, lg: 7 },
          color: "#F7FAFB",
          overflow: "hidden",
          backgroundColor: "#07181D",
          backgroundImage: `
            radial-gradient(ellipse 100% 80% at -10% -20%, rgba(196,92,58,0.4), transparent 55%),
            radial-gradient(ellipse 90% 70% at 110% 110%, rgba(26,122,109,0.35), transparent 50%),
            linear-gradient(160deg, #061317 0%, #0B2C34 52%, #0D3D47 100%)
          `,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            pointerEvents: "none",
          },
        }}
      >
        <Box position="relative" zIndex={1}>
          <Box sx={{ mb: { xs: 3.5, lg: 5 } }}>
            <OssemLogo
              maxWidth={420}
              sx={{
                maxWidth: { xs: 280, sm: 360, lg: 440 },
                width: "100%",
              }}
            />
          </Box>

          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(247,250,251,0.48)",
              mb: 2,
            }}
          >
            OSSEM
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: 36, sm: 44, lg: 52 },
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              maxWidth: 460,
              mb: 2.5,
            }}
          >
            A quieter way to run the institution.
          </Typography>

          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1.75,
              color: "rgba(247,250,251,0.62)",
              maxWidth: 400,
            }}
          >
            Sign in to review academics, admissions, departments, and fee totals — with a session
            locked to one device.
          </Typography>
        </Box>

        <Box
          position="relative"
          zIndex={1}
          sx={{
            display: { xs: "none", lg: "block" },
            pt: 2,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            maxWidth: 420,
          }}
        >
          <Typography
            sx={{
              fontStyle: "italic",
              fontSize: 17,
              lineHeight: 1.55,
              color: "rgba(247,250,251,0.72)",
              mb: 1.5,
            }}
          >
            Designed for operators who need clarity, not clutter.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2.5, sm: 4, md: 6 },
          py: { xs: 4, md: 6 },
          bgcolor: "#EEF2F4",
          backgroundImage:
            "radial-gradient(ellipse at top right, rgba(26,122,109,0.07), transparent 45%)",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.45s ease both" }}>
          <Typography
            sx={{
              fontSize: { xs: 30, sm: 36 },
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#0F1C20",
              mb: 1,
              lineHeight: 1.15,
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              sx={{
                fontSize: 14,
                color: "#5A6A72",
                lineHeight: 1.7,
                mb: 3.5,
              }}
            >
              {subtitle}
            </Typography>
          ) : (
            <Box mb={3} />
          )}

          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 1,
              p: { xs: 2.75, sm: 3.25 },
              border: "1px solid rgba(11,44,52,0.08)",
              boxShadow: "0 18px 48px rgba(11,44,52,0.06)",
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "#F4F7F8",
                "& fieldset": { borderColor: "transparent" },
                "&:hover": {
                  bgcolor: "#EEF2F4",
                  "& fieldset": { borderColor: "rgba(11,44,52,0.12)" },
                },
                "&.Mui-focused": {
                  bgcolor: "#fff",
                  "& fieldset": {
                    borderColor: "#0B2C34",
                    borderWidth: 1.5,
                  },
                  boxShadow: "0 0 0 4px rgba(11,44,52,0.06)",
                },
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                fontSize: 13,
              },
              "& .MuiInputBase-input": {
                fontSize: 14.5,
                py: 1.55,
              },
              "& .auth-primary-btn": {
                mt: 0.75,
                py: 1.4,
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: 14.5,
                letterSpacing: "0.02em",
                bgcolor: "#0B2C34",
                boxShadow: "0 12px 28px rgba(11,44,52,0.2)",
                transition: "transform 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  bgcolor: "#061A1F",
                  transform: "translateY(-1px)",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(11,44,52,0.35)",
                  color: "rgba(255,255,255,0.85)",
                },
              },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
