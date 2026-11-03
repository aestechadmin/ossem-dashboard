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
};

function CardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        background: "linear-gradient(160deg, #FFFFFF 0%, #F7FAFB 100%)",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Skeleton variant="text" width="42%" height={18} />
        <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 1 }} />
      </Box>
      <Skeleton variant="text" width="55%" height={36} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="70%" height={16} />
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

function TableSkeleton() {
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
      {Array.from({ length: 8 }).map((_, i) => (
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

/** Shared page loading skeleton — same look on dashboard & list pages. */
export default function PageSkeleton({
  cards = 4,
  charts = 0,
  table = true,
  wideChart = false,
}: PageSkeletonProps) {
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
            <Grid item xs={12} md={6} key={`chart-${i}`}>
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
