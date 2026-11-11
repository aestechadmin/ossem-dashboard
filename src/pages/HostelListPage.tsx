import {
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  fetchHostelBlocks,
  fetchHostelHostels,
  fetchHostelOverview,
  fetchHostelQuarters,
  fetchHostelRooms,
  fetchHostelStudents,
  type HostelOverviewStats,
  type HostelRoomStatusFilter,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import StudentNameLink from "@/components/StudentNameLink";
import ViewStudentButton from "@/components/ViewStudentButton";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

type ListKind =
  | "hostels"
  | "quarters"
  | "blocks"
  | "rooms"
  | "rooms-vacant"
  | "rooms-occupied"
  | "rooms-partial"
  | "rooms-blocked"
  | "students";

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
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function roomStatusFromKind(kind: ListKind): HostelRoomStatusFilter {
  if (kind === "rooms-vacant") return "AVAILABLE";
  if (kind === "rooms-occupied") return "FULL_OCCUPIED";
  if (kind === "rooms-partial") return "PARTIAL_OCCUPIED";
  if (kind === "rooms-blocked") return "NOT_AVAILABLE";
  return "all";
}

function isStudentsKind(kind: ListKind) {
  return kind === "students";
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
  const navigate = useNavigate();
  const { kind } = useParams<{ kind: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const selectedCourseId = useAuthStore((s) => s.selectedCourseId);
  const courses = useAuthStore((s) => s.courses);
  const course = selectedCourseId != null ? String(selectedCourseId) : "";
  const courseName =
    courses.find((c) => c.id === selectedCourseId)?.name || "Selected course";

  const listKind = (kind || "") as ListKind;
  const roomStatusFilter = roomStatusFromKind(listKind);
  const meta = titles[listKind];

  const hostel = searchParams.get("hostel") || "";
  const room = searchParams.get("room") || "";
  const studentId = searchParams.get("student") || "";

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<HostelOverviewStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const showHostelRoomFilters = isRoomsKind(listKind) || isStudentsKind(listKind);
  const showCourseFilters = isStudentsKind(listKind);

  const hostelOptions = stats?.hostels || [];
  const roomOptions = useMemo(() => {
    const rooms = stats?.rooms || [];
    if (!hostel) return rooms;
    return rooms.filter((r) => String(r.hostelId || "") === String(hostel));
  }, [stats?.rooms, hostel]);

  useEffect(() => {
    if (!meta) return;
    let active = true;

    async function loadStats() {
      try {
        const data = await fetchHostelOverview(selectedBranchId, {
          course: showCourseFilters ? course || undefined : undefined,
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
  }, [meta, selectedBranchId, course, hostel, room, showCourseFilters]);

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const paging = { page, pageSize };
        const filters = {
          course:
            studentId || !isStudentsKind(listKind) ? undefined : course || undefined,
          hostel: studentId ? undefined : hostel || undefined,
          room: studentId ? undefined : room || undefined,
          student: isStudentsKind(listKind) ? studentId || undefined : undefined,
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
          data = await fetchHostelStudents(selectedBranchId, paging, "all", filters);
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
    roomStatusFilter,
    course,
    hostel,
    room,
    studentId,
  ]);

  function setFilterParam(key: "hostel" | "room", value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "hostel") next.delete("room");
    next.delete("specialization");
    setPage(1);
    setSearchParams(next, { replace: true });
  }

  const columns: Column<Record<string, unknown>>[] = useMemo(() => {
    if (listKind === "hostels") {
      return [
        { key: "name", label: "Name", render: (r) => String(r.name || "—") },
        { key: "code", label: "Code", render: (r) => String(r.code || "—") },
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
        { key: "floors", label: "Floors", render: (r) => String(r.floors || "—") },
        { key: "location", label: "Location", render: (r) => String(r.location || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    if (isStudentsKind(listKind)) {
      const cols: Column<Record<string, unknown>>[] = [
        { key: "rollNumber", label: "Roll No", render: (r) => String(r.rollNumber || "—") },
        {
          key: "name",
          label: "Student Name",
          render: (r) => (
            <StudentNameLink
              studentId={r.id as number}
              name={String(r.name || "—")}
              section="hostel"
            />
          ),
        },
        { key: "mobile", label: "Mobile", render: (r) => String(r.mobile || "—") },
      ];
      if (!course) {
        cols.push({ key: "course", label: "Course", render: (r) => String(r.course || "—") });
      }
      cols.push(
        { key: "courseYear", label: "Year", render: (r) => String(r.courseYear || "—") },
        { key: "block", label: "Block", render: (r) => String(r.block || "—") },
        { key: "room", label: "Room", render: (r) => String(r.room || "—") },
        {
          key: "view",
          label: "Action",
          searchable: false,
          sortable: false,
          align: "right",
          render: (r) => <ViewStudentButton studentId={r.id as number} section="hostel" />,
          getValue: () => "",
          minWidth: 72,
        }
      );
      return cols;
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
  }, [listKind, course]);

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
      <PageHeader
        subtitle={
          studentId
            ? "Hostel allocation for this student only."
            : showCourseFilters
              ? `${courseName} — ${meta.subtitle}`
              : meta.subtitle
        }
        action={
          studentId ? (
            <Chip
              size="small"
              color="primary"
              label="Student filter"
              onDelete={() => navigate(`/hostel/${listKind}`)}
            />
          ) : undefined
        }
      />

      {!studentId && (showCourseFilters || showHostelRoomFilters) ? (
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

        </Grid>
      ) : null}

      {loading ? (
        <PageSkeleton cards={0} table />
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
