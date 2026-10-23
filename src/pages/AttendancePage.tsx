import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
} from "@mui/material";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAttendanceSchedules,
  fetchAttendances,
  fetchFilters,
  type AttendanceItem,
  type PortalFilters,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { useFilterStore } from "@/store/filterStore";
import { toastError } from "@/store/toastStore";
import { getCascadedOptions, pruneAttendanceFilters } from "@/utils/cascadeFilters";

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

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
}

function formatTimeOnly(value: string | null) {
  if (!value) return "—";
  const s = String(value);
  const match = s.match(/T(\d{2}:\d{2})/) || s.match(/(\d{2}:\d{2})/);
  return match ? match[1] : s.slice(11, 16) || "—";
}

/** Attendance studentIntime is stored UTC — show clock time in IST */
function formatTimeIst(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return formatTimeOnly(value);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function formatScheduleTime(inTime: string | null, outTime: string | null) {
  const start = formatTimeOnly(inTime);
  const end = formatTimeOnly(outTime);
  if (start === "—" && end === "—") return "—";
  if (end === "—") return start;
  if (start === "—") return end;
  return `${start} – ${end}`;
}

export default function AttendancePage() {
  const navigate = useNavigate();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const filters = useFilterStore((s) => s.attendance);
  const setAttendanceFilters = useFilterStore((s) => s.setAttendanceFilters);

  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyFilters);
  const [scheduleOptions, setScheduleOptions] = useState<
    Array<{ id: number; label: string }>
  >([]);
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listTotal, setListTotal] = useState(0);
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [scheduleTotal, setScheduleTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const options = useMemo(
    () =>
      getCascadedOptions(allOptions, {
        course: filters.course,
        specialization: filters.specialization,
        academicYear: filters.academicYear,
      }),
    [allOptions, filters.course, filters.specialization, filters.academicYear]
  );

  useEffect(() => {
    setPage(1);
    fetchFilters(selectedBranchId)
      .then(setAllOptions)
      .catch(() => setAllOptions(emptyFilters));
  }, [selectedBranchId]);

  function applyAttendanceFilters(patch: Partial<typeof filters>) {
    setPage(1);
    setAttendanceFilters(
      pruneAttendanceFilters(allOptions, {
        course: filters.course,
        specialization: filters.specialization,
        academicYear: filters.academicYear,
        courseYear: filters.courseYear || "",
        classroom: filters.classroom || "",
        schedule: filters.schedule,
        present: filters.present,
        today: filters.today,
        ...patch,
      })
    );
  }

  useEffect(() => {
    let active = true;
    fetchAttendanceSchedules({
      branch: selectedBranchId,
      course: filters.course || undefined,
      specialization: filters.specialization || undefined,
      academicYear: filters.academicYear || undefined,
      courseYear: filters.courseYear || undefined,
      classroom: filters.classroom || undefined,
      today: filters.today,
    })
      .then((data) => {
        if (!active) return;
        setScheduleOptions(data.items.map((s) => ({ id: s.id, label: s.label })));
        setScheduleTotal(data.total);
        if (
          filters.schedule &&
          !data.items.some((s) => String(s.id) === filters.schedule)
        ) {
          setAttendanceFilters({ schedule: "" });
        }
      })
      .catch(() => {
        if (!active) return;
        setScheduleOptions([]);
        setScheduleTotal(0);
      });
    return () => {
      active = false;
    };
  }, [
    selectedBranchId,
    filters.course,
    filters.specialization,
    filters.academicYear,
    filters.courseYear,
    filters.classroom,
    filters.today,
    filters.schedule,
    setAttendanceFilters,
  ]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchAttendances({
          branch: selectedBranchId,
          course: filters.course || undefined,
          specialization: filters.specialization || undefined,
          academicYear: filters.academicYear || undefined,
          courseYear: filters.courseYear || undefined,
          classroom: filters.classroom || undefined,
          schedule: filters.schedule || undefined,
          present: filters.present || undefined,
          today: filters.today,
          page,
          pageSize,
        });
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setListTotal(data.listTotal ?? data.total);
          setPresent(data.present);
          setAbsent(data.absent);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: unknown) {
        if (active) {
          toastError(err, "Could not load attendance.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [
    selectedBranchId,
    filters.course,
    filters.specialization,
    filters.academicYear,
    filters.courseYear,
    filters.classroom,
    filters.schedule,
    filters.present,
    filters.today,
    page,
    pageSize,
  ]);

  const columns: Column<AttendanceItem>[] = [
    {
      key: "student",
      label: "Student",
      render: (r) => r.studentName,
      getValue: (r) => r.studentName,
      minWidth: 140,
    },
    {
      key: "roll",
      label: "Roll No",
      render: (r) => r.rollNumber,
      getValue: (r) => r.rollNumber,
    },
    {
      key: "date",
      label: "Date",
      render: (r) => formatDateTime(r.date),
      getValue: (r) => r.date || "",
    },
    {
      key: "topic",
      label: "Schedule",
      render: (r) => r.topic,
      getValue: (r) => r.topic,
      minWidth: 140,
    },
    {
      key: "scheduleTime",
      label: "Schedule Time",
      render: (r) => formatScheduleTime(r.scheduleInTime, r.scheduleOutTime),
      getValue: (r) => formatScheduleTime(r.scheduleInTime, r.scheduleOutTime),
      minWidth: 120,
    },
    {
      key: "subject",
      label: "Subject",
      render: (r) => r.subject,
      getValue: (r) => r.subject,
    },
    {
      key: "course",
      label: "Course",
      render: (r) => r.course,
      getValue: (r) => r.course,
    },
    {
      key: "classroom",
      label: "Classroom",
      render: (r) => r.classroom,
      getValue: (r) => r.classroom,
    },
    {
      key: "intime",
      label: "In Time",
      render: (r) => formatTimeIst(r.intime),
      getValue: (r) => formatTimeIst(r.intime),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Chip
          size="small"
          label={r.present ? "Present" : "Absent"}
          color={r.present ? "success" : "error"}
          variant="outlined"
          sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
        />
      ),
      getValue: (r) => (r.present ? "Present" : "Absent"),
    },
  ];

  return (
    <Box>
      <PageHeader subtitle="Filter by course, class, year, and schedule. Today only shows today’s schedules." />

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
          animation: "fadeUp 0.4s ease both",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                label="Course"
                value={filters.course}
                onChange={(e) => applyAttendanceFilters({ course: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {options.courses.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small" disabled={!filters.course}>
              <InputLabel>Specialization</InputLabel>
              <Select
                label="Specialization"
                value={filters.specialization}
                onChange={(e) =>
                  applyAttendanceFilters({ specialization: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                {options.specializations.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small" disabled={!filters.specialization}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                value={filters.academicYear}
                onChange={(e) =>
                  applyAttendanceFilters({ academicYear: e.target.value })
                }
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
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small" disabled={!filters.academicYear}>
              <InputLabel>Course Year</InputLabel>
              <Select
                label="Course Year"
                value={filters.courseYear || ""}
                onChange={(e) => applyAttendanceFilters({ courseYear: e.target.value })}
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
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select
                label="Class"
                value={filters.classroom || ""}
                onChange={(e) => applyAttendanceFilters({ classroom: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {options.classrooms.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Schedule</InputLabel>
              <Select
                label="Schedule"
                value={filters.schedule}
                onChange={(e) => applyAttendanceFilters({ schedule: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {scheduleOptions.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.present}
                onChange={(e) =>
                  applyAttendanceFilters({
                    present: e.target.value as "" | "true" | "false",
                  })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Present</MenuItem>
                <MenuItem value="false">Absent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.today}
                  onChange={(e) => applyAttendanceFilters({ today: e.target.checked })}
                  size="small"
                />
              }
              label="Today only"
              sx={{ m: 0, ml: 0.5 }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={{ xs: 1.75, sm: 2 }} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Attendance"
            value={formatNumber(total)}
            subtitle="Matching filters"
            accent="#0B2C34"
            icon={<FactCheckRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present"
            value={formatNumber(present)}
            subtitle="Marked present"
            accent="#1A7A6D"
            icon={<CheckCircleRoundedIcon />}
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Absent"
            value={formatNumber(absent)}
            subtitle="Marked absent"
            accent="#C45C3A"
            icon={<CancelRoundedIcon />}
            delay={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={filters.today ? "Today Schedules" : "Schedules"}
            value={formatNumber(scheduleTotal)}
            subtitle={filters.today ? "Schedules for today" : "Open schedule list"}
            accent="#8B4A6B"
            icon={<EventNoteRoundedIcon />}
            onClick={() => navigate("/departments/schedules")}
            delay={120}
          />
        </Grid>
      </Grid>

      {loading ? (
        <Box minHeight={240} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search student, roll, schedule, subject…"
          emptyText="No attendance records found"
          pagination={{
            page,
            pageSize,
            total: listTotal,
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
