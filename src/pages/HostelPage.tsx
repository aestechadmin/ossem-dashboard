import { Box, Grid, Paper, Typography } from "@mui/material";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import DomainRoundedIcon from "@mui/icons-material/DomainRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHostelOverview, type HostelOverviewStats } from "@/api/adminPortal";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { toastError } from "@/store/toastStore";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export default function HostelPage() {
  const navigate = useNavigate();
  const { selectedBranchId, courseKey, courseName, ready } = useSelectedCourse();
  const [stats, setStats] = useState<HostelOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchHostelOverview(selectedBranchId, {
          course: courseKey,
        });
        if (active) setStats(data);
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load hostel data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [ready, selectedBranchId, courseKey]);

  const hostelChart = useMemo(
    () => ({
      labels: [
        "Vacant",
        "Occupied",
        "Partial",
        "Blocked",
        "Total Students",
      ],
      values: [
        stats?.vacantRooms || 0,
        stats?.occupiedRooms || 0,
        stats?.partialOccupiedRooms || 0,
        stats?.blockedRooms || 0,
        stats?.totalHostelStudents || 0,
      ],
    }),
    [stats]
  );

  if (loading) {
    return (
      <Box>
        <PageHeader
          subtitle={`${courseName} — hostel students for this course; rooms are campus-wide.`}
        />
        <PageSkeleton cards={4} charts={2} table={false} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        subtitle={`${courseName} — hostel students for this course; rooms are campus-wide.`}
      />

      <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
        {/* 1st row — campus-wide (does not change with course) · 6 per row */}
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Hostels"
            value={formatNumber(stats?.totalHostels || 0)}
            subtitle="Student hostels"
            accent="#0B2C34"
            icon={<HomeWorkRoundedIcon />}
            onClick={() => navigate("/hostel/hostels")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Quarters"
            value={formatNumber(stats?.totalQuarters || 0)}
            subtitle="Rooms in student hostels"
            accent="#1A7A6D"
            icon={<ApartmentRoundedIcon />}
            onClick={() => navigate("/hostel/rooms")}
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Blocks"
            value={formatNumber(stats?.totalBlocks || 0)}
            subtitle="All hostel blocks"
            accent="#3A6B85"
            icon={<DomainRoundedIcon />}
            onClick={() => navigate("/hostel/blocks")}
            delay={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Vacant"
            value={formatNumber(stats?.vacantRooms || 0)}
            subtitle="Available rooms"
            accent="#2F6F6A"
            icon={<CheckCircleOutlineRoundedIcon />}
            onClick={() => navigate("/hostel/rooms-vacant")}
            delay={120}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Occupied"
            value={formatNumber(stats?.occupiedRooms || 0)}
            subtitle="Fully occupied"
            accent="#8B4A6B"
            icon={<PersonRoundedIcon />}
            onClick={() => navigate("/hostel/rooms-occupied")}
            delay={160}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Partial Occupied"
            value={formatNumber(stats?.partialOccupiedRooms || 0)}
            subtitle="Partially filled"
            accent="#C45C26"
            icon={<GroupsRoundedIcon />}
            onClick={() => navigate("/hostel/rooms-partial")}
            delay={200}
          />
        </Grid>

        {/* Bottom — course-scoped (changes when course changes) */}
        <Grid item xs={12}>
          <StatCard
            title="Total Students in Hostel"
            value={formatNumber(stats?.totalHostelStudents || 0)}
            subtitle={`${courseName} · in student hostel rooms`}
            accent="#0B2C34"
            icon={<GroupsRoundedIcon />}
            onClick={() => navigate("/hostel/students")}
            delay={240}
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
              animation: "fadeUp 0.5s ease 180ms both",
              background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
            >
              Hostel status
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              {`${courseName} hostel students with campus-wide room availability`}
            </Typography>
            <LineChart
              height={280}
              series={[
                {
                  data: hostelChart.values,
                  label: "Count",
                  color: "#1A7A6D",
                  area: true,
                  curve: "monotoneX",
                  showMark: true,
                },
              ]}
              xAxis={[
                {
                  data: hostelChart.labels,
                  scaleType: "point",
                  tickLabelStyle: { fontSize: 10, fontFamily: "Josefin Sans" },
                },
              ]}
              yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
              slotProps={{ legend: { hidden: true } }}
              grid={{ horizontal: true }}
              sx={{
                "& .MuiAreaElement-root": { fillOpacity: 0.18 },
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
