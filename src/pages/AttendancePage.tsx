import {
  Box,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchAttendances,
  fetchFilters,
  type AttendanceItem,
  type PortalFilters,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import ViewStudentButton from "@/components/ViewStudentButton";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
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
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student") || "";
  const { selectedBranchId, courseKey, courseName } = useSelectedCourse();
  const filters = useFilterStore((s) => s.attendance);
  const setAttendanceFilters = useFilterStore((s) => s.setAttendanceFilters);

  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyFilters);
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [listTotal, setListTotal] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [absentStudents, setAbsentStudents] = useState(0);
  const [presentRate, setPresentRate] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const options = useMemo(
    () =>
      getCascadedOptions(allOptions, {
        course: courseKey,
        specialization: "",
        academicYear: filters.academicYear,
      }),
    [allOptions, courseKey, filters.academicYear]
  );

  useEffect(() => {
    setPage(1);
    fetchFilters(selectedBranchId)
      .then((opts) => {
        setAllOptions(opts);
        setAttendanceFilters(
          pruneAttendanceFilters(opts, {
            course: courseKey,
            specialization: "",
            academicYear: filters.academicYear,
            courseYear: filters.courseYear || "",
            classroom: filters.classroom || "",
            present: filters.present,
            today: filters.today,
          })
        );
      })
      .catch(() => setAllOptions(emptyFilters));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prune when branch/course options change
  }, [selectedBranchId, courseKey, setAttendanceFilters]);

  function applyAttendanceFilters(patch: Partial<typeof filters>) {
    setPage(1);
    setAttendanceFilters(
      pruneAttendanceFilters(allOptions, {
        academicYear: filters.academicYear,
        courseYear: filters.courseYear || "",
        classroom: filters.classroom || "",
        present: filters.present,
        today: filters.today,
        ...patch,
        specialization: "",
        course: courseKey,
      })
    );
  }

  useEffect(() => {
    if (selectedBranchId == null) return;
    if (!studentId && !courseKey) return;
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchAttendances({
          branch: selectedBranchId,
          course: studentId ? undefined : courseKey,
          academicYear: studentId ? undefined : filters.academicYear || undefined,
          courseYear: studentId ? undefined : filters.courseYear || undefined,
          classroom: studentId ? undefined : filters.classroom || undefined,
          student: studentId || undefined,
          present: filters.present || undefined,
          today: filters.today,
          page,
          pageSize,
        });
        if (active) {
          setItems(data.items);
          setTotalRecords(data.totalRecords ?? data.total);
          setListTotal(data.listTotal ?? data.total);
          setPresentStudents(data.presentStudents ?? data.present);
          setAbsentStudents(data.absentStudents ?? data.absent);
          setPresentRate(
            typeof data.presentRate === "number"
              ? data.presentRate
              : data.totalRecords || data.total
                ? Math.round(
                    ((data.presentRecords || 0) / (data.totalRecords || data.total)) * 1000
                  ) / 10
                : 0
          );
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
    courseKey,
    studentId,
    filters.academicYear,
    filters.courseYear,
    filters.classroom,
    filters.present,
    filters.today,
    page,
    pageSize,
  ]);

  const columns: Column<AttendanceItem>[] = useMemo(() => {
    const cols: Column<AttendanceItem>[] = [
      {
        key: "student",
        label: "Student Name",
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
        key: "subject",
        label: "Subject",
        render: (r) => r.subject,
        getValue: (r) => r.subject,
        minWidth: 120,
      },
      {
        key: "topic",
        label: "Topic",
        render: (r) => r.topic,
        getValue: (r) => r.topic,
        minWidth: 140,
      },
      {
        key: "scheduleTime",
        label: "Class Time",
        render: (r) => formatScheduleTime(r.scheduleInTime, r.scheduleOutTime),
        getValue: (r) => formatScheduleTime(r.scheduleInTime, r.scheduleOutTime),
        minWidth: 120,
      },
    ];
    if (!studentId && !courseKey) {
      cols.push({
        key: "course",
        label: "Course",
        render: (r) => r.course,
        getValue: (r) => r.course,
      });
    }
    cols.push(
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
      {
        key: "reason",
        label: "Reason",
        render: (r) => r.reason || "—",
        getValue: (r) => r.reason || "",
        minWidth: 160,
      },
      {
        key: "view",
        label: "Action",
        searchable: false,
        sortable: false,
        align: "right",
        render: (r) => <ViewStudentButton studentId={r.studentId} section="attendance" />,
        getValue: () => "",
        minWidth: 72,
      }
    );
    return cols;
  }, [studentId, courseKey]);

  return (
    <Box>
      <PageHeader
        subtitle={
          studentId
            ? "Attendance marks for this student only."
            : `${courseName} — unique students; present & absent do not overlap.`
        }
        action={
          studentId ? (
            <Chip
              size="small"
              color="primary"
              label="Student filter"
              onDelete={() => navigate("/attendance")}
            />
          ) : undefined
        }
      />

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
          display: studentId ? "none" : undefined,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small" disabled={!courseKey}>
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
            title="Present students"
            value={formatNumber(presentStudents)}
            subtitle="Unique — ≥1 present mark"
            accent="#1A7A6D"
            icon={<CheckCircleRoundedIcon />}
            selected={filters.present === "true"}
            onClick={() =>
              applyAttendanceFilters({
                present: filters.present === "true" ? "" : "true",
              })
            }
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Absent students"
            value={formatNumber(absentStudents)}
            subtitle="Unique — absent only (no present)"
            accent="#C45C3A"
            icon={<CancelRoundedIcon />}
            selected={filters.present === "false"}
            onClick={() =>
              applyAttendanceFilters({
                present: filters.present === "false" ? "" : "false",
              })
            }
            delay={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present rate"
            value={`${presentRate}%`}
            subtitle="Of all attendance marks"
            accent="#0B2C34"
            icon={<PercentRoundedIcon />}
            delay={120}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Attendance marks"
            value={formatNumber(totalRecords)}
            subtitle="Rows in table (all schedules)"
            accent="#5B6B7A"
            icon={<FactCheckRoundedIcon />}
            delay={160}
          />
        </Grid>
      </Grid>

      {loading ? (
        <PageSkeleton cards={0} table />
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search student, roll, subject, topic…"
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
