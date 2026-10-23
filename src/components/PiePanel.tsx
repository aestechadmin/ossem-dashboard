import { Box, Paper, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import type { PieSlice } from "@/api/adminPortal";

const COLORS = ["#0B2C34", "#1A7A6D", "#C45C3A", "#3A6B85", "#C4A035", "#8B4A6B", "#2D5A4A"];

type PiePanelProps = {
  title: string;
  data: PieSlice[];
  delay?: number;
};

export default function PiePanel({ title, data, delay = 0 }: PiePanelProps) {
  // Show every slice — totals must match full count (no truncation)
  const chartData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: COLORS[index % COLORS.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        minHeight: { xs: 340, md: 380 },
        boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
        animation: `fadeUp 0.5s ease ${delay}ms both`,
        background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5} gap={1}>
        <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 18 }, fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {total.toLocaleString("en-IN")} total
        </Typography>
      </Box>
      {chartData.length === 0 ? (
        <Box height={280} display="flex" alignItems="center" justifyContent="center">
          <Typography color="text.secondary">No data for selected filters</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: 1,
          }}
        >
          <PieChart
            series={[
              {
                data: chartData,
                innerRadius: 58,
                outerRadius: 100,
                paddingAngle: 3,
                cornerRadius: 3,
                highlightScope: { fade: "global", highlight: "item" },
                faded: { innerRadius: 50, additionalRadius: -6, color: "gray" },
                valueFormatter: (item) =>
                  `${item.value} (${total ? Math.round((Number(item.value) / total) * 100) : 0}%)`,
                arcLabel: (item) =>
                  total && Number(item.value) / total > 0.12
                    ? `${Math.round((Number(item.value) / total) * 100)}%`
                    : "",
                arcLabelMinAngle: 20,
              },
            ]}
            height={280}
            width={280}
            margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
            slotProps={{
              legend: { hidden: true },
            }}
            sx={{
              "& .MuiPieArc-root": {
                transition: "opacity 0.2s ease, filter 0.2s ease",
                stroke: "#fff",
                strokeWidth: 2,
              },
            }}
          />
          <Box flex={1} width="100%" maxHeight={280} overflow="auto" pr={0.5}>
            {chartData.map((item) => (
              <Box
                key={item.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                py={0.75}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box display="flex" alignItems="center" gap={1} minWidth={0}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: 0.5,
                      bgcolor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" noWrap fontWeight={500} sx={{ fontSize: 13 }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {item.value.toLocaleString("en-IN")}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
