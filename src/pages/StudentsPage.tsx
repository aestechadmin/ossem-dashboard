import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
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
import PageSkeleton from "@/components/PageSkeleton";
import PiePanel from "@/components/PiePanel";
import StatCard from "@/components/StatCard";
import StudentNameLink from "@/components/StudentNameLink";
import ViewStudentButton from "@/components/ViewStudentButton";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
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
  const { selectedBranchId, courseKey, courseName } = useSelectedCourse();
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
        course: courseKey,
        specialization: "",
        academicYear: filters.academicYear,
      }),
    [allOptions, courseKey, filters.academicYear]
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
        academicYear: filters.academicYear,
        courseYear: filters.courseYear,
        ...patch,
        specialization: "",
        course: courseKey,
      })
    );
  }

  useEffect(() => {
    if (selectedBranchId == null || !courseKey) return;
    let active = true;

    async function loadStats() {
      setLoading(true);
      try {
        const data = await fetchStudentStats({
          course: courseKey,
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
    courseKey,
    filters.academicYear,
    filters.courseYear,
  ]);

  useEffect(() => {
    if (selectedBranchId == null || !courseKey) return;
    let active = true;

    async function loadTable() {
      setTableLoading(true);
      try {
        const data = await fetchStudents({
          course: courseKey,
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
    courseKey,
    filters.academicYear,
    filters.courseYear,
    page,
    pageSize,
  ]);

  const columns: Column<StudentItem>[] = useMemo(() => {
    const cols: Column<StudentItem>[] = [
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
        minWidth: 160,
      },
    ];
    // Course always from header — hide. Other scope cols only when that filter is All.
    if (!courseKey) {
      cols.push({
        key: "course",
        label: "Course",
        render: (r) => r.course,
        getValue: (r) => r.course,
      });
    }
    if (!filters.academicYear) {
      cols.push({
        key: "academicYear",
        label: "Academic Year",
        render: (r) => r.academicYear,
        getValue: (r) => r.academicYear,
      });
    }
    if (!filters.courseYear) {
      cols.push({
        key: "courseYear",
        label: "Course Year",
        render: (r) => r.courseYear,
        getValue: (r) => r.courseYear,
      });
    }
    cols.push(
      {
        key: "date",
        label: "Admitted",
        render: (r) => (r.dateOfAdmission ? String(r.dateOfAdmission).slice(0, 10) : "—"),
        getValue: (r) => (r.dateOfAdmission ? String(r.dateOfAdmission).slice(0, 10) : ""),
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
      }
    );
    return cols;
  }, [courseKey, filters.academicYear, filters.courseYear]);

  return (
    <Box>
      <PageHeader
        subtitle={`${courseName} — filter by academic year and course year.`}
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
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" disabled={!courseKey}>
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
          <Grid item xs={12} sm={6} md={4}>
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
        <PageSkeleton cards={3} charts={2} table={false} />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12}>
              <StatCard
                title="Total Students"
                value={formatNumber(stats?.totalStudents || 0)}
                subtitle="Matching current filters"
                accent="#0B2C34"
                icon={<GroupsRoundedIcon />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
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
        <PageSkeleton cards={0} table />
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
