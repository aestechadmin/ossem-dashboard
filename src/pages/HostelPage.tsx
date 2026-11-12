import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import DomainRoundedIcon from "@mui/icons-material/DomainRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchFilters,
  fetchHostelOverview,
  type HostelOverviewStats,
  type PortalFilters,
} from "@/api/adminPortal";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useFilterStore } from "@/store/filterStore";
import { usePortalCacheStore } from "@/store/portalCacheStore";
import { toastError } from "@/store/toastStore";
import { getCascadedOptions, pruneStudentFilters } from "@/utils/cascadeFilters";

const emptyFilters: PortalFilters = {
  courses: [],
  specializations: [],
  academicYears: [],
  courseYears: [],
  classrooms: [],
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function hostelCacheKey(
  branchId: number | null | undefined,
  courseKey: string,
  filters: {
    academicYear: string;
    courseYear: string;
    hostel: string;
    room: string;
    category: string;
  }
) {
  return [
    branchId ?? "",
    courseKey,
    filters.academicYear,
    filters.courseYear,
    filters.hostel,
    filters.room,
    filters.category,
  ].join("|");
}

export default function HostelPage() {
  const navigate = useNavigate();
  const { selectedBranchId, courseKey, courseName, ready } = useSelectedCourse();
  const filters = useFilterStore((s) => s.hostel);
  const setHostelFilters = useFilterStore((s) => s.setHostelFilters);
  const setStudentFilters = useFilterStore((s) => s.setStudentFilters);
  const cached = usePortalCacheStore((s) => s.hostelOverview);
  const setHostelOverviewCache = usePortalCacheStore((s) => s.setHostelOverview);

  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyFilters);
  const cacheKey = hostelCacheKey(selectedBranchId, courseKey, filters);
  const [stats, setStats] = useState<HostelOverviewStats | null>(
    cached?.key === cacheKey ? cached.data : null
  );
  const [loading, setLoading] = useState(!(cached?.key === cacheKey && cached.data));

  const options = useMemo(
    () =>
      getCascadedOptions(allOptions, {
        course: courseKey,
        specialization: "",
        academicYear: filters.academicYear,
      }),
    [allOptions, courseKey, filters.academicYear]
  );

  const hostelOptions = stats?.hostels || [];
  const roomOptions = useMemo(() => {
    const rooms = stats?.rooms || [];
    if (!filters.hostel) return rooms;
    return rooms.filter((r) => String(r.hostelId || "") === String(filters.hostel));
  }, [stats?.rooms, filters.hostel]);
  const roomCategories = useMemo(() => {
    const raw = stats?.roomCategories || [];
    return raw
      .map((item) => {
        if (typeof item === "string") {
          const value = item.trim();
          return value ? { label: value, value } : null;
        }
        const value = String(item?.value || "").trim();
        const label = String(item?.label || value).trim();
        return value ? { label: label || value, value } : null;
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;
  }, [stats?.roomCategories]);

  useEffect(() => {
    if (selectedBranchId == null) return;
    fetchFilters(selectedBranchId)
      .then(setAllOptions)
      .catch(() => setAllOptions(emptyFilters));
  }, [selectedBranchId]);

  function applyFilters(patch: Partial<typeof filters>) {
    const next = pruneStudentFilters(allOptions, {
      course: courseKey,
      specialization: "",
      academicYear: filters.academicYear,
      courseYear: filters.courseYear,
      ...patch,
    });
    setHostelFilters({
      academicYear: next.academicYear,
      courseYear: next.courseYear,
      hostel: Object.prototype.hasOwnProperty.call(patch, "hostel")
        ? String(patch.hostel || "")
        : filters.hostel,
      room: Object.prototype.hasOwnProperty.call(patch, "room")
        ? String(patch.room || "")
        : Object.prototype.hasOwnProperty.call(patch, "hostel") && !patch.hostel
          ? ""
          : filters.room,
      category: Object.prototype.hasOwnProperty.call(patch, "category")
        ? String(patch.category || "")
        : filters.category || "",
    });
    if (
      Object.prototype.hasOwnProperty.call(patch, "academicYear") ||
      Object.prototype.hasOwnProperty.call(patch, "courseYear")
    ) {
      setStudentFilters({
        course: courseKey,
        specialization: "",
        academicYear: next.academicYear,
        courseYear: next.courseYear,
      });
    }
  }

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const key = hostelCacheKey(selectedBranchId, courseKey, filters);
    const hit = usePortalCacheStore.getState().hostelOverview;
    if (hit?.key === key && hit.data) {
      setStats(hit.data);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function load() {
      try {
        const data = await fetchHostelOverview(selectedBranchId, {
          course: courseKey,
          academicYear: filters.academicYear || undefined,
          courseYear: filters.courseYear || undefined,
          hostel: filters.hostel || undefined,
          room: filters.room || undefined,
          category: filters.category || undefined,
        });
        if (!active) return;
        setStats(data);
        setHostelOverviewCache(key, data);
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
  }, [
    ready,
    selectedBranchId,
    courseKey,
    filters.academicYear,
    filters.courseYear,
    filters.hostel,
    filters.room,
    filters.category,
    setHostelOverviewCache,
  ]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.25, fontWeight: 600, color: "text.secondary" }}
        >
          Filter
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!courseKey}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                value={filters.academicYear}
                onChange={(e) => applyFilters({ academicYear: e.target.value, courseYear: "" })}
              >
                <MenuItem value="">All</MenuItem>
                {options.academicYears.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.academicYear}>
              <InputLabel>Course Year</InputLabel>
              <Select
                label="Course Year"
                value={filters.courseYear}
                onChange={(e) => applyFilters({ courseYear: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {options.courseYears.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Hostel</InputLabel>
              <Select
                label="Hostel"
                value={filters.hostel}
                onChange={(e) => applyFilters({ hostel: e.target.value, room: "" })}
              >
                <MenuItem value="">All hostels</MenuItem>
                {hostelOptions.map((h) => (
                  <MenuItem key={h.id} value={String(h.id)}>
                    {h.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Room</InputLabel>
              <Select
                label="Room"
                value={filters.room}
                onChange={(e) => applyFilters({ room: e.target.value })}
              >
                <MenuItem value="">All rooms</MenuItem>
                {roomOptions.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={filters.category || ""}
                onChange={(e) => applyFilters({ category: e.target.value })}
              >
                <MenuItem value="">All categories</MenuItem>
                {roomCategories.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading && !stats ? (
        <PageSkeleton cards={4} charts={0} table={false} />
      ) : (
        <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Students in Hostel"
              value={formatNumber(stats?.totalHostelStudents ?? 0)}
              subtitle={`${courseName} · matching year filters`}
              accent="#0B2C34"
              icon={<GroupsRoundedIcon />}
              onClick={() => navigate("/hostel/students")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Men in hostel"
              value={formatNumber(stats?.mensHostelStudents ?? 0)}
              subtitle="Matching year filters"
              accent="#3A6B85"
              icon={<PersonRoundedIcon />}
              onClick={() => navigate("/hostel/students")}
              delay={40}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Women in hostel"
              value={formatNumber(stats?.womenHostelStudents ?? 0)}
              subtitle="Matching year filters"
              accent="#8B4A6B"
              icon={<GroupsRoundedIcon />}
              onClick={() => navigate("/hostel/students")}
              delay={80}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <StatCard
              title="Total Hostels"
              value={formatNumber(stats?.totalHostels ?? 0)}
              subtitle="Campus-wide"
              accent="#0B2C34"
              icon={<HomeWorkRoundedIcon />}
              onClick={() => navigate("/hostel/hostels")}
              delay={120}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <StatCard
              title="Total Quarters"
              value={formatNumber(stats?.totalQuarters ?? 0)}
              subtitle="Campus-wide"
              accent="#1A7A6D"
              icon={<ApartmentRoundedIcon />}
              onClick={() => navigate("/hostel/rooms")}
              delay={140}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <StatCard
              title="Total Blocks"
              value={formatNumber(stats?.totalBlocks ?? 0)}
              subtitle="Campus-wide"
              accent="#3A6B85"
              icon={<DomainRoundedIcon />}
              onClick={() => navigate("/hostel/blocks")}
              delay={160}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <StatCard
              title="Vacant"
              value={formatNumber(stats?.vacantRooms ?? 0)}
              subtitle="Campus-wide"
              accent="#2F6F6A"
              icon={<CheckCircleOutlineRoundedIcon />}
              onClick={() => navigate("/hostel/rooms-vacant")}
              delay={180}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <StatCard
              title="Occupied"
              value={formatNumber(stats?.occupiedRooms ?? 0)}
              subtitle="Campus-wide"
              accent="#8B4A6B"
              icon={<PersonRoundedIcon />}
              onClick={() => navigate("/hostel/rooms-occupied")}
              delay={200}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <StatCard
              title="Partial Occupied"
              value={formatNumber(stats?.partialOccupiedRooms ?? 0)}
              subtitle="Campus-wide"
              accent="#C45C26"
              icon={<GroupsRoundedIcon />}
              onClick={() => navigate("/hostel/rooms-partial")}
              delay={220}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
