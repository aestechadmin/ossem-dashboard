import { Box, CircularProgress, Grid, Paper, Tooltip, Typography } from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAttendances,
  fetchFees,
  fetchHostelOverview,
  fetchOverview,
  fetchStudentStats,
  type FeeSummary,
  type HostelOverviewStats,
  type OverviewStats,
  type StudentStats,
} from "@/api/adminPortal";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

/** Compact Indian amount — e.g. ₹1.25 Cr, ₹45.5 Lacs */
function formatCompactCurrency(value: number) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000;
    return `${sign}₹${cr.toLocaleString("en-IN", {
      maximumFractionDigits: cr >= 10 ? 1 : 2,
      minimumFractionDigits: 0,
    })} Cr`;
  }
  if (abs >= 1_00_000) {
    const lacs = abs / 1_00_000;
    return `${sign}₹${lacs.toLocaleString("en-IN", {
      maximumFractionDigits: lacs >= 10 ? 1 : 2,
      minimumFractionDigits: 0,
    })} Lacs`;
  }
  return `₹${formatNumber(amount)}`;
}

const chartPaperSx = {
  p: { xs: 2, sm: 2.5 },
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
  boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
  height: "100%",
  background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
} as const;

const chartAxisSx = {
  "& .MuiChartsAxis-line": { stroke: "rgba(11,44,52,0.12)" },
  "& .MuiChartsAxis-tick": { stroke: "rgba(11,44,52,0.12)" },
  "& .MuiChartsGrid-line": { stroke: "rgba(11,44,52,0.06)" },
} as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [hostelStats, setHostelStats] = useState<HostelOverviewStats | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [feeTotal, setFeeTotal] = useState(0);
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [overview, students, fees, hostel, attendance] = await Promise.all([
          fetchOverview(selectedBranchId),
          fetchStudentStats({ branch: selectedBranchId }),
          fetchFees({
            branch: selectedBranchId,
            kind: "total",
            page: 1,
            pageSize: 50,
          }),
          fetchHostelOverview(selectedBranchId),
          fetchAttendances({
            branch: selectedBranchId,
            page: 1,
            pageSize: 50,
          }),
        ]);
        if (active) {
          setStats(overview);
          setStudentStats(students);
          setFeeSummary(fees.summary || null);
          setFeeTotal(Number(fees.totalAmount) || 0);
          setHostelStats(hostel);
          setPresent(attendance.present || 0);
          setAbsent(attendance.absent || 0);
        }
      } catch (err: any) {
        if (active) {
          toastError(err, "Could not load dashboard totals.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedBranchId]);

  const studentLineData = useMemo(() => {
    const rows = [...(studentStats?.byAcademicYear || [])].sort((a, b) => {
      if (a.label === "Unassigned") return 1;
      if (b.label === "Unassigned") return -1;
      const yearA = Number(String(a.label).match(/(19|20)\d{2}/)?.[0] || 9999);
      const yearB = Number(String(b.label).match(/(19|20)\d{2}/)?.[0] || 9999);
      if (yearA !== yearB) return yearB - yearA;
      return a.label.localeCompare(b.label);
    });
    return {
      labels: rows.map((r) => r.label),
      values: rows.map((r) => r.value),
    };
  }, [studentStats]);

  const courseBarData = useMemo(() => {
    const rows = studentStats?.byCourse || [];
    const fullLabels = rows.map((r) => String(r.label || "").trim());
    const labels = fullLabels.map((name) =>
      name.length <= 18 ? name : `${name.slice(0, 18).trimEnd()}…`
    );
    return {
      labels,
      fullLabels,
      values: rows.map((r) => r.value),
    };
  }, [studentStats]);

  const feeChartData = useMemo(() => {
    const s = feeSummary;
    return {
      labels: ["Online", "Offline", "Advance", "Demand", "Adjust"],
      values: [
        s?.online?.amount || 0,
        s?.offline?.amount || 0,
        s?.advance?.amount || 0,
        s?.demand?.amount || 0,
        s?.adjust?.amount || 0,
      ],
    };
  }, [feeSummary]);

  const hostelChartData = useMemo(() => {
    return {
      labels: ["Vacant", "Occupied", "Partial", "Blocked", "Mens", "Women"],
      values: [
        hostelStats?.vacantRooms || 0,
        hostelStats?.occupiedRooms || 0,
        hostelStats?.partialOccupiedRooms || 0,
        hostelStats?.blockedRooms || 0,
        hostelStats?.mensHostelStudents || 0,
        hostelStats?.womenHostelStudents || 0,
      ],
    };
  }, [hostelStats]);

  const attendanceChartData = useMemo(
    () => ({
      labels: ["Present", "Absent"],
      values: [present, absent],
    }),
    [present, absent]
  );

  if (loading) {
    return (
      <Box minHeight={320} display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader subtitle="Student life cycle — tap a card to open students, fees, hostel, or attendance." />

      {/* 4 cards in one row */}
      <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={formatNumber(stats?.totalStudents || 0)}
            subtitle="Open students"
            accent="#0B2C34"
            icon={<GroupsRoundedIcon />}
            onClick={() => navigate("/students")}
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fees"
            value={formatCompactCurrency(feeTotal)}
            subtitle={`${formatNumber(feeTotal)} · Open fee report`}
            accent="#3A6B85"
            icon={<PaymentsRoundedIcon />}
            onClick={() => navigate("/fees")}
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hostel"
            value={formatNumber(stats?.totalHostels || 0)}
            subtitle="Open hostel"
            accent="#8B4A6B"
            icon={<HomeWorkRoundedIcon />}
            onClick={() => navigate("/hostel")}
            delay={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Attendance"
            value={formatNumber(stats?.totalAttendances || 0)}
            subtitle="Open attendance"
            accent="#1A7A6D"
            icon={<FactCheckRoundedIcon />}
            onClick={() => navigate("/attendance")}
            delay={120}
          />
        </Grid>
      </Grid>

      {/* 4 charts — one per card */}
      <Box sx={{ mt: { xs: 3, sm: 3.5, md: 4 } }}>
        <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 120ms both" }}>
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Students by academic year
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                Year-wise student count
              </Typography>
              {studentLineData.labels.length === 0 ? (
                <Box height={260} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">No student data yet</Typography>
                </Box>
              ) : (
                <LineChart
                  height={260}
                  series={[
                    {
                      data: studentLineData.values,
                      label: "Students",
                      color: "#0B2C34",
                      area: true,
                      curve: "monotoneX",
                      showMark: true,
                    },
                  ]}
                  xAxis={[
                    {
                      data: studentLineData.labels,
                      scaleType: "point",
                      tickLabelStyle: { fontSize: 10, fontFamily: "Josefin Sans" },
                    },
                  ]}
                  yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                  slotProps={{ legend: { hidden: true } }}
                  grid={{ horizontal: true }}
                  sx={{
                    ...chartAxisSx,
                    "& .MuiAreaElement-root": { fillOpacity: 0.18 },
                  }}
                />
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 160ms both" }}>
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Fees breakdown
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                Online / offline / advance / demand / adjust
              </Typography>
              <BarChart
                height={260}
                series={[
                  {
                    data: feeChartData.values,
                    label: "Amount",
                    color: "#3A6B85",
                    valueFormatter: (v) => formatCompactCurrency(v || 0),
                  },
                ]}
                xAxis={[
                  {
                    data: feeChartData.labels,
                    scaleType: "band",
                    tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                slotProps={{ legend: { hidden: true } }}
                borderRadius={4}
                grid={{ horizontal: true }}
                sx={chartAxisSx}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 200ms both" }}>
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Hostel overview
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                Rooms & hostel students
              </Typography>
              <BarChart
                height={260}
                series={[
                  {
                    data: hostelChartData.values,
                    label: "Count",
                    color: "#8B4A6B",
                    valueFormatter: (v) => formatNumber(v || 0),
                  },
                ]}
                xAxis={[
                  {
                    data: hostelChartData.labels,
                    scaleType: "band",
                    tickLabelStyle: { fontSize: 10, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                slotProps={{ legend: { hidden: true } }}
                borderRadius={4}
                grid={{ horizontal: true }}
                sx={chartAxisSx}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 240ms both" }}>
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Attendance — present vs absent
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                Student attendance marks
              </Typography>
              <BarChart
                height={260}
                series={[
                  {
                    data: attendanceChartData.values,
                    label: "Count",
                    color: "#1A7A6D",
                    valueFormatter: (v) => formatNumber(v || 0),
                  },
                ]}
                xAxis={[
                  {
                    data: attendanceChartData.labels,
                    scaleType: "band",
                    tickLabelStyle: { fontSize: 12, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                slotProps={{ legend: { hidden: true } }}
                borderRadius={4}
                grid={{ horizontal: true }}
                sx={chartAxisSx}
              />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 280ms both" }}>
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Students by course
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                Course-wise student count
              </Typography>
              {courseBarData.labels.length === 0 ? (
                <Box height={320} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">No course data yet</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "stretch", minHeight: 320 }}>
                  <Box
                    sx={{
                      width: 100,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-around",
                      py: "16px",
                      pb: "30px",
                      pr: 0.5,
                    }}
                  >
                    {courseBarData.fullLabels.map((full, index) => (
                      <Tooltip key={`${full}-${index}`} title={full} placement="right" arrow>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: 11,
                            fontFamily: '"Josefin Sans", sans-serif',
                            fontWeight: 500,
                            color: "text.primary",
                            textAlign: "right",
                            lineHeight: 1.2,
                            cursor: "default",
                            maxWidth: "100%",
                          }}
                        >
                          {courseBarData.labels[index]}
                        </Typography>
                      </Tooltip>
                    ))}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <BarChart
                      height={Math.max(320, courseBarData.labels.length * 28)}
                      layout="horizontal"
                      margin={{ left: 8, right: 16, top: 16, bottom: 30 }}
                      series={[
                        {
                          data: courseBarData.values,
                          label: "Students",
                          color: "#C45C3A",
                          valueFormatter: (value) => formatNumber(value || 0),
                        },
                      ]}
                      yAxis={[
                        {
                          data: courseBarData.fullLabels,
                          scaleType: "band",
                          tickLabelStyle: { fontSize: 0 },
                          disableLine: true,
                          disableTicks: true,
                          valueFormatter: (v) => String(v ?? ""),
                        },
                      ]}
                      xAxis={[
                        { tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } },
                      ]}
                      slotProps={{ legend: { hidden: true } }}
                      borderRadius={4}
                      grid={{ vertical: true }}
                      sx={{
                        ...chartAxisSx,
                        "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel": {
                          display: "none",
                        },
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
