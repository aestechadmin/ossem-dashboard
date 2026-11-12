import { Box, Grid, Paper, Skeleton } from "@mui/material";

type PageSkeletonProps = {
  /** Stat cards on top — dashboard uses 4 */
  cards?: number;
  /** Chart placeholders — dashboard uses 4 (+ course full width) */
  charts?: number;
  /** Table block under cards */
  table?: boolean;
  /** Full-width course-style chart at bottom */
  wideChart?: boolean;
  /** Match home dashboard: filters+cards left, chart right */
  variant?: "default" | "dashboard";
};

function CardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? { xs: 1.25, sm: 1.5 } : { xs: 2, sm: 2.5 },
        height: compact ? 88 : "100%",
        minHeight: compact ? 88 : undefined,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        background: "linear-gradient(160deg, #FFFFFF 0%, #F7FAFB 100%)",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={compact ? 0.75 : 1.5}>
        <Skeleton variant="text" width="42%" height={compact ? 14 : 18} />
        <Skeleton
          variant="rounded"
          width={compact ? 28 : 36}
          height={compact ? 28 : 36}
          sx={{ borderRadius: 1 }}
        />
      </Box>
      <Skeleton variant="text" width="55%" height={compact ? 28 : 36} sx={{ mb: 0.5 }} />
      {!compact ? <Skeleton variant="text" width="70%" height={16} /> : null}
    </Paper>
  );
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
      }}
    >
      <Skeleton variant="text" width="48%" height={22} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="36%" height={16} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={height} sx={{ borderRadius: 1 }} />
    </Paper>
  );
}

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        background: "#fff",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Skeleton variant="rounded" width={220} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Box>
      <Skeleton variant="rounded" width="100%" height={36} sx={{ mb: 1.5, borderRadius: 1 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          width="100%"
          height={44}
          sx={{ mb: 1, borderRadius: 1, opacity: 1 - i * 0.06 }}
        />
      ))}
    </Paper>
  );
}

function DashboardSkeleton({ table }: { table: boolean }) {
  return (
    <Box aria-busy="true" aria-label="Loading">
      <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mb: 1 }} alignItems="stretch">
        <Grid item xs={12} md={5}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
            <Skeleton variant="text" width={56} height={20} />
            <Box sx={{ display: "flex", gap: 1.25 }}>
              <Skeleton variant="rounded" height={48} sx={{ flex: 1, borderRadius: 1 }} />
              <Skeleton variant="rounded" height={48} sx={{ flex: 1, borderRadius: 1 }} />
            </Box>
            <CardSkeleton />
            <CardSkeleton />
          </Box>
        </Grid>
        <Grid item xs={12} md={7}>
          <ChartSkeleton height={280} />
        </Grid>
      </Grid>

      {table ? (
        <Box sx={{ mt: { xs: 3, sm: 3.5, md: 4 } }}>
          <Box sx={{ mb: 1.5 }}>
            <Skeleton variant="text" width={180} height={24} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={220} height={16} />
          </Box>
          <TableSkeleton rows={6} />
        </Box>
      ) : null}
    </Box>
  );
}

/** Shared page loading skeleton — same look on dashboard & list pages. */
export default function PageSkeleton({
  cards = 4,
  charts = 0,
  table = true,
  wideChart = false,
  variant = "default",
}: PageSkeletonProps) {
  if (variant === "dashboard") {
    return <DashboardSkeleton table={table} />;
  }

  const cardMd = cards >= 4 ? 3 : cards === 3 ? 4 : 6;

  return (
    <Box aria-busy="true" aria-label="Loading">
      {cards > 0 ? (
        <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }} sx={{ mb: table || charts > 0 ? 2.5 : 0 }}>
          {Array.from({ length: cards }).map((_, i) => (
            <Grid item xs={12} sm={6} md={cardMd} key={`card-${i}`}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : null}

      {charts > 0 ? (
        <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }} sx={{ mb: table || wideChart ? 2.5 : 0 }}>
          {Array.from({ length: charts }).map((_, i) => (
            <Grid item xs={12} md={charts === 1 ? 12 : 6} key={`chart-${i}`}>
              <ChartSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : null}

      {wideChart ? (
        <Box sx={{ mb: table ? 2.5 : 0 }}>
          <ChartSkeleton height={320} />
        </Box>
      ) : null}

      {table ? <TableSkeleton /> : null}
    </Box>
  );
}
