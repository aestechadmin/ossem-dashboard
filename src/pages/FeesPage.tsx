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
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import { useEffect, useMemo, useState } from "react";
import {
  fetchFees,
  fetchFilters,
  type FeeItem,
  type PortalFilters,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { useFilterStore } from "@/store/filterStore";
import { toastError } from "@/store/toastStore";
import { getCascadedOptions, pruneFeeFilters } from "@/utils/cascadeFilters";

const emptyFilters: PortalFilters = {
  courses: [],
  specializations: [],
  academicYears: [],
  courseYears: [],
  classrooms: [],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function FeesPage() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const filters = useFilterStore((s) => s.fees);
  const setFeeFilters = useFilterStore((s) => s.setFeeFilters);

  const [view, setView] = useState<"all" | "today">("all");
  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyFilters);
  const [items, setItems] = useState<FeeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayAmount, setTodayAmount] = useState(0);
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

  function applyFeeFilters(patch: Partial<typeof filters>) {
    setPage(1);
    setFeeFilters(
      pruneFeeFilters(allOptions, {
        paid: filters.paid,
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
        const data = await fetchFees({
          paid: view === "all" ? filters.paid || undefined : undefined,
          course: view === "all" ? filters.course || undefined : undefined,
          specialization: view === "all" ? filters.specialization || undefined : undefined,
          academicYear: view === "all" ? filters.academicYear || undefined : undefined,
          branch: selectedBranchId,
          today: view === "today",
          page,
          pageSize,
        });
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setTotalAmount(data.totalAmount);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
          if (view === "today") {
            setTodayTotal(data.total);
            setTodayAmount(data.totalAmount);
          } else if (data.todayTotal != null) {
            setTodayTotal(data.todayTotal);
            setTodayAmount(data.todayAmount || 0);
          }
        }
      } catch (err: any) {
        if (active) {
          toastError(err, "Could not load fee records.");
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
    view,
    selectedBranchId,
    filters.paid,
    filters.course,
    filters.specialization,
    filters.academicYear,
    page,
    pageSize,
  ]);

  // Keep today card count fresh even when viewing all (reload today stats lightly)
  useEffect(() => {
    if (view !== "all") return;
    let active = true;
    fetchFees({ branch: selectedBranchId, today: true, page: 1, pageSize: 50 })
      .then((data) => {
        if (!active) return;
        setTodayTotal(data.total);
        setTodayAmount(data.totalAmount);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [view, selectedBranchId]);

  const columns: Column<FeeItem>[] = [
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
      key: "amount",
      label: "Fee Amount",
      align: "right",
      render: (r) => (
        <Box component="span" fontWeight={600}>
          {formatCurrency(r.totalAmount)}
        </Box>
      ),
      getValue: (r) => r.totalAmount,
    },
    {
      key: "pending",
      label: "Pending",
      align: "right",
      render: (r) => formatCurrency(r.pendingAmount),
      getValue: (r) => r.pendingAmount,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Chip
          size="small"
          label={r.feePaid ? "Paid" : "Pending"}
          color={r.feePaid ? "success" : "warning"}
          variant="outlined"
          sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
        />
      ),
      getValue: (r) => (r.feePaid ? "Paid" : "Pending"),
    },
    {
      key: "year",
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
      key: "due",
      label: "Due Date",
      render: (r) => (r.dueDate ? String(r.dueDate).slice(0, 10) : "—"),
      getValue: (r) => (r.dueDate ? String(r.dueDate).slice(0, 10) : ""),
    },
  ];

  return (
    <Box>
      <PageHeader
        subtitle={
          view === "today"
            ? "Payments collected today (IST)."
            : "Fee records with amount, pending balance, and payment status."
        }
        action={
          view === "today" ? (
            <Box
              component="button"
              onClick={() => {
                setPage(1);
                setView("all");
              }}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "#fff",
                px: 1.5,
                py: 0.75,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                color: "primary.main",
                "&:hover": { bgcolor: "#F4F7F8", borderColor: "primary.main" },
              }}
            >
              All fees
            </Box>
          ) : undefined
        }
      />

      {view === "all" ? (
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
                  onChange={(e) => applyFeeFilters({ course: e.target.value })}
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
                  onChange={(e) => applyFeeFilters({ specialization: e.target.value })}
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
                  onChange={(e) => applyFeeFilters({ academicYear: e.target.value })}
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
              <FormControl fullWidth size="small">
                <InputLabel>Payment status</InputLabel>
                <Select
                  label="Payment status"
                  value={filters.paid}
                  onChange={(e) =>
                    applyFeeFilters({ paid: e.target.value as "" | "true" | "false" })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Paid</MenuItem>
                  <MenuItem value="false">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      ) : null}

      {view === "all" ? (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Fee Records"
              value={total.toLocaleString("en-IN")}
              accent="#C45C3A"
              icon={<PaymentsRoundedIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Fees Amount"
              value={formatCurrency(totalAmount)}
              accent="#3A6B85"
              icon={<AccountBalanceWalletRoundedIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Today Fees"
              value={todayTotal.toLocaleString("en-IN")}
              subtitle={formatCurrency(todayAmount)}
              accent="#1A7A6D"
              icon={<TodayRoundedIcon />}
              onClick={() => {
                setPage(1);
                setView("today");
              }}
            />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <StatCard
              title="Today Fee Records"
              value={todayTotal.toLocaleString("en-IN")}
              accent="#1A7A6D"
              icon={<TodayRoundedIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatCard
              title="Today Collected"
              value={formatCurrency(todayAmount)}
              accent="#3A6B85"
              icon={<AccountBalanceWalletRoundedIcon />}
            />
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box minHeight={280} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search student, roll no, year…"
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
