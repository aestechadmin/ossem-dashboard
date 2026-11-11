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
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchFees,
  fetchFilters,
  type FeeItem,
  type FeeKind,
  type FeeSummary,
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
import { getCascadedOptions, pruneFeeFilters } from "@/utils/cascadeFilters";

const emptyOptions: PortalFilters = {
  courses: [],
  specializations: [],
  academicYears: [],
  courseYears: [],
  classrooms: [],
  quotas: [],
};

const emptySummary: FeeSummary = {
  total: { amount: 0, count: 0 },
  online: { amount: 0, count: 0 },
  offline: { amount: 0, count: 0 },
  advance: { amount: 0, count: 0 },
  demand: { amount: 0, count: 0 },
  adjust: { amount: 0, count: 0 },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/** Compact Indian amount for cards — e.g. ₹1.25 Cr, ₹45.5 L */
function formatCompactCurrency(value: number) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000;
    return `${sign}₹${cr.toLocaleString("en-IN", {
      maximumFractionDigits: cr >= 10 ? 1 : 2,
      minimumFractionDigits: 0,
    })} Cr`;
  }
  if (abs >= 1_00_000) {
    const lakh = abs / 1_00_000;
    return `${sign}₹${lakh.toLocaleString("en-IN", {
      maximumFractionDigits: lakh >= 10 ? 1 : 2,
      minimumFractionDigits: 0,
    })} L`;
  }
  return formatCurrency(amount);
}

const KIND_META: Record<
  FeeKind,
  { title: string; accent: string; icon: ReactNode; subtitle: string }
> = {
  all: {
    title: "All Fees",
    accent: "#0B2C34",
    icon: <CurrencyRupeeRoundedIcon />,
    subtitle: "All fee records",
  },
  total: {
    title: "Total Fee",
    accent: "#0B2C34",
    icon: <CurrencyRupeeRoundedIcon />,
    subtitle: "Online + offline collected",
  },
  online: {
    title: "Online Fee",
    accent: "#1A7A6D",
    icon: <PaymentsRoundedIcon />,
    subtitle: "Online paid collections",
  },
  offline: {
    title: "Offline Fee",
    accent: "#3A6B85",
    icon: <AccountBalanceWalletRoundedIcon />,
    subtitle: "Offline paid collections",
  },
  advance: {
    title: "Advance Collected",
    accent: "#8B4A6B",
    icon: <SavingsRoundedIcon />,
    subtitle: "Advance payments",
  },
  demand: {
    title: "Demand Raised",
    accent: "#C45C3A",
    icon: <RequestQuoteRoundedIcon />,
    subtitle: "Fee demands created",
  },
  adjust: {
    title: "Adjust Amount",
    accent: "#6B5B4A",
    icon: <TuneRoundedIcon />,
    subtitle: "Fee adjustments",
  },
};

export default function FeesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student") || "";
  const { selectedBranchId, courseKey, courseName } = useSelectedCourse();
  const filters = useFilterStore((s) => s.fees);
  const setFeeFilters = useFilterStore((s) => s.setFeeFilters);

  const [todayOnly, setTodayOnly] = useState(false);
  const [kind, setKind] = useState<FeeKind>("total");
  const [allOptions, setAllOptions] = useState<PortalFilters>(emptyOptions);
  const [summary, setSummary] = useState<FeeSummary>(emptySummary);
  const [items, setItems] = useState<FeeItem[]>([]);
  const [total, setTotal] = useState(0);
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
      .then(setAllOptions)
      .catch(() => setAllOptions(emptyOptions));
  }, [selectedBranchId]);

  function applyFeeFilters(patch: Partial<typeof filters>) {
    setPage(1);
    setFeeFilters(
      pruneFeeFilters(allOptions, {
        academicYear: filters.academicYear,
        courseYear: filters.courseYear,
        quota: filters.quota || "",
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
        const data = await fetchFees({
          branch: selectedBranchId,
          today: todayOnly,
          kind,
          course: studentId ? undefined : courseKey,
          academicYear: studentId ? undefined : filters.academicYear || undefined,
          courseYear: studentId ? undefined : filters.courseYear || undefined,
          quota: studentId ? undefined : filters.quota || undefined,
          student: studentId || undefined,
          page,
          pageSize,
        });
        if (!active) return;
        setSummary(data.summary || emptySummary);
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPageCount(data.pageCount || 1);
        if (data.page && data.page !== page) setPage(data.page);
      } catch (err: any) {
        if (active) toastError(err, "Could not load fee records.");
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
    todayOnly,
    kind,
    filters.academicYear,
    filters.courseYear,
    filters.quota,
    page,
    pageSize,
  ]);

  const columns: Column<FeeItem>[] = useMemo(() => {
    const cols: Column<FeeItem>[] = [
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
        key: "amount",
        label: "Amount",
        align: "right",
        render: (r) => (
          <Box component="span" fontWeight={600}>
            {formatCurrency(r.amount)}
          </Box>
        ),
        getValue: (r) => r.amount,
      },
      {
        key: "mode",
        label: "Mode",
        render: (r) => r.mode || "—",
        getValue: (r) => r.mode,
      },
      {
        key: "status",
        label: "Status",
        render: (r) => {
          const raw = String(r.status || "").toLowerCase();
          const label =
            raw === "paid"
              ? "Paid"
              : raw === "pending"
                ? "Unpaid"
                : raw === "adjusted"
                  ? "Adjusted"
                  : r.status || "—";
          const color =
            raw === "paid" ? "success" : raw === "pending" ? "warning" : "default";
          return (
            <Chip
              size="small"
              label={label}
              color={color}
              variant="outlined"
              sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
            />
          );
        },
        getValue: (r) => r.status,
      },
      {
        key: "type",
        label: "Type",
        render: (r) => r.type || "—",
        getValue: (r) => r.type,
      },
    ];
    if (!studentId && !filters.academicYear) {
      cols.push({
        key: "year",
        label: "Academic Year",
        render: (r) => r.academicYear,
        getValue: (r) => r.academicYear,
      });
    }
    if (!studentId && !filters.courseYear) {
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
        label: "Date",
        render: (r) => (r.date ? String(r.date).slice(0, 10) : "—"),
        getValue: (r) => (r.date ? String(r.date).slice(0, 10) : ""),
      },
      {
        key: "view",
        label: "Action",
        searchable: false,
        sortable: false,
        align: "right",
        render: (r) => <ViewStudentButton studentId={r.studentId} section="fees" />,
        getValue: () => "",
        minWidth: 72,
      }
    );
    return cols;
  }, [studentId, filters.academicYear, filters.courseYear]);

  const kindOrder: Array<Exclude<FeeKind, "all">> = [
    "total",
    "online",
    "offline",
    "demand",
    "advance",
    "adjust",
  ];

  return (
    <Box>
      <PageHeader
        subtitle={
          studentId
            ? `Fees for this student only.`
            : todayOnly
              ? `${courseName} — today’s fee totals. Tap a card for details.`
              : `${courseName} — fee totals. Tap a card for details.`
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {studentId ? (
              <Chip
                size="small"
                color="primary"
                label="Student filter"
                onDelete={() => navigate("/fees")}
              />
            ) : null}
            <FormControlLabel
              control={
                <Switch
                  checked={todayOnly}
                  onChange={(e) => {
                    setPage(1);
                    setTodayOnly(e.target.checked);
                  }}
                  size="small"
                />
              }
              label="Today"
              sx={{ m: 0, ml: 0.5, "& .MuiFormControlLabel-label": { fontWeight: 600, fontSize: 13 } }}
            />
          </Box>
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <FormControl fullWidth size="small" disabled={!courseKey}>
            <InputLabel>Academic Year</InputLabel>
            <Select
              label="Academic Year"
              value={filters.academicYear || ""}
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
          <FormControl fullWidth size="small" disabled={!filters.academicYear}>
            <InputLabel>Year</InputLabel>
            <Select
              label="Year"
              value={filters.courseYear || ""}
              onChange={(e) => applyFeeFilters({ courseYear: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {options.courseYears.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Quota</InputLabel>
            <Select
              label="Quota"
              value={filters.quota || ""}
              onChange={(e) => applyFeeFilters({ quota: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {(options.quotas || []).map((item) => (
                <MenuItem key={`${item.id}-${item.courseId ?? "all"}`} value={String(item.id)}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Grid container spacing={{ xs: 1.75, sm: 2 }} sx={{ mb: 2.5 }}>
        {kindOrder.map((key, index) => {
          const meta = KIND_META[key];
          const bucket = summary[key] || emptySummary[key];
          return (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <StatCard
                title={todayOnly && key === "demand" ? "Today Demand Raised" : meta.title}
                value={formatCompactCurrency(bucket.amount)}
                subtitle={
                  <Box component="span" display="block">
                    <Box
                      component="span"
                      display="block"
                      sx={{ fontSize: 12, fontWeight: 600, color: "text.primary", mb: 0.25 }}
                    >
                      {formatCurrency(bucket.amount)}
                    </Box>
                    <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                      {bucket.count.toLocaleString("en-IN")} · {meta.subtitle}
                    </Box>
                  </Box>
                }
                accent={meta.accent}
                icon={meta.icon}
                selected={kind === key}
                delay={index * 40}
                onClick={() => {
                  setPage(1);
                  setKind(key);
                }}
              />
            </Grid>
          );
        })}
      </Grid>

      {loading ? (
        <PageSkeleton cards={0} table />
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder={`Search ${KIND_META[kind].title.toLowerCase()}…`}
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
