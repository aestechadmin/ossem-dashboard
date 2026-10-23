import { Box, Paper, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accent?: string;
  onClick?: () => void;
  delay?: number;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = "#0B2C34",
  onClick,
  delay = 0,
}: StatCardProps) {
  const clickable = Boolean(onClick);

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
      sx={{
        p: { xs: 2, sm: 2.5, xl: 3 },
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        background: "linear-gradient(160deg, #FFFFFF 0%, #F7FAFB 100%)",
        position: "relative",
        overflow: "hidden",
        cursor: clickable ? "pointer" : "default",
        animation: `fadeUp 0.45s ease ${delay}ms both`,
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
        boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
        "&:hover": clickable
          ? {
              transform: "translateY(-3px)",
              boxShadow: "0 12px 28px rgba(11, 44, 52, 0.1)",
              borderColor: accent,
              "& .stat-arrow": {
                bgcolor: accent,
                color: "#fff",
                transform: "translateX(2px)",
              },
            }
          : {
              transform: "translateY(-2px)",
              boxShadow: "0 10px 24px rgba(11, 44, 52, 0.08)",
            },
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box minWidth={0} flex={1}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            sx={{ fontSize: { xs: 12, xl: 13 } }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              mt: 0.75,
              mb: 0.5,
              letterSpacing: "-0.02em",
              fontSize: { xs: 26, sm: 30, xl: 34 },
              fontWeight: 600,
            }}
          >
            {value}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1.25} flexShrink={0}>
          {icon ? (
            <Box
              sx={{
                width: { xs: 40, xl: 46 },
                height: { xs: 40, xl: 46 },
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: `${accent}14`,
                color: accent,
                transition: "transform 0.25s ease",
                ".MuiPaper-root:hover &": { transform: "scale(1.06)" },
              }}
            >
              {icon}
            </Box>
          ) : null}

          {clickable ? (
            <Box
              className="stat-arrow"
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: `${accent}12`,
                color: accent,
                mt: icon ? 0 : "auto",
                transition: "background-color 0.2s ease, color 0.2s ease, transform 0.2s ease",
              }}
            >
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}
