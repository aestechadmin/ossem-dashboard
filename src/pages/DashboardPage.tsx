import { Box, Grid, Paper, Typography } from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ViewStudentButton from "@/components/ViewStudentButton";
import {
  fetchFees,
  fetchHostelOverview,
  fetchOverview,
  fetchStudents,
  fetchStudentStats,
  type FeeSummary,
  type HostelOverviewStats,
  type OverviewStats,
  type StudentItem,
  type StudentStats,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import StudentNameLink from "@/components/StudentNameLink";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

/** Compact Indian amount — e.g. ₹1.25 Cr, ₹45.5 Lacs */
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
    const lacs = abs / 1_00_000;
    return `${sign}₹${lacs.toLocaleString("en-IN", {
      maximumFractionDigits: lacs >= 10 ? 1 : 2,
      minimumFractionDigits: 0,
    })} Lacs`;
  }
  return `₹${formatNumber(amount)}`;
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
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [hostelStats, setHostelStats] = useState<HostelOverviewStats | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [feeTotal, setFeeTotal] = useState(0);
  const [studentRows, setStudentRows] = useState<StudentItem[]>([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState<PageSizeOption>(50);
  const [studentPageCount, setStudentPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    setStudentPage(1);
  }, [selectedBranchId, selectedCourseId]);

  useEffect(() => {
    if (selectedBranchId == null || selectedCourseId == null) return;
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const course = String(selectedCourseId);
        const [overview, students, fees, hostel] = await Promise.all([
          fetchOverview(selectedBranchId, selectedCourseId),
          fetchStudentStats({ branch: selectedBranchId, course }),
          fetchFees({
            branch: selectedBranchId,
            course,
            kind: "total",
            page: 1,
            pageSize: 50,
          }),
          fetchHostelOverview(selectedBranchId, { course }),
        ]);
        if (active) {
          setStats(overview);
          setStudentStats(students);
          setFeeSummary(fees.summary || null);
          setFeeTotal(Number(fees.totalAmount) || 0);
          setHostelStats(hostel);
        }
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
  }, [selectedBranchId, selectedCourseId]);

  useEffect(() => {
    if (selectedBranchId == null || selectedCourseId == null) return;
    let active = true;

    async function loadStudents() {
      setTableLoading(true);
      try {
        const data = await fetchStudents({
          branch: selectedBranchId,
          course: String(selectedCourseId),
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
  }, [selectedBranchId, selectedCourseId, studentPage, studentPageSize]);

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

  const studentLineData = useMemo(() => {
    const rows = [...(studentStats?.byAcademicYear || [])].sort((a, b) => {
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
    };
  }, [studentStats]);

  const feeChartData = useMemo(() => {
    const s = feeSummary;
    return {
      labels: ["Online", "Offline", "Advance", "Demand", "Adjust"],
      values: [
        s?.online?.amount || 0,
        s?.offline?.amount || 0,
        s?.advance?.amount || 0,
        s?.demand?.amount || 0,
        s?.adjust?.amount || 0,
      ],
    };
  }, [feeSummary]);

  const feePaidUnpaidChart = useMemo(
    () => ({
      labels: ["Paid", "Unpaid"],
      values: [Number(feeSummary?.paidCount) || 0, Number(feeSummary?.unpaidCount) || 0],
    }),
    [feeSummary]
  );

  // Hostel and room counts without demographic breakdowns.
  const hostelScatterData = useMemo(() => {
    const points = [
      { id: 0, x: 0, y: hostelStats?.totalHostelStudents || 0, label: "In hostel" },
      { id: 1, x: 1, y: hostelStats?.occupiedRooms || 0, label: "Occupied rooms" },
      { id: 2, x: 2, y: hostelStats?.vacantRooms || 0, label: "Vacant rooms" },
    ];
    return {
      labels: points.map((p) => p.label),
      points: points.map(({ id, x, y }) => ({ id, x, y })),
    };
  }, [hostelStats]);

  if (loading) {
    return (
      <Box>
        <PageHeader
          subtitle={`${selectedCourseName} — students & hostel for this course.`}
        />
        <PageSkeleton cards={2} charts={2} table />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        subtitle={`${selectedCourseName} — students & hostel for this course.`}
      />

      {/* Fees card is temporarily hidden; show Students and Hostel only. */}
      <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Students"
            value={formatNumber(stats?.totalStudents || studentStats?.totalStudents || 0)}
            subtitle={`${selectedCourseName} · Open list`}
            accent="#0B2C34"
            icon={<GroupsRoundedIcon />}
            onClick={() => navigate("/students")}
            delay={0}
          />
        </Grid>
        {false && (
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Fees"
              value={formatCompactCurrency(feeTotal)}
              subtitle={`${selectedCourseName} · Collected`}
              accent="#3A6B85"
              icon={<PaymentsRoundedIcon />}
              onClick={() => navigate("/fees")}
              delay={40}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Hostel students"
            value={formatNumber(hostelStats?.totalHostelStudents || 0)}
            subtitle={`${selectedCourseName} · In hostel`}
            accent="#8B4A6B"
            icon={<HomeWorkRoundedIcon />}
            onClick={() => navigate("/hostel")}
            delay={80}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Box sx={{ mt: { xs: 3, sm: 3.5, md: 4 } }}>
        <Grid container spacing={{ xs: 1.75, sm: 2, md: 2.5 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 120ms both" }}>
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Students by academic year
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                {selectedCourseName} · academic year
              </Typography>
              {studentLineData.labels.length === 0 ? (
                <Box height={260} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">No student data yet</Typography>
                </Box>
              ) : (
                <LineChart
                  height={260}
                  series={[
                    {
                      data: studentLineData.values,
                      label: "Students",
                      color: "#0B2C34",
                      area: true,
                      curve: "monotoneX",
                      showMark: true,
                    },
                  ]}
                  xAxis={[
                    {
                      data: studentLineData.labels,
                      scaleType: "point",
                      tickLabelStyle: { fontSize: 10, fontFamily: "Josefin Sans" },
                    },
                  ]}
                  yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                  slotProps={{ legend: { hidden: true } }}
                  grid={{ horizontal: true }}
                  sx={{
                    ...chartAxisSx,
                    "& .MuiAreaElement-root": { fillOpacity: 0.18 },
                  }}
                />
              )}
            </Paper>
          </Grid>

          {/* Fee breakdown and paid/unpaid charts are temporarily hidden. */}
          {false && (
            <>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 160ms both" }}>
                  <Typography variant="h6">Fees breakdown</Typography>
                  <BarChart
                    height={260}
                    series={[{ data: feeChartData.values, label: "Amount" }]}
                    xAxis={[{ data: feeChartData.labels, scaleType: "band" }]}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 180ms both" }}>
                  <Typography variant="h6">Fee paid vs unpaid</Typography>
                  <BarChart
                    height={260}
                    series={[{ data: feePaidUnpaidChart.values, label: "Fees" }]}
                    xAxis={[{ data: feePaidUnpaidChart.labels, scaleType: "band" }]}
                  />
                </Paper>
              </Grid>
            </>
          )}

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ ...chartPaperSx, animation: "fadeUp 0.5s ease 200ms both" }}>
              <Typography
                variant="h6"
                sx={{ mb: 0.5, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              >
                Hostel students
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1.5 }}
              >
                {selectedCourseName} · hostel and room summary
              </Typography>
              <ScatterChart
                height={260}
                series={[
                  {
                    data: hostelScatterData.points,
                    label: "Students",
                    color: "#8B4A6B",
                    markerSize: 10,
                    valueFormatter: ({ x, y }) =>
                      `${hostelScatterData.labels[Number(x)] || "—"}: ${formatNumber(y)}`,
                  },
                ]}
                xAxis={[
                  {
                    min: -0.5,
                    max: 2.5,
                    tickNumber: 3,
                    valueFormatter: (v) => hostelScatterData.labels[Number(v)] || "",
                    tickLabelStyle: { fontSize: 10, fontFamily: "Josefin Sans" },
                  },
                ]}
                yAxis={[{ tickLabelStyle: { fontSize: 11, fontFamily: "Josefin Sans" } }]}
                grid={{ horizontal: true, vertical: true }}
                sx={chartAxisSx}
              />
            </Paper>
          </Grid>

        </Grid>
      </Box>

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
              {selectedCourseName} students
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatNumber(studentTotal)} students for the selected course
            </Typography>
          </Box>
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
        </Box>
        {tableLoading ? (
          <PageSkeleton cards={0} table />
        ) : (
          <DataTableCard
            columns={studentColumns}
            rows={studentRows}
            rowKey={(r) => r.id}
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
    </Box>
  );
}
