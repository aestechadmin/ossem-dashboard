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
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import { useEffect, useState } from "react";
import {
  fetchBiometricDevices,
  fetchFilters,
  type BiometricDeviceItem,
  type PortalFilters,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

const emptyFilters: PortalFilters = {
  courses: [],
  specializations: [],
  academicYears: [],
  courseYears: [],
  classrooms: [],
};

export default function BiometricsPage() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [course, setCourse] = useState("");
  const [courses, setCourses] = useState<PortalFilters["courses"]>([]);
  const [items, setItems] = useState<BiometricDeviceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    setPage(1);
    setCourse("");
    fetchFilters(selectedBranchId)
      .then((f) => setCourses(f.courses || []))
      .catch(() => setCourses(emptyFilters.courses));
  }, [selectedBranchId]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchBiometricDevices({
          branch: selectedBranchId,
          course: course || undefined,
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
        if (active) toastError(err, "Could not load biometric devices.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedBranchId, course, page, pageSize]);

  const columns: Column<BiometricDeviceItem>[] = [
    { key: "name", label: "Device", render: (r) => r.name, getValue: (r) => r.name, minWidth: 140 },
    {
      key: "deviceNumber",
      label: "Device No",
      render: (r) => r.deviceNumber,
      getValue: (r) => r.deviceNumber,
    },
    {
      key: "courses",
      label: "Courses",
      render: (r) => r.courses,
      getValue: (r) => r.courses,
      minWidth: 160,
    },
    {
      key: "punchState",
      label: "Punch State",
      render: (r) => r.punchState,
      getValue: (r) => r.punchState,
    },
    {
      key: "enabled",
      label: "Enabled",
      render: (r) => r.enabled,
      getValue: (r) => r.enabled,
    },
  ];

  return (
    <Box>
      <PageHeader subtitle="Biometric devices for the selected institution. Filter by course." />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Biometric"
            value={total.toLocaleString("en-IN")}
            subtitle="Tap to show / hide list"
            accent="#0B2C34"
            icon={<FingerprintRoundedIcon />}
            onClick={() => setShowList((v) => !v)}
          />
        </Grid>
      </Grid>

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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                label="Course"
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All courses</MenuItem>
                {courses.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {!showList ? null : loading ? (
        <Box minHeight={240} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search device, number, course…"
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
