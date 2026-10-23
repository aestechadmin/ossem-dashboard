import { Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchOverview,
  fetchStudentStats,
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [overview, students] = await Promise.all([
          fetchOverview(selectedBranchId),
          fetchStudentStats({ branch: selectedBranchId }),
        ]);
        if (active) {
          setStats(overview);
          setStudentStats(students);
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

  const barData = useMemo(() => {
    const rows = studentStats?.byCourse || [];
    return {
      labels: rows.map((r) => r.label),
      values: rows.map((r) => r.value),
    };
  }, [studentStats]);

  const lineData = useMemo(() => {
    const rows = studentStats?.byAcademicYear || [];
    return {
      labels: rows.map((r) => r.label),
      values: rows.map((r) => r.value),
    };
  }, [studentStats]);

  const overviewBars = useMemo(
    () => ({
      labels: ["Students", "Admissions", "Employees", "Attendance"],
      values: [
        stats?.totalStudents || 0,
        stats?.totalAdmissions || 0,
        stats?.totalEmployees || 0,
        stats?.totalAttendances || 0,
      ],
    }),
    [stats]
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
      <PageHeader subtitle="Tap a card to open students, admissions, employees, or attendance." />

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
            title="Total Admissions"
            value={formatNumber(stats?.totalAdmissions || 0)}
            subtitle="Open admissions"
            accent="#1A7A6D"
            icon={<HowToRegRoundedIcon />}
            onClick={() => navigate("/admissions")}
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={formatNumber(stats?.totalEmployees || 0)}
            subtitle="Open employees"
            accent="#3A6B85"
            icon={<BadgeRoundedIcon />}
            onClick={() => navigate("/employees")}
            delay={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Attendance"
            value={formatNumber(stats?.totalAttendances || 0)}
            subtitle="Open attendance"
            accent="#8B4A6B"
            icon={<FactCheckRoundedIcon />}
            onClick={() => navigate("/attendance")}
            delay={120}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: { xs: 3, sm: 3.5, md: 4 } }}>
        <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
          <Grid item xs={12} lg={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
                animation: "fadeUp 0.5s ease 120ms both",
                height: "100%",
                background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Overview counts
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                Students, admissions, employees & attendance
              </Typography>
              <BarChart
                height={280}
                series={[
                  {
                    data: overviewBars.values,
                    label: "Count",
                    color: "#0B2C34",
                  },
                ]}
                xAxis={[
                  {
                    data: overviewBars.labels,
                    scaleType: "band",
                    tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                slotProps={{
                  legend: { hidden: true },
                }}
                borderRadius={4}
                grid={{ horizontal: true }}
                sx={{
                  "& .MuiChartsAxis-line": { stroke: "rgba(11,44,52,0.12)" },
                  "& .MuiChartsAxis-tick": { stroke: "rgba(11,44,52,0.12)" },
                  "& .MuiChartsGrid-line": { stroke: "rgba(11,44,52,0.06)" },
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
                animation: "fadeUp 0.5s ease 180ms both",
                height: "100%",
                background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
              }}
            >
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
                Line trend across years
              </Typography>
              {lineData.labels.length === 0 ? (
                <Box height={280} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">No student data yet</Typography>
                </Box>
              ) : (
                <LineChart
                  height={280}
                  series={[
                    {
                      data: lineData.values,
                      label: "Students",
                      color: "#1A7A6D",
                      area: true,
                      curve: "monotoneX",
                      showMark: true,
                    },
                  ]}
                  xAxis={[
                    {
                      data: lineData.labels,
                      scaleType: "point",
                      tickLabelStyle: { fontSize: 10, fontFamily: "Josefin Sans" },
                    },
                  ]}
                  yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                  grid={{ horizontal: true }}
                  sx={{
                    "& .MuiAreaElement-root": { fillOpacity: 0.18 },
                    "& .MuiChartsAxis-line": { stroke: "rgba(11,44,52,0.12)" },
                    "& .MuiChartsAxis-tick": { stroke: "rgba(11,44,52,0.12)" },
                    "& .MuiChartsGrid-line": { stroke: "rgba(11,44,52,0.06)" },
                  }}
                />
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
                animation: "fadeUp 0.5s ease 240ms both",
                background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
              }}
            >
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
              {barData.labels.length === 0 ? (
                <Box height={420} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">No course data yet</Typography>
                </Box>
              ) : (
                <BarChart
                  height={440}
                  layout="horizontal"
                  margin={{ left: 100, right: 16, top: 16, bottom: 30 }}
                  series={[
                    {
                      data: barData.values,
                      label: "Students",
                      color: "#C45C3A",
                    },
                  ]}
                  yAxis={[
                    {
                      data: barData.labels,
                      scaleType: "band",
                      tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" },
                    },
                  ]}
                  xAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                  borderRadius={4}
                  grid={{ vertical: true }}
                  sx={{
                    "& .MuiChartsAxis-line": { stroke: "rgba(11,44,52,0.12)" },
                    "& .MuiChartsAxis-tick": { stroke: "rgba(11,44,52,0.12)" },
                    "& .MuiChartsGrid-line": { stroke: "rgba(11,44,52,0.06)" },
                  }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
