import {
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ViewStudentButton from "@/components/ViewStudentButton";
import {
  fetchFees,
  fetchFilters,
  fetchHostelOverview,
  fetchHostelStudents,
  fetchOverview,
  fetchStudents,
  fetchStudentStats,
  type FeeSummary,
  type HostelOverviewStats,
  type HostelStudentItem,
  type OverviewStats,
  type PortalFilters,
  type StudentItem,
  type StudentStats,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import StudentNameLink from "@/components/StudentNameLink";
import { useAuthStore } from "@/store/authStore";
import { useFilterStore } from "@/store/filterStore";
import { usePortalCacheStore } from "@/store/portalCacheStore";
import { toastError } from "@/store/toastStore";
import { getCascadedOptions, pruneStudentFilters } from "@/utils/cascadeFilters";

function feeStatusChip(status?: StudentItem["feeStatus"]) {
  if (status === "Paid") {
    return <Chip size="small" label="Paid" color="success" variant="outlined" />;
  }
  if (status === "Unpaid") {
    return <Chip size="small" label="Unpaid" color="warning" variant="outlined" />;
  }
  return <Chip size="small" label="No fee" variant="outlined" />;
}

const emptyPortalFilters: PortalFilters = {
  courses: [],
  specializations: [],
  academicYears: [],
  courseYears: [],
  classrooms: [],
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
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
  const selectedCourseId = useAuthStore((s) => s.selectedCourseId);
  const courses = useAuthStore((s) => s.courses);
  const selectedCourseName =
    courses.find((c) => c.id === selectedCourseId)?.name || "Selected course";
  const course = selectedCourseId != null ? String(selectedCourseId) : "";
  const hostelFilters = useFilterStore((s) => s.hostel);
  const setHostelFilters = useFilterStore((s) => s.setHostelFilters);
  const setStudentFilters = useFilterStore((s) => s.setStudentFilters);
  const setDashboardOverviewCache = usePortalCacheStore((s) => s.setDashboardOverview);

  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyPortalFilters);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [hostelStats, setHostelStats] = useState<HostelOverviewStats | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [studentRows, setStudentRows] = useState<StudentItem[]>([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState<PageSizeOption>(50);
  const [studentPageCount, setStudentPageCount] = useState(1);
  const [showHostelTable, setShowHostelTable] = useState(false);
  const [hostelRows, setHostelRows] = useState<HostelStudentItem[]>([]);
  const [hostelTotal, setHostelTotal] = useState(0);
  const [hostelPage, setHostelPage] = useState(1);
  const [hostelPageSize, setHostelPageSize] = useState<PageSizeOption>(50);
  const [hostelPageCount, setHostelPageCount] = useState(1);
  const [hostelTableLoading, setHostelTableLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const hasYearFilter = Boolean(hostelFilters.academicYear || hostelFilters.courseYear);

  const yearOptions = useMemo(
    () =>
      getCascadedOptions(allOptions, {
        course,
        specialization: "",
        academicYear: hostelFilters.academicYear,
      }),
    [allOptions, course, hostelFilters.academicYear]
  );

  useEffect(() => {
    setStudentPage(1);
    setHostelPage(1);
  }, [
    selectedBranchId,
    selectedCourseId,
    hostelFilters.academicYear,
    hostelFilters.courseYear,
    hostelFilters.hostel,
    hostelFilters.room,
    hostelFilters.category,
  ]);

  useEffect(() => {
    if (selectedBranchId == null) return;
    fetchFilters(selectedBranchId)
      .then(setAllOptions)
      .catch(() => setAllOptions(emptyPortalFilters));
  }, [selectedBranchId]);

  function applyYearFilters(patch: Partial<typeof hostelFilters>) {
    const pruned = pruneStudentFilters(allOptions, {
      course,
      specialization: "",
      academicYear: patch.academicYear ?? hostelFilters.academicYear,
      courseYear: patch.courseYear ?? hostelFilters.courseYear,
    });
    setHostelFilters({
      academicYear: pruned.academicYear,
      courseYear: pruned.courseYear,
    });
    setStudentFilters({
      academicYear: pruned.academicYear,
      courseYear: pruned.courseYear,
      specialization: "",
      course,
    });
  }

  useEffect(() => {
    if (selectedBranchId == null || selectedCourseId == null) return;
    let active = true;
    const cacheKey = [
      selectedBranchId,
      selectedCourseId,
      hostelFilters.academicYear,
      hostelFilters.courseYear,
    ].join("|");
    const hit = usePortalCacheStore.getState().dashboardOverview;
    if (hit?.key === cacheKey) {
      setStats(hit.data.overview);
      setStudentStats(hit.data.studentStats);
      setHostelStats(hit.data.hostelStats);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function load() {
      try {
        setFeeSummary(null);
        const [overview, students, hostel, fees] = await Promise.all([
          fetchOverview(selectedBranchId, selectedCourseId),
          fetchStudentStats({
            branch: selectedBranchId,
            course,
            academicYear: hostelFilters.academicYear || undefined,
            courseYear: hostelFilters.courseYear || undefined,
            year: hostelFilters.courseYear || undefined,
          }),
          fetchHostelOverview(selectedBranchId, {
            course,
            academicYear: hostelFilters.academicYear || undefined,
            courseYear: hostelFilters.courseYear || undefined,
            hostel: showHostelTable ? hostelFilters.hostel || undefined : undefined,
            room: showHostelTable ? hostelFilters.room || undefined : undefined,
            category: showHostelTable ? hostelFilters.category || undefined : undefined,
          }),
          fetchFees({
            branch: selectedBranchId,
            course,
            academicYear: hostelFilters.academicYear || undefined,
            courseYear: hostelFilters.courseYear || undefined,
            kind: "total",
            page: 1,
            pageSize: 50,
          }),
        ]);
        if (!active) return;
        setStats(overview);
        setStudentStats(students);
        setHostelStats(hostel);
        setFeeSummary(fees.summary || null);
        setDashboardOverviewCache(cacheKey, {
          overview,
          studentStats: students,
          hostelStats: hostel,
        });
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
  }, [
    selectedBranchId,
    selectedCourseId,
    course,
    hostelFilters.academicYear,
    hostelFilters.courseYear,
    hostelFilters.hostel,
    hostelFilters.room,
    hostelFilters.category,
    showHostelTable,
    setDashboardOverviewCache,
  ]);

  useEffect(() => {
    if (!showHostelTable || selectedBranchId == null || selectedCourseId == null) return;
    let active = true;

    async function loadHostelStudents() {
      setHostelTableLoading(true);
      try {
        const data = await fetchHostelStudents(
          selectedBranchId,
          { page: hostelPage, pageSize: hostelPageSize },
          "all",
          {
            course,
            academicYear: hostelFilters.academicYear || undefined,
            courseYear: hostelFilters.courseYear || undefined,
            hostel: hostelFilters.hostel || undefined,
            room: hostelFilters.room || undefined,
            category: hostelFilters.category || undefined,
          }
        );
        if (active) {
          setHostelRows(data.items || []);
          setHostelTotal(data.total || 0);
          setHostelPageCount(data.pageCount || 1);
          if (data.page && data.page !== hostelPage) setHostelPage(data.page);
        }
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load hostel students.");
      } finally {
        if (active) setHostelTableLoading(false);
      }
    }

    loadHostelStudents();
    return () => {
      active = false;
    };
  }, [
    showHostelTable,
    selectedBranchId,
    selectedCourseId,
    course,
    hostelFilters.academicYear,
    hostelFilters.courseYear,
    hostelFilters.hostel,
    hostelFilters.room,
    hostelFilters.category,
    hostelPage,
    hostelPageSize,
  ]);

  useEffect(() => {
    if (selectedBranchId == null || selectedCourseId == null) return;
    let active = true;

    async function loadStudents() {
      setTableLoading(true);
      try {
        const data = await fetchStudents({
          branch: selectedBranchId,
          course,
          academicYear: hostelFilters.academicYear || undefined,
          courseYear: hostelFilters.courseYear || undefined,
          year: hostelFilters.courseYear || undefined,
          page: studentPage,
          pageSize: studentPageSize,
        });
        if (active) {
          setStudentRows(data.items || []);
          setStudentTotal(data.total || 0);
          setStudentPageCount(data.pageCount || 1);
          if (data.page && data.page !== studentPage) setStudentPage(data.page);
        }
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load students.");
      } finally {
        if (active) setTableLoading(false);
      }
    }

    loadStudents();
    return () => {
      active = false;
    };
  }, [
    selectedBranchId,
    selectedCourseId,
    course,
    hostelFilters.academicYear,
    hostelFilters.courseYear,
    studentPage,
    studentPageSize,
  ]);

  const studentColumns: Column<StudentItem>[] = [
    {
      key: "roll",
      label: "Roll No",
      render: (r) => r.rollNumber,
      getValue: (r) => r.rollNumber,
    },
    {
      key: "name",
      label: "Student Name",
      render: (r) => <StudentNameLink studentId={r.id} name={r.name} />,
      getValue: (r) => r.name,
      minWidth: 140,
    },
    {
      key: "academicYear",
      label: "Academic Year",
      render: (r) => r.academicYear,
      getValue: (r) => r.academicYear,
    },
    {
      key: "courseYear",
      label: "Year",
      render: (r) => r.courseYear,
      getValue: (r) => r.courseYear,
    },
    {
      key: "fee",
      label: "Fee",
      render: (r) => feeStatusChip(r.feeStatus),
      getValue: (r) => r.feeStatus || "No fee",
      minWidth: 100,
    },
    {
      key: "view",
      label: "Action",
      searchable: false,
      sortable: false,
      align: "right",
      render: (r) => <ViewStudentButton studentId={r.id} />,
      getValue: () => "",
      minWidth: 72,
    },
  ];

  const hostelColumns: Column<HostelStudentItem>[] = [
    {
      key: "roll",
      label: "Roll No",
      render: (r) => r.rollNumber,
      getValue: (r) => r.rollNumber,
    },
    {
      key: "name",
      label: "Student Name",
      render: (r) => <StudentNameLink studentId={r.id} name={r.name} section="hostel" />,
      getValue: (r) => r.name,
      minWidth: 140,
    },
    {
      key: "courseYear",
      label: "Year",
      render: (r) => r.courseYear,
      getValue: (r) => r.courseYear,
    },
    {
      key: "room",
      label: "Room",
      render: (r) => r.room || "Not allotted",
      getValue: (r) => r.room || "",
    },
    {
      key: "roomCategory",
      label: "Room category",
      render: (r) => r.roomCategory || "—",
      getValue: (r) => r.roomCategory || "",
      minWidth: 110,
    },
    {
      key: "view",
      label: "Action",
      searchable: false,
      sortable: false,
      align: "right",
      render: (r) => <ViewStudentButton studentId={r.id} section="hostel" />,
      getValue: () => "",
      minWidth: 72,
    },
  ];

  const hostelOptions = hostelStats?.hostels || [];
  const roomOptions = useMemo(() => {
    const rooms = hostelStats?.rooms || [];
    if (!hostelFilters.hostel) return rooms;
    return rooms.filter((r) => String(r.hostelId || "") === String(hostelFilters.hostel));
  }, [hostelStats?.rooms, hostelFilters.hostel]);
  const roomCategories = useMemo(() => {
    const raw = hostelStats?.roomCategories || [];
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
  }, [hostelStats?.roomCategories]);

  const chartMode: "academicYear" | "courseYear" | "feePaid" = hostelFilters.courseYear
    ? "feePaid"
    : hostelFilters.academicYear
      ? "courseYear"
      : "academicYear";

  const studentChartData = useMemo(() => {
    if (chartMode === "feePaid") {
      return {
        labels: ["Paid", "Unpaid"],
        values: [
          Number(feeSummary?.paidCount) || 0,
          Number(feeSummary?.unpaidCount) || 0,
        ],
        colors: ["#1A7A6D", "#C45C26"] as string[],
      };
    }
    if (chartMode === "courseYear") {
      const rows = [...(studentStats?.byCourseYear || [])].sort((a, b) => {
        if (a.label === "Unassigned") return 1;
        if (b.label === "Unassigned") return -1;
        const numA = Number(String(a.label).match(/\d+/)?.[0] || 999);
        const numB = Number(String(b.label).match(/\d+/)?.[0] || 999);
        if (numA !== numB) return numA - numB;
        return a.label.localeCompare(b.label);
      });
      return {
        labels: rows.map((r) => r.label),
        values: rows.map((r) => r.value),
        colors: undefined as string[] | undefined,
      };
    }

    // Academic year chart: one bar per filter year; count matches filter ($or current/admission).
    const statsRows = studentStats?.byAcademicYear || [];
    const countByLabel = new Map(statsRows.map((r) => [r.label, Number(r.value) || 0]));
    const countByYearKey = new Map<string, number>();
    for (const r of statsRows) {
      const key = String(r.label).match(/(19|20)\d{2}/)?.[0];
      if (!key) continue;
      countByYearKey.set(
        key,
        Math.max(countByYearKey.get(key) || 0, Number(r.value) || 0)
      );
    }
    const usedKeys = new Set<string>();
    const rows =
      yearOptions.academicYears.length > 0
        ? yearOptions.academicYears.map((item) => {
            const label = item.label;
            const key = String(label).match(/(19|20)\d{2}/)?.[0];
            if (key) usedKeys.add(key);
            const exact = countByLabel.get(label);
            const value =
              exact != null ? exact : key ? countByYearKey.get(key) || 0 : 0;
            return { label, value };
          })
        : statsRows.map((r) => ({ label: r.label, value: Number(r.value) || 0 }));
    for (const r of statsRows) {
      if (r.label === "Unassigned") {
        rows.push({ label: r.label, value: Number(r.value) || 0 });
        continue;
      }
      const key = String(r.label).match(/(19|20)\d{2}/)?.[0];
      if (key && usedKeys.has(key)) continue;
      if (rows.some((x) => x.label === r.label)) continue;
      rows.push({ label: r.label, value: Number(r.value) || 0 });
    }
    rows.sort((a, b) => {
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
      colors: undefined as string[] | undefined,
    };
  }, [studentStats, feeSummary, chartMode, yearOptions.academicYears]);

  const studentsCardValue = hasYearFilter
    ? studentStats?.totalStudents ?? 0
    : studentStats?.totalStudents ?? stats?.totalStudents ?? 0;

  return (
    <Box>
      {loading && !stats && !studentStats ? (
        <PageSkeleton variant="dashboard" table />
      ) : (
        <>
      <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mb: 1 }} alignItems="stretch">
        <Grid item xs={12} md={5}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "text.secondary", textAlign: "left" }}
            >
              Filter
            </Typography>
            <Box sx={{ display: "flex", gap: 1.25 }}>
              <FormControl
                size="small"
                disabled={!course}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  bgcolor: "#fff",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    height: 48,
                  },
                  "& .MuiInputLabel-root": { fontSize: 13 },
                  "& .MuiSelect-select": { fontSize: 13 },
                }}
              >
                <InputLabel>Academic Year</InputLabel>
                <Select
                  label="Academic Year"
                  value={hostelFilters.academicYear}
                  onChange={(e) =>
                    applyYearFilters({ academicYear: e.target.value, courseYear: "" })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {yearOptions.academicYears.map((item) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                size="small"
                disabled={!hostelFilters.academicYear}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  bgcolor: "#fff",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    height: 48,
                  },
                  "& .MuiInputLabel-root": { fontSize: 13 },
                  "& .MuiSelect-select": { fontSize: 13 },
                }}
              >
                <InputLabel>Course Year</InputLabel>
                <Select
                  label="Course Year"
                  value={hostelFilters.courseYear}
                  onChange={(e) => applyYearFilters({ courseYear: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  {yearOptions.courseYears.map((item) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <StatCard
              title="Students"
              value={formatNumber(studentsCardValue)}
              subtitle="Matching academic / course year"
              accent="#0B2C34"
              icon={<GroupsRoundedIcon />}
              selected={!showHostelTable}
              onClick={() => {
                setShowHostelTable(false);
                setHostelFilters({ hostel: "", room: "", category: "" });
              }}
              delay={0}
            />
            <StatCard
              title="Hostel students"
              value={formatNumber(hostelStats?.totalHostelStudents ?? 0)}
              subtitle="Allocated to hostel · matching filters"
              accent="#8B4A6B"
              icon={<HomeWorkRoundedIcon />}
              selected={showHostelTable}
              onClick={() => setShowHostelTable(true)}
              delay={40}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 120ms both" }}>
            <Typography
              variant="h6"
              sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
            >
              {chartMode === "feePaid"
                ? "Fee paid vs unpaid"
                : chartMode === "courseYear"
                  ? "Students by course year"
                  : "Students by academic year"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              {chartMode === "feePaid"
                ? `${selectedCourseName} · fee status`
                : chartMode === "courseYear"
                  ? `${selectedCourseName} · course year`
                  : `${selectedCourseName} · academic year`}
            </Typography>
            {studentChartData.labels.length === 0 ? (
              <Box height={280} display="flex" alignItems="center" justifyContent="center">
                <Typography color="text.secondary">No student data yet</Typography>
              </Box>
            ) : (
              <BarChart
                key={`${chartMode}|${hostelFilters.academicYear}|${hostelFilters.courseYear}|${studentChartData.values.join(",")}`}
                height={280}
                series={[
                  {
                    data: studentChartData.values,
                    label:
                      chartMode === "feePaid"
                        ? "Fees"
                        : chartMode === "courseYear"
                          ? "Course year"
                          : "Students",
                    ...(chartMode === "feePaid"
                      ? {}
                      : { color: "#0B2C34" }),
                  },
                ]}
                xAxis={[
                  {
                    data: studentChartData.labels,
                    scaleType: "band",
                    ...(chartMode === "feePaid" && studentChartData.colors
                      ? {
                          colorMap: {
                            type: "ordinal" as const,
                            values: studentChartData.labels,
                            colors: studentChartData.colors,
                          },
                        }
                      : {}),
                    tickLabelStyle: { fontSize: 10, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                slotProps={{ legend: { hidden: true } }}
                grid={{ horizontal: true }}
                sx={chartAxisSx}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: { xs: 3, sm: 3.5, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 2,
            mb: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: 16, md: 18 } }}>
              {showHostelTable
                ? `${selectedCourseName} hostel students`
                : `${selectedCourseName} students`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {showHostelTable
                ? `${formatNumber(hostelTotal)} hostel students matching filters`
                : `${formatNumber(studentTotal)} students matching current filters`}
            </Typography>
          </Box>
          {!showHostelTable ? (
            <Typography
              component="button"
              onClick={() => navigate("/students")}
              sx={{
                border: 0,
                background: "none",
                cursor: "pointer",
                color: "primary.main",
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "inherit",
                p: 0,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Open full list →
            </Typography>
          ) : null}
        </Box>

        {showHostelTable ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mb: 2 }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 140,
                flex: "1 1 140px",
                bgcolor: "#fff",
                "& .MuiOutlinedInput-root": { bgcolor: "#fff", height: 40 },
              }}
            >
              <InputLabel>Hostel</InputLabel>
              <Select
                label="Hostel"
                value={hostelFilters.hostel || ""}
                onChange={(e) =>
                  setHostelFilters({ hostel: e.target.value, room: "" })
                }
              >
                <MenuItem value="">All hostels</MenuItem>
                {hostelOptions.map((h) => (
                  <MenuItem key={h.id} value={String(h.id)}>
                    {h.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{
                minWidth: 140,
                flex: "1 1 140px",
                bgcolor: "#fff",
                "& .MuiOutlinedInput-root": { bgcolor: "#fff", height: 40 },
              }}
            >
              <InputLabel>Room</InputLabel>
              <Select
                label="Room"
                value={hostelFilters.room || ""}
                onChange={(e) => setHostelFilters({ room: e.target.value })}
              >
                <MenuItem value="">All rooms</MenuItem>
                {roomOptions.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{
                minWidth: 140,
                flex: "1 1 140px",
                bgcolor: "#fff",
                "& .MuiOutlinedInput-root": { bgcolor: "#fff", height: 40 },
              }}
            >
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={hostelFilters.category || ""}
                onChange={(e) => setHostelFilters({ category: e.target.value })}
              >
                <MenuItem value="">All categories</MenuItem>
                {roomCategories.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : null}

        {showHostelTable ? (
          hostelTableLoading ? (
            <PageSkeleton cards={0} table />
          ) : (
            <DataTableCard
              columns={hostelColumns}
              rows={hostelRows}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/students/${r.id}`)}
              searchPlaceholder="Search roll, name, room…"
              emptyText="No hostel students for these filters"
              pagination={{
                page: hostelPage,
                pageSize: hostelPageSize,
                total: hostelTotal,
                pageCount: hostelPageCount,
                onPageChange: setHostelPage,
                onPageSizeChange: (size) => {
                  setHostelPageSize(size);
                  setHostelPage(1);
                },
              }}
            />
          )
        ) : tableLoading ? (
          <PageSkeleton cards={0} table />
        ) : (
          <DataTableCard
            columns={studentColumns}
            rows={studentRows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/students/${r.id}`)}
            searchPlaceholder="Search roll, name…"
            emptyText="No students for this course"
            pagination={{
              page: studentPage,
              pageSize: studentPageSize,
              total: studentTotal,
              pageCount: studentPageCount,
              onPageChange: setStudentPage,
              onPageSizeChange: (size) => {
                setStudentPageSize(size);
                setStudentPage(1);
              },
            }}
          />
        )}
      </Box>
        </>
      )}
    </Box>
  );
}
