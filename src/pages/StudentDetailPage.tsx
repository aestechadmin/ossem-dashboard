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
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  fetchAttendances,
  fetchFees,
  fetchStudentSummary,
  type AttendanceItem,
  type FeeItem,
  type FeeKind,
  type FeeSummary,
  type StudentSummary,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

type Section = "fees" | "hostel" | "attendance";

const emptyFeeSummary: FeeSummary = {
  total: { amount: 0, count: 0 },
  online: { amount: 0, count: 0 },
  offline: { amount: 0, count: 0 },
  advance: { amount: 0, count: 0 },
  demand: { amount: 0, count: 0 },
  adjust: { amount: 0, count: 0 },
};

const FEE_KIND_OPTIONS: Array<{ value: FeeKind; label: string }> = [
  { value: "all", label: "All" },
  { value: "total", label: "Total collected" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "advance", label: "Advance" },
  { value: "demand", label: "Demand" },
  { value: "adjust", label: "Adjust" },
];

const chartPaperSx = {
  p: { xs: 2, sm: 2.5 },
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
  boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
  background: "linear-gradient(165deg, #FFFFFF 0%, #F8FBFC 100%)",
} as const;

const chartAxisSx = {
  "& .MuiChartsAxis-line": { stroke: "rgba(11,44,52,0.12)" },
  "& .MuiChartsAxis-tick": { stroke: "rgba(11,44,52,0.12)" },
  "& .MuiChartsGrid-line": { stroke: "rgba(11,44,52,0.06)" },
} as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactCurrency(value: number) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000;
    return `${sign}₹${cr.toLocaleString("en-IN", {
      maximumFractionDigits: cr >= 10 ? 1 : 2,
    })} Cr`;
  }
  if (abs >= 1_00_000) {
    const lacs = abs / 1_00_000;
    return `${sign}₹${lacs.toLocaleString("en-IN", {
      maximumFractionDigits: lacs >= 10 ? 1 : 2,
    })} Lacs`;
  }
  return `₹${formatNumber(amount)}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [data, setData] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>(
    sectionParam === "hostel" || sectionParam === "attendance" || sectionParam === "fees"
      ? sectionParam
      : "fees"
  );

  const [feeKind, setFeeKind] = useState<FeeKind>("all");
  const [feeRows, setFeeRows] = useState<FeeItem[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary>(emptyFeeSummary);
  const [feeTotal, setFeeTotal] = useState(0);
  const [feePage, setFeePage] = useState(1);
  const [feePageSize, setFeePageSize] = useState<PageSizeOption>(50);
  const [feePageCount, setFeePageCount] = useState(1);
  const [feeLoading, setFeeLoading] = useState(false);

  const [attendanceRows, setAttendanceRows] = useState<AttendanceItem[]>([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [presentMarks, setPresentMarks] = useState(0);
  const [absentMarks, setAbsentMarks] = useState(0);
  const [attPage, setAttPage] = useState(1);
  const [attPageSize, setAttPageSize] = useState<PageSizeOption>(50);
  const [attPageCount, setAttPageCount] = useState(1);
  const [attLoading, setAttLoading] = useState(false);
  const [attPresentFilter, setAttPresentFilter] = useState<"" | "true" | "false">("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    const fromUrl =
      sectionParam === "hostel" || sectionParam === "attendance" || sectionParam === "fees"
        ? sectionParam
        : "fees";
    setSection(fromUrl);
    fetchStudentSummary(id)
      .then((res) => {
        if (!active) return;
        setData(res);
        setFeeKind("all");
        setFeePage(1);
      })
      .catch((err: unknown) => {
        if (active) {
          setData(null);
          toastError(err, "Could not load student.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, sectionParam]);

  useEffect(() => {
    if (!id || section !== "fees") return;
    let active = true;
    setFeeLoading(true);
    fetchFees({
      branch: selectedBranchId,
      student: String(id),
      kind: feeKind,
      page: feePage,
      pageSize: feePageSize,
    })
      .then((res) => {
        if (!active) return;
        setFeeSummary(res.summary || emptyFeeSummary);
        setFeeRows(res.items || []);
        setFeeTotal(res.total || 0);
        setFeePageCount(res.pageCount || 1);
        if (res.page && res.page !== feePage) setFeePage(res.page);
      })
      .catch((err: unknown) => {
        if (active) toastError(err, "Could not load fees.");
      })
      .finally(() => {
        if (active) setFeeLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, section, selectedBranchId, feeKind, feePage, feePageSize]);

  useEffect(() => {
    if (!id || section !== "attendance") return;
    let active = true;
    setAttLoading(true);
    fetchAttendances({
      branch: selectedBranchId,
      student: String(id),
      present: attPresentFilter || undefined,
      page: attPage,
      pageSize: attPageSize,
    })
      .then((res) => {
        if (!active) return;
        setAttendanceRows(res.items || []);
        setAttendanceTotal(res.listTotal ?? res.total ?? 0);
        setPresentMarks(res.presentRecords ?? 0);
        setAbsentMarks(res.absentRecords ?? 0);
        setAttPageCount(res.pageCount || 1);
        if (res.page && res.page !== attPage) setAttPage(res.page);
      })
      .catch((err: unknown) => {
        if (active) toastError(err, "Could not load attendance.");
      })
      .finally(() => {
        if (active) setAttLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, section, selectedBranchId, attPresentFilter, attPage, attPageSize]);

  const feeChart = useMemo(() => {
    const s = feeSummary;
    return {
      labels: ["Online", "Offline", "Advance", "Demand", "Adjust"],
      values: [
        s.online?.amount || 0,
        s.offline?.amount || 0,
        s.advance?.amount || 0,
        s.demand?.amount || 0,
        s.adjust?.amount || 0,
      ],
    };
  }, [feeSummary]);

  const attendanceChart = useMemo(
    () => ({
      labels: ["Present", "Absent"],
      values: [presentMarks, absentMarks],
    }),
    [presentMarks, absentMarks]
  );

  const feeColumns: Column<FeeItem>[] = useMemo(() => {
    const cols: Column<FeeItem>[] = [
      {
        key: "amount",
        label: feeKind === "demand" ? "Demand" : "Amount",
        align: "right",
        render: (r) => formatCurrency(r.amount),
        getValue: (r) => r.amount,
      },
    ];
    if (feeKind === "demand") {
      cols.push({
        key: "pending",
        label: "Pending",
        align: "right",
        render: (r) => formatCurrency(r.pendingAmount || 0),
        getValue: (r) => r.pendingAmount,
      });
    }
    cols.push(
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
        key: "mode",
        label: "Mode",
        render: (r) => r.mode || "—",
        getValue: (r) => r.mode,
      },
      {
        key: "type",
        label: "Type",
        render: (r) => r.type || "—",
        getValue: (r) => r.type,
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
        key: "date",
        label: "Date",
        render: (r) => formatDateTime(r.date),
        getValue: (r) => r.date,
      }
    );
    return cols;
  }, [feeKind]);

  const attendanceColumns: Column<AttendanceItem>[] = [
    {
      key: "date",
      label: "Date",
      render: (r) => formatDateTime(r.date),
      getValue: (r) => r.date,
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
      key: "classroom",
      label: "Classroom",
      render: (r) => r.classroom,
      getValue: (r) => r.classroom,
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
  ];

  const hostelColumns: Column<Record<string, string>>[] = [
    { key: "block", label: "Block", render: (r) => r.block, getValue: (r) => r.block },
    { key: "room", label: "Room", render: (r) => r.room, getValue: (r) => r.room },
    { key: "status", label: "Status", render: (r) => r.status, getValue: (r) => r.status },
  ];

  if (loading) {
    return (
      <Box>
        <PageHeader subtitle="Loading student…" />
        <PageSkeleton cards={3} charts={1} table />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <PageHeader subtitle="Student not found." />
      </Box>
    );
  }

  const { student, fees, hostel, attendance } = data;

  return (
    <Box>
      <PageHeader
        subtitle={`${student.rollNumber} · ${student.course} · ${student.courseYear}`}
      />

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75, fontSize: { xs: 20, md: 24 } }}>
          {student.name}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {student.academicYear && student.academicYear !== "—" ? (
            <Chip size="small" variant="outlined" label={student.academicYear} />
          ) : null}
        </Box>
      </Box>

      <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Fees"
            value={formatCompactCurrency(fees.totalAmount)}
            subtitle={
              fees.summary?.paidCount != null || fees.summary?.unpaidCount != null
                ? `Paid ${fees.summary?.paidCount || 0} · Unpaid ${fees.summary?.unpaidCount || 0} · Demand ${formatCompactCurrency(fees.demandAmount)}`
                : `Collected · Demand ${formatCompactCurrency(fees.demandAmount)}`
            }
            accent="#3A6B85"
            icon={<PaymentsRoundedIcon />}
            selected={section === "fees"}
            onClick={() => {
              setFeePage(1);
              setSection("fees");
            }}
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Hostel"
            value={hostel.allocated ? hostel.room || "Allocated" : "Not allotted"}
            subtitle={
              hostel.allocated
                ? `${hostel.block || "—"} · Room allocated`
                : "No hostel room allotted"
            }
            accent="#8B4A6B"
            icon={<HomeWorkRoundedIcon />}
            selected={section === "hostel"}
            onClick={() => setSection("hostel")}
            delay={40}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Attendance"
            value={formatNumber(attendance.totalMarks)}
            subtitle={
              attendance.totalMarks > 0
                ? `P ${formatNumber(attendance.presentMarks)} · A ${formatNumber(attendance.absentMarks)}`
                : "No attendance marked"
            }
            accent="#1A7A6D"
            icon={<FactCheckRoundedIcon />}
            selected={section === "attendance"}
            onClick={() => {
              setAttPage(1);
              setSection("attendance");
            }}
            delay={80}
          />
        </Grid>
      </Grid>

      {section === "fees" ? (
        <Box>
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
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
              <InputLabel>Fee type</InputLabel>
              <Select
                label="Fee type"
                value={feeKind}
                onChange={(e) => {
                  setFeePage(1);
                  setFeeKind(e.target.value as FeeKind);
                }}
              >
                {FEE_KIND_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.value !== "all" && feeSummary[opt.value]?.count
                      ? ` (${feeSummary[opt.value].count})`
                      : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          <Paper elevation={0} sx={{ ...chartPaperSx, mb: 2.5, animation: "fadeUp 0.4s ease both" }}>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}>
              Fee breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              This student only
            </Typography>
            <BarChart
              height={260}
              series={[
                {
                  data: feeChart.values,
                  label: "Amount",
                  color: "#3A6B85",
                  valueFormatter: (v) => formatCompactCurrency(v || 0),
                },
              ]}
              xAxis={[
                {
                  data: feeChart.labels,
                  scaleType: "band",
                  tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" },
                },
              ]}
              yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
              slotProps={{ legend: { hidden: true } }}
              borderRadius={4}
              grid={{ horizontal: true }}
              sx={chartAxisSx}
            />
          </Paper>
          {feeLoading ? (
            <PageSkeleton cards={0} table />
          ) : (
            <DataTableCard
              columns={feeColumns}
              rows={feeRows}
              rowKey={(r) => `${r.mode}-${r.type}-${r.id}-${r.date || ""}`}
              searchPlaceholder={`Search ${feeKind}…`}
              emptyText={`No ${feeKind} records for this student`}
              pagination={{
                page: feePage,
                pageSize: feePageSize,
                total: feeTotal,
                pageCount: feePageCount,
                onPageChange: setFeePage,
                onPageSizeChange: (size) => {
                  setFeePageSize(size);
                  setFeePage(1);
                },
              }}
            />
          )}
        </Box>
      ) : null}

      {section === "hostel" ? (
        hostel.allocated ? (
          <Box>
            <Paper elevation={0} sx={{ ...chartPaperSx, mb: 2.5, animation: "fadeUp 0.4s ease both" }}>
              <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}>
                Hostel allocation
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                This student only
              </Typography>
              <BarChart
                height={220}
                series={[
                  {
                    data: [1],
                    label: "Allocated",
                    color: "#8B4A6B",
                    valueFormatter: () => "1",
                  },
                ]}
                xAxis={[
                  {
                    data: [`${hostel.block || "Block"} · ${hostel.room || "Room"}`],
                    scaleType: "band",
                    tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 1,
                    tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" },
                  },
                ]}
                slotProps={{ legend: { hidden: true } }}
                borderRadius={4}
                grid={{ horizontal: true }}
                sx={chartAxisSx}
              />
            </Paper>
            <DataTableCard
              columns={hostelColumns}
              rows={[
                {
                  block: hostel.block || "—",
                  room: hostel.room || "—",
                  status: "Allocated",
                },
              ]}
              rowKey={() => "hostel"}
              searchPlaceholder="Search hostel…"
              emptyText="No hostel allocation"
            />
          </Box>
        ) : (
          <Paper elevation={0} sx={{ ...chartPaperSx, p: 3, animation: "fadeUp 0.4s ease both" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Not allotted
            </Typography>
            <Typography color="text.secondary">
              This student has no hostel room allotted.
            </Typography>
          </Paper>
        )
      ) : null}

      {section === "attendance" ? (
        <Box>
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
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={attPresentFilter}
                onChange={(e) => {
                  setAttPage(1);
                  setAttPresentFilter(e.target.value as "" | "true" | "false");
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Present</MenuItem>
                <MenuItem value="false">Absent</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <Paper elevation={0} sx={{ ...chartPaperSx, mb: 2.5, animation: "fadeUp 0.4s ease both" }}>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}>
              Attendance — present vs absent
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              This student only · marks
            </Typography>
            {presentMarks + absentMarks > 0 ? (
              <BarChart
                height={260}
                series={[
                  {
                    data: attendanceChart.values,
                    label: "Marks",
                    color: "#1A7A6D",
                    valueFormatter: (v) => formatNumber(v || 0),
                  },
                ]}
                xAxis={[
                  {
                    data: attendanceChart.labels,
                    scaleType: "band",
                    tickLabelStyle: { fontSize: 12, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                slotProps={{ legend: { hidden: true } }}
                borderRadius={4}
                grid={{ horizontal: true }}
                sx={chartAxisSx}
              />
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                No attendance marked for this student.
              </Typography>
            )}
          </Paper>
          {attLoading ? (
            <PageSkeleton cards={0} table />
          ) : (
            <DataTableCard
              columns={attendanceColumns}
              rows={attendanceRows}
              rowKey={(r) => r.id}
              searchPlaceholder="Search attendance…"
              emptyText="No attendance for this student"
              pagination={{
                page: attPage,
                pageSize: attPageSize,
                total: attendanceTotal,
                pageCount: attPageCount,
                onPageChange: setAttPage,
                onPageSizeChange: (size) => {
                  setAttPageSize(size);
                  setAttPage(1);
                },
              }}
            />
          )}
        </Box>
      ) : null}
    </Box>
  );
}
