import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

/** Page name lives in the AppBar. Use this only for optional subtitle / actions. */
type PageHeaderProps = {
  subtitle?: string;
  action?: ReactNode;
};

export default function PageHeader({ subtitle, action }: PageHeaderProps) {
  if (!subtitle && !action) return null;

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      gap={2}
      mb={{ xs: 2, md: 2.5 }}
      flexWrap="wrap"
      sx={{ animation: "fadeUp 0.4s ease both" }}
    >
      {subtitle ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 640, lineHeight: 1.65, fontSize: { xs: 13, md: 14 } }}
        >
          {subtitle}
        </Typography>
      ) : (
        <Box flex={1} />
      )}
      {action}
    </Box>
  );
}
