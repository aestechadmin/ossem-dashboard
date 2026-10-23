import {
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Chip,
} from "@mui/material";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdmissions,
  fetchFilters,
  type AdmissionItem,
  type PortalFilters,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { useFilterStore } from "@/store/filterStore";
import { toastError } from "@/store/toastStore";
import { getCascadedOptions, pruneAdmissionFilters } from "@/utils/cascadeFilters";

const emptyFilters: PortalFilters = {
  courses: [],
  specializations: [],
  academicYears: [],
  courseYears: [],
  classrooms: [],
};

export default function AdmissionsPage() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const filters = useFilterStore((s) => s.admissions);
  const setAdmissionFilters = useFilterStore((s) => s.setAdmissionFilters);

  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyFilters);
  const [items, setItems] = useState<AdmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [todayAdmissions, setTodayAdmissions] = useState(0);
  const [feePaid, setFeePaid] = useState(0);
  const [feePending, setFeePending] = useState(0);
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

  function applyAdmissionFilters(patch: Partial<typeof filters>) {
    setPage(1);
    setAdmissionFilters(
      pruneAdmissionFilters(allOptions, {
        course: filters.course,
        specialization: filters.specialization,
        academicYear: filters.academicYear,
        ...patch,
      })
    );
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchAdmissions({
          branch: selectedBranchId,
          course: filters.course || undefined,
          specialization: filters.specialization || undefined,
          academicYear: filters.academicYear || undefined,
          page,
          pageSize,
        });
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setTodayAdmissions(data.todayAdmissions || 0);
          setFeePaid(data.feePaid || 0);
          setFeePending(data.feePending || 0);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: any) {
        if (active) {
          toastError(err, "Could not load admissions.");
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
    page,
    pageSize,
  ]);

  const columns: Column<AdmissionItem>[] = [
    {
      key: "name",
      label: "Student",
      render: (r) => r.name,
      getValue: (r) => r.name,
      minWidth: 160,
    },
    { key: "mobile", label: "Mobile", render: (r) => r.mobile, getValue: (r) => r.mobile },
    { key: "course", label: "Course", render: (r) => r.course, getValue: (r) => r.course },
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
      key: "date",
      label: "Admitted",
      render: (r) => (r.dateOfAdmission ? String(r.dateOfAdmission).slice(0, 10) : "—"),
      getValue: (r) => (r.dateOfAdmission ? String(r.dateOfAdmission).slice(0, 10) : ""),
    },
    {
      key: "gender",
      label: "Gender",
      render: (r) =>
        r.gender ? <Chip size="small" label={r.gender} sx={{ height: 22, fontSize: 11 }} /> : "—",
      getValue: (r) => r.gender,
    },
  ];

  return (
    <Box>
      <PageHeader subtitle="Filter and browse admission records for the selected branch." />

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
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                label="Course"
                value={filters.course}
                onChange={(e) => applyAdmissionFilters({ course: e.target.value })}
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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" disabled={!filters.course}>
              <InputLabel>Specialization</InputLabel>
              <Select
                label="Specialization"
                value={filters.specialization}
                onChange={(e) => applyAdmissionFilters({ specialization: e.target.value })}
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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" disabled={!filters.specialization}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                value={filters.academicYear}
                onChange={(e) => applyAdmissionFilters({ academicYear: e.target.value })}
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
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Admissions"
            value={total.toLocaleString("en-IN")}
            subtitle="Matching filters"
            accent="#0B2C34"
            icon={<HowToRegRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today Admissions"
            value={todayAdmissions.toLocaleString("en-IN")}
            subtitle="Admitted today (IST)"
            accent="#1A7A6D"
            icon={<TodayRoundedIcon />}
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fee Paid"
            value={feePaid.toLocaleString("en-IN")}
            subtitle="Admission fee paid"
            accent="#3A6B85"
            icon={<CheckCircleRoundedIcon />}
            delay={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fee Pending"
            value={feePending.toLocaleString("en-IN")}
            subtitle="Admission fee pending"
            accent="#C45C3A"
            icon={<PendingActionsRoundedIcon />}
            delay={120}
          />
        </Grid>
      </Grid>

      {loading ? (
        <Box minHeight={280} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search student, mobile, course…"
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
