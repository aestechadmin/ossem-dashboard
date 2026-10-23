import { Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDepartments, type DepartmentStats } from "@/api/adminPortal";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchDepartments(selectedBranchId);
        if (active) setStats(data);
      } catch (err: unknown) {
        if (active) {
          toastError(err, "Could not load department data.");
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

  const chart = useMemo(
    () => ({
      labels: ["Departments", "Courses", "Specializations", "Classrooms", "Subjects"],
      values: [
        stats?.totalDepartments || 0,
        stats?.totalCourses || 0,
        stats?.totalSpecializations || 0,
        stats?.totalClassrooms || 0,
        stats?.totalSubjects || 0,
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
      <PageHeader subtitle="Tap a card to open the full list for that category." />

      <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Departments"
            value={formatNumber(stats?.totalDepartments || 0)}
            subtitle="View department list"
            accent="#8B4A6B"
            icon={<ApartmentRoundedIcon />}
            onClick={() => navigate("/departments/list")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Courses"
            value={formatNumber(stats?.totalCourses || 0)}
            subtitle="View course list"
            accent="#0B2C34"
            icon={<MenuBookRoundedIcon />}
            onClick={() => navigate("/departments/courses")}
            delay={50}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Specializations"
            value={formatNumber(stats?.totalSpecializations || 0)}
            subtitle="View specialization list"
            accent="#1A7A6D"
            icon={<CategoryRoundedIcon />}
            onClick={() => navigate("/departments/specializations")}
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Classrooms"
            value={formatNumber(stats?.totalClassrooms || 0)}
            subtitle="View classroom list"
            accent="#C45C3A"
            icon={<MeetingRoomRoundedIcon />}
            onClick={() => navigate("/departments/classrooms")}
            delay={150}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Subjects"
            value={formatNumber(stats?.totalSubjects || 0)}
            subtitle="View subject list"
            accent="#3A6B85"
            icon={<SubjectRoundedIcon />}
            onClick={() => navigate("/departments/subjects")}
            delay={200}
          />
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
              animation: "fadeUp 0.5s ease 220ms both",
              background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
            >
              Academics overview
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              Departments, courses, specializations, classrooms and subjects
            </Typography>
            <BarChart
              height={300}
              series={[
                {
                  data: chart.values,
                  label: "Count",
                  color: "#0B2C34",
                },
              ]}
              xAxis={[
                {
                  data: chart.labels,
                  scaleType: "band",
                  tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" },
                },
              ]}
              yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
              slotProps={{ legend: { hidden: true } }}
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
      </Grid>
    </Box>
  );
}
