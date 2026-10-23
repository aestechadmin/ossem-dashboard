import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ManRoundedIcon from "@mui/icons-material/ManRounded";
import WomanRoundedIcon from "@mui/icons-material/WomanRounded";
import { useEffect, useMemo, useState } from "react";
import {
  fetchFilters,
  fetchStudentStats,
  fetchStudents,
  type PortalFilters,
  type StudentItem,
  type StudentStats,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import PiePanel from "@/components/PiePanel";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { useFilterStore } from "@/store/filterStore";
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

export default function StudentsPage() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const filters = useFilterStore((s) => s.students);
  const setStudentFilters = useFilterStore((s) => s.setStudentFilters);

  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyFilters);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [items, setItems] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

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

  function applyStudentFilters(patch: Partial<typeof filters>) {
    setPage(1);
    setStudentFilters(
      pruneStudentFilters(allOptions, {
        course: filters.course,
        specialization: filters.specialization,
        academicYear: filters.academicYear,
        courseYear: filters.courseYear,
        ...patch,
      })
    );
  }

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      try {
        const data = await fetchStudentStats({
          course: filters.course || undefined,
          specialization: filters.specialization || undefined,
          academicYear: filters.academicYear || undefined,
          courseYear: filters.courseYear || undefined,
          year: filters.courseYear || undefined,
          branch: selectedBranchId,
        });
        if (active) setStats(data);
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load student data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, [
    selectedBranchId,
    filters.course,
    filters.specialization,
    filters.academicYear,
    filters.courseYear,
  ]);

  useEffect(() => {
    let active = true;

    async function loadTable() {
      setTableLoading(true);
      try {
        const data = await fetchStudents({
          course: filters.course || undefined,
          specialization: filters.specialization || undefined,
          academicYear: filters.academicYear || undefined,
          courseYear: filters.courseYear || undefined,
          year: filters.courseYear || undefined,
          branch: selectedBranchId,
          page,
          pageSize,
        });
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load student list.");
      } finally {
        if (active) setTableLoading(false);
      }
    }

    loadTable();
    return () => {
      active = false;
    };
  }, [
    selectedBranchId,
    filters.course,
    filters.specialization,
    filters.academicYear,
    filters.courseYear,
    page,
    pageSize,
  ]);

  const columns: Column<StudentItem>[] = [
    {
      key: "roll",
      label: "Roll No",
      render: (r) => r.rollNumber,
      getValue: (r) => r.rollNumber,
    },
    {
      key: "name",
      label: "Student",
      render: (r) => r.name,
      getValue: (r) => r.name,
      minWidth: 160,
    },
    {
      key: "mobile",
      label: "Mobile",
      render: (r) => r.mobile,
      getValue: (r) => r.mobile,
    },
    {
      key: "course",
      label: "Course",
      render: (r) => r.course,
      getValue: (r) => r.course,
    },
    {
      key: "specialization",
      label: "Specialization",
      render: (r) => r.specialization,
      getValue: (r) => r.specialization,
    },
    {
      key: "academicYear",
      label: "Academic Year",
      render: (r) => r.academicYear,
      getValue: (r) => r.academicYear,
    },
    {
      key: "courseYear",
      label: "Course Year",
      render: (r) => r.courseYear,
      getValue: (r) => r.courseYear,
    },
    {
      key: "gender",
      label: "Gender",
      render: (r) =>
        r.gender && r.gender !== "—" ? (
          <Chip size="small" label={r.gender} sx={{ height: 22, fontSize: 11 }} />
        ) : (
          "—"
        ),
      getValue: (r) => r.gender,
    },
    {
      key: "date",
      label: "Admitted",
      render: (r) => (r.dateOfAdmission ? String(r.dateOfAdmission).slice(0, 10) : "—"),
      getValue: (r) => (r.dateOfAdmission ? String(r.dateOfAdmission).slice(0, 10) : ""),
    },
  ];

  return (
    <Box>
      <PageHeader subtitle="Filter by course, specialization, academic year, and course year." />

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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                label="Course"
                value={filters.course}
                onChange={(e) => applyStudentFilters({ course: e.target.value })}
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.course}>
              <InputLabel>Specialization</InputLabel>
              <Select
                label="Specialization"
                value={filters.specialization}
                onChange={(e) => applyStudentFilters({ specialization: e.target.value })}
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.specialization}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                value={filters.academicYear}
                onChange={(e) => applyStudentFilters({ academicYear: e.target.value })}
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
                onChange={(e) => applyStudentFilters({ courseYear: e.target.value })}
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
        </Grid>
      </Paper>

      {loading ? (
        <Box minHeight={160} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Total Students"
                value={formatNumber(stats?.totalStudents || 0)}
                subtitle="Matching current filters"
                accent="#0B2C34"
                icon={<GroupsRoundedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Boys"
                value={formatNumber(stats?.boysCount || 0)}
                subtitle="Male students"
                accent="#3A6B85"
                icon={<ManRoundedIcon />}
                delay={40}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Girls"
                value={formatNumber(stats?.girlsCount || 0)}
                subtitle="Female students"
                accent="#8B4A6B"
                icon={<WomanRoundedIcon />}
                delay={80}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {!filters.course ? (
              <Grid item xs={12} lg={6}>
                <PiePanel title="By Course" data={stats?.byCourse || []} delay={80} />
              </Grid>
            ) : null}
            {!filters.specialization ? (
              <Grid item xs={12} lg={6}>
                <PiePanel
                  title="By Specialization"
                  data={stats?.bySpecialization || []}
                  delay={120}
                />
              </Grid>
            ) : null}
            {!filters.academicYear ? (
              <Grid item xs={12} lg={6}>
                <PiePanel
                  title="By Academic Year"
                  data={stats?.byAcademicYear || []}
                  delay={160}
                />
              </Grid>
            ) : null}
            {!filters.courseYear ? (
              <Grid item xs={12} lg={6}>
                <PiePanel title="By Course Year" data={stats?.byCourseYear || []} delay={200} />
              </Grid>
            ) : null}
          </Grid>
        </>
      )}

      {tableLoading ? (
        <Box minHeight={240} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search student, roll no, course…"
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
