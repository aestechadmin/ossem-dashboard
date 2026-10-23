import { Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import DomainRoundedIcon from "@mui/icons-material/DomainRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHostelOverview, type HostelOverviewStats } from "@/api/adminPortal";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export default function HostelPage() {
  const navigate = useNavigate();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [stats, setStats] = useState<HostelOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchHostelOverview(selectedBranchId);
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
  }, [selectedBranchId]);

  const chart = useMemo(
    () => ({
      labels: ["Vacant", "Occupied", "Partial", "Blocked"],
      values: [
        stats?.vacantRooms || 0,
        stats?.occupiedRooms || 0,
        stats?.partialOccupiedRooms || 0,
        stats?.blockedRooms || 0,
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
      <PageHeader subtitle="Tap a card to open hostels, quarters, blocks, or rooms." />

      <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Hostels"
            value={formatNumber(stats?.totalHostels || 0)}
            subtitle="Student hostels"
            accent="#0B2C34"
            icon={<HomeWorkRoundedIcon />}
            onClick={() => navigate("/hostel/hostels")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Quarters"
            value={formatNumber(stats?.totalQuarters || 0)}
            subtitle="Rooms in student hostels (GEMS style)"
            accent="#1A7A6D"
            icon={<ApartmentRoundedIcon />}
            onClick={() => navigate("/hostel/rooms")}
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Rooms"
            value={formatNumber(stats?.totalRooms || 0)}
            subtitle="Same as student-hostel rooms"
            accent="#C45C3A"
            icon={<MeetingRoomRoundedIcon />}
            onClick={() => navigate("/hostel/rooms")}
            delay={120}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vacant"
            value={formatNumber(stats?.vacantRooms || 0)}
            subtitle="Available rooms"
            accent="#2F6F6A"
            icon={<CheckCircleOutlineRoundedIcon />}
            onClick={() => navigate("/hostel/rooms")}
            delay={160}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Occupied"
            value={formatNumber(stats?.occupiedRooms || 0)}
            subtitle="Fully occupied"
            accent="#8B4A6B"
            icon={<PersonRoundedIcon />}
            onClick={() => navigate("/hostel/rooms")}
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Partial Occupied"
            value={formatNumber(stats?.partialOccupiedRooms || 0)}
            subtitle="Partially filled"
            accent="#C45C26"
            icon={<GroupsRoundedIcon />}
            onClick={() => navigate("/hostel/rooms")}
            delay={240}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Blocked/Repair"
            value={formatNumber(stats?.blockedRooms || 0)}
            subtitle="Not available"
            accent="#6B4E71"
            icon={<BuildRoundedIcon />}
            onClick={() => navigate("/hostel/rooms")}
            delay={280}
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
              Room status
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              Vacant, occupied, partial, and blocked rooms for the selected branch
            </Typography>
            <BarChart
              height={280}
              series={[
                {
                  data: chart.values,
                  label: "Rooms",
                  color: "#C45C3A",
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
