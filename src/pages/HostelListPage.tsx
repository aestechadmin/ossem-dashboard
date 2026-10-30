import {
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import ManRoundedIcon from "@mui/icons-material/ManRounded";
import WomanRoundedIcon from "@mui/icons-material/WomanRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  fetchFilters,
  fetchHostelBlocks,
  fetchHostelHostels,
  fetchHostelOverview,
  fetchHostelQuarters,
  fetchHostelRooms,
  fetchHostelStudents,
  type HostelOverviewStats,
  type HostelRoomStatusFilter,
  type PortalFilters,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";
import { getCascadedOptions } from "@/utils/cascadeFilters";

const emptyFilters: PortalFilters = {
  courses: [],
  specializations: [],
  academicYears: [],
  courseYears: [],
  classrooms: [],
  quotas: [],
};

type ListKind =
  | "hostels"
  | "quarters"
  | "blocks"
  | "rooms"
  | "rooms-vacant"
  | "rooms-occupied"
  | "rooms-partial"
  | "rooms-blocked"
  | "students"
  | "students-mens"
  | "students-women";
type StudentGenderFilter = "all" | "mens" | "women";

const titles: Record<ListKind, { subtitle: string; searchLabel: string }> = {
  hostels: {
    subtitle: "Student hostel blocks for the selected branch.",
    searchLabel: "hostels",
  },
  quarters: {
    subtitle: "Residence quarters master list.",
    searchLabel: "quarters",
  },
  blocks: {
    subtitle: "All hostel blocks.",
    searchLabel: "blocks",
  },
  rooms: {
    subtitle: "Hostel rooms with status and capacity.",
    searchLabel: "rooms",
  },
  "rooms-vacant": {
    subtitle: "Vacant (Available) student hostel rooms only.",
    searchLabel: "vacant rooms",
  },
  "rooms-occupied": {
    subtitle: "Fully occupied student hostel rooms only.",
    searchLabel: "occupied rooms",
  },
  "rooms-partial": {
    subtitle: "Partially occupied student hostel rooms only.",
    searchLabel: "partial rooms",
  },
  "rooms-blocked": {
    subtitle: "Blocked / repair (not available) student hostel rooms only.",
    searchLabel: "blocked rooms",
  },
  students: {
    subtitle: "All students allocated to student hostel rooms.",
    searchLabel: "students",
  },
  "students-mens": {
    subtitle: "Mens (male) students in student hostels.",
    searchLabel: "mens students",
  },
  "students-women": {
    subtitle: "Women (female) students in student hostels.",
    searchLabel: "women students",
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function genderFromKind(kind: ListKind): StudentGenderFilter {
  if (kind === "students-mens") return "mens";
  if (kind === "students-women") return "women";
  return "all";
}

function roomStatusFromKind(kind: ListKind): HostelRoomStatusFilter {
  if (kind === "rooms-vacant") return "AVAILABLE";
  if (kind === "rooms-occupied") return "FULL_OCCUPIED";
  if (kind === "rooms-partial") return "PARTIAL_OCCUPIED";
  if (kind === "rooms-blocked") return "NOT_AVAILABLE";
  return "all";
}

function isStudentsKind(kind: ListKind) {
  return kind === "students" || kind === "students-mens" || kind === "students-women";
}

function isRoomsKind(kind: ListKind) {
  return (
    kind === "rooms" ||
    kind === "rooms-vacant" ||
    kind === "rooms-occupied" ||
    kind === "rooms-partial" ||
    kind === "rooms-blocked"
  );
}

export default function HostelListPage() {
  const { kind } = useParams<{ kind: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);

  const listKind = (kind || "") as ListKind;
  const genderFilter = genderFromKind(listKind);
  const roomStatusFilter = roomStatusFromKind(listKind);
  const meta = titles[listKind];

  const course = searchParams.get("course") || "";
  const specialization = searchParams.get("specialization") || "";
  const hostel = searchParams.get("hostel") || "";
  const room = searchParams.get("room") || "";

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<HostelOverviewStats | null>(null);
  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyFilters);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const showHostelRoomFilters = isRoomsKind(listKind) || isStudentsKind(listKind);
  // Course / specialization only for student lists (rooms/quarters have no course map)
  const showCourseFilters = isStudentsKind(listKind);

  const courseOptions = useMemo(
    () => getCascadedOptions(allOptions, { course, specialization }),
    [allOptions, course, specialization]
  );

  const hostelOptions = stats?.hostels || [];
  const roomOptions = useMemo(() => {
    const rooms = stats?.rooms || [];
    if (!hostel) return rooms;
    return rooms.filter((r) => String(r.hostelId || "") === String(hostel));
  }, [stats?.rooms, hostel]);

  useEffect(() => {
    fetchFilters(selectedBranchId)
      .then(setAllOptions)
      .catch(() => setAllOptions(emptyFilters));
  }, [selectedBranchId]);

  useEffect(() => {
    if (!meta) return;
    let active = true;

    async function loadStats() {
      try {
        const data = await fetchHostelOverview(selectedBranchId, {
          course: showCourseFilters ? course || undefined : undefined,
          specialization: showCourseFilters ? specialization || undefined : undefined,
          hostel: hostel || undefined,
          room: room || undefined,
        });
        if (active) setStats(data);
      } catch {
        if (active) setStats(null);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, [meta, selectedBranchId, course, specialization, hostel, room]);

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const paging = { page, pageSize };
        const filters = {
          course: isStudentsKind(listKind) ? course || undefined : undefined,
          specialization: isStudentsKind(listKind) ? specialization || undefined : undefined,
          hostel: hostel || undefined,
          room: room || undefined,
        };
        let data: {
          items: Record<string, unknown>[];
          total: number;
          page: number;
          pageCount: number;
        };
        if (listKind === "hostels") data = await fetchHostelHostels(selectedBranchId, paging);
        else if (listKind === "quarters")
          data = await fetchHostelQuarters(selectedBranchId, paging);
        else if (listKind === "blocks") data = await fetchHostelBlocks(selectedBranchId, paging);
        else if (isStudentsKind(listKind))
          data = await fetchHostelStudents(selectedBranchId, paging, genderFilter, filters);
        else if (isRoomsKind(listKind))
          data = await fetchHostelRooms(selectedBranchId, paging, roomStatusFilter, filters);
        else data = await fetchHostelRooms(selectedBranchId, paging, "all", filters);
        if (cancelled) return;
        setRows(data.items as Record<string, unknown>[]);
        setTotal(data.total);
        setPageCount(data.pageCount || 1);
        if (data.page && data.page !== page) setPage(data.page);
      } catch (err: unknown) {
        if (!cancelled) {
          toastError(err, "Could not load this list.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [
    listKind,
    meta,
    selectedBranchId,
    page,
    pageSize,
    genderFilter,
    roomStatusFilter,
    course,
    specialization,
    hostel,
    room,
  ]);

  function setFilterParam(
    key: "course" | "specialization" | "hostel" | "room",
    value: string
  ) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "course") {
      next.delete("specialization");
    }
    if (key === "hostel") next.delete("room");
    setPage(1);
    setSearchParams(next, { replace: true });
  }

  const columns: Column<Record<string, unknown>>[] = useMemo(() => {
    if (listKind === "hostels") {
      return [
        { key: "name", label: "Name", render: (r) => String(r.name || "—") },
        { key: "code", label: "Code", render: (r) => String(r.code || "—") },
        { key: "gender", label: "Gender", render: (r) => String(r.gender || "—") },
        { key: "location", label: "Location", render: (r) => String(r.location || "—") },
        { key: "typeOfPeople", label: "People", render: (r) => String(r.typeOfPeople || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    if (listKind === "quarters") {
      return [
        { key: "name", label: "Quarter", render: (r) => String(r.name || "—") },
        { key: "value", label: "Value", render: (r) => String(r.value || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    if (listKind === "blocks") {
      return [
        { key: "name", label: "Block", render: (r) => String(r.name || "—") },
        { key: "code", label: "Code", render: (r) => String(r.code || "—") },
        { key: "category", label: "Category", render: (r) => String(r.category || "—") },
        { key: "gender", label: "Gender", render: (r) => String(r.gender || "—") },
        { key: "floors", label: "Floors", render: (r) => String(r.floors || "—") },
        { key: "location", label: "Location", render: (r) => String(r.location || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    if (isStudentsKind(listKind)) {
      return [
        { key: "rollNumber", label: "Roll No", render: (r) => String(r.rollNumber || "—") },
        { key: "name", label: "Name", render: (r) => String(r.name || "—") },
        { key: "gender", label: "Gender", render: (r) => String(r.gender || "—") },
        { key: "mobile", label: "Mobile", render: (r) => String(r.mobile || "—") },
        { key: "course", label: "Course", render: (r) => String(r.course || "—") },
        {
          key: "specialization",
          label: "Specialization",
          render: (r) => String(r.specialization || "—"),
        },
        { key: "courseYear", label: "Year", render: (r) => String(r.courseYear || "—") },
        { key: "block", label: "Block", render: (r) => String(r.block || "—") },
        { key: "room", label: "Room", render: (r) => String(r.room || "—") },
      ];
    }
    return [
      { key: "block", label: "Hostel", render: (r) => String(r.block || "—") },
      { key: "roomNo", label: "Room No", render: (r) => String(r.roomNo || "—") },
      { key: "floorNo", label: "Floor", render: (r) => String(r.floorNo || "—") },
      { key: "capacity", label: "Capacity", render: (r) => String(r.capacity ?? "—") },
      { key: "vacancies", label: "Vacancies", render: (r) => String(r.vacancies ?? "—") },
      { key: "status", label: "Status", render: (r) => String(r.status || "—") },
      { key: "category", label: "Category", render: (r) => String(r.category || "—") },
      { key: "maintenance", label: "Maintenance", render: (r) => String(r.maintenance || "—") },
      { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
    ];
  }, [listKind]);

  if (!meta) {
    return (
      <Box>
        <PageHeader subtitle="Unknown hostel list" />
        <Box color="error.main">Unknown hostel list</Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader subtitle={meta.subtitle} />

      {showCourseFilters || showHostelRoomFilters ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Grid container spacing={2}>
            {showCourseFilters ? (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Course</InputLabel>
                    <Select
                      label="Course"
                      value={course}
                      onChange={(e) => setFilterParam("course", e.target.value)}
                    >
                      <MenuItem value="">All courses</MenuItem>
                      {courseOptions.courses.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" disabled={!course}>
                    <InputLabel>Specialization</InputLabel>
                    <Select
                      label="Specialization"
                      value={specialization}
                      onChange={(e) => setFilterParam("specialization", e.target.value)}
                    >
                      <MenuItem value="">All specializations</MenuItem>
                      {courseOptions.specializations.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            ) : null}
            {showHostelRoomFilters ? (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Hostel</InputLabel>
                    <Select
                      label="Hostel"
                      value={hostel}
                      onChange={(e) => setFilterParam("hostel", e.target.value)}
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
                      value={room}
                      onChange={(e) => setFilterParam("room", e.target.value)}
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
              </>
            ) : null}
          </Grid>
        </Paper>
      ) : null}

      {/* Skip the same card as the page itself (e.g. Mens inside Mens) */}
      {listKind === "students" || listKind === "rooms" ? (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {listKind === "rooms" ? (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Vacant"
                  value={formatNumber(stats?.vacantRooms || 0)}
                  subtitle="Available"
                  accent="#2F6F6A"
                  icon={<CheckCircleOutlineRoundedIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Occupied"
                  value={formatNumber(stats?.occupiedRooms || 0)}
                  subtitle="Fully occupied"
                  accent="#8B4A6B"
                  icon={<PersonRoundedIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Blocked"
                  value={formatNumber(stats?.blockedRooms || 0)}
                  subtitle="Not available"
                  accent="#6B4E71"
                  icon={<BuildRoundedIcon />}
                />
              </Grid>
            </>
          ) : null}

          {listKind === "students" ? (
            <>
              <Grid item xs={12} sm={6} md={6}>
                <StatCard
                  title="Mens"
                  value={formatNumber(stats?.mensHostelStudents || 0)}
                  subtitle="Male students"
                  accent="#3A6B85"
                  icon={<ManRoundedIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <StatCard
                  title="Women"
                  value={formatNumber(stats?.womenHostelStudents || 0)}
                  subtitle="Female students"
                  accent="#8B4A6B"
                  icon={<WomanRoundedIcon />}
                />
              </Grid>
            </>
          ) : null}
        </Grid>
      ) : null}

      {loading ? (
        <Box minHeight={280} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={rows}
          rowKey={(r) => Number(r.id)}
          searchPlaceholder={`Search ${meta.searchLabel}…`}
          pagination={{
            page,
            pageSize,
            total,
            pageCount,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        />
      )}
    </Box>
  );
}
