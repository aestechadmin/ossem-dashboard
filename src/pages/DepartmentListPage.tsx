import { Box, CircularProgress } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchClassrooms,
  fetchCourses,
  fetchDepartmentList,
  fetchSchedules,
  fetchSpecializations,
  fetchSubjects,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

type ListKind =
  | "list"
  | "courses"
  | "specializations"
  | "classrooms"
  | "subjects"
  | "schedules";

const titles: Record<ListKind, { subtitle: string }> = {
  list: { subtitle: "All departments for the selected branch." },
  courses: { subtitle: "All courses for the selected branch." },
  specializations: { subtitle: "Specialization list across courses." },
  classrooms: { subtitle: "Classroom inventory." },
  subjects: { subtitle: "Subject catalogue." },
  schedules: { subtitle: "Schedules for the selected branch." },
};

export default function DepartmentListPage() {
  const { kind } = useParams<{ kind: string }>();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);

  const listKind = (kind || "") as ListKind;
  const meta = titles[listKind];

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [listKind, selectedBranchId]);

  useEffect(() => {
    if (!meta) return;
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const paging = { page, pageSize };
        let data: {
          items: Record<string, unknown>[];
          total: number;
          page: number;
          pageCount: number;
        };
        if (listKind === "list") data = await fetchDepartmentList(selectedBranchId, paging);
        else if (listKind === "courses") data = await fetchCourses(selectedBranchId, paging);
        else if (listKind === "specializations")
          data = await fetchSpecializations(selectedBranchId, paging);
        else if (listKind === "classrooms") data = await fetchClassrooms(paging);
        else if (listKind === "subjects") data = await fetchSubjects(paging);
        else data = await fetchSchedules(selectedBranchId, paging);
        if (active) {
          setRows(data.items as Record<string, unknown>[]);
          setTotal(data.total);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: any) {
        if (active) {
          toastError(err, "Could not load this list.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [listKind, meta, selectedBranchId, page, pageSize]);

  const columns: Column<Record<string, unknown>>[] = useMemo(() => {
    if (listKind === "list") {
      return [
        { key: "name", label: "Department", render: (r) => String(r.name || "—"), minWidth: 140 },
        { key: "course", label: "Course", render: (r) => String(r.course || "—") },
        { key: "email", label: "Email", render: (r) => String(r.email || "—"), minWidth: 160 },
        { key: "mobile", label: "Mobile", render: (r) => String(r.mobile || "—") },
        { key: "location", label: "Location", render: (r) => String(r.location || "—") },
      ];
    }
    if (listKind === "courses") {
      return [
        { key: "name", label: "Course", render: (r) => String(r.name || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    if (listKind === "specializations") {
      return [
        { key: "name", label: "Specialization", render: (r) => String(r.name || "—") },
        { key: "course", label: "Course", render: (r) => String(r.course || "—") },
      ];
    }
    if (listKind === "classrooms") {
      return [{ key: "name", label: "Classroom", render: (r) => String(r.name || "—") }];
    }
    if (listKind === "subjects") {
      return [
        { key: "name", label: "Subject", render: (r) => String(r.name || "—") },
        { key: "type", label: "Type", render: (r) => String(r.type || "—") },
      ];
    }
    return [
      { key: "topic", label: "Topic", render: (r) => String(r.topic || "—"), minWidth: 140 },
      {
        key: "scheduleTime",
        label: "Schedule Time",
        render: (r) => {
          const start = String(r.inTime || "");
          const end = String(r.outTime || "");
          const t1 = start.match(/T(\d{2}:\d{2})/)?.[1] || start.match(/(\d{2}:\d{2})/)?.[1];
          const t2 = end.match(/T(\d{2}:\d{2})/)?.[1] || end.match(/(\d{2}:\d{2})/)?.[1];
          if (!t1 && !t2) return "—";
          if (!t2) return t1 || "—";
          if (!t1) return t2 || "—";
          return `${t1} – ${t2}`;
        },
        minWidth: 120,
      },
      {
        key: "date",
        label: "Date",
        render: (r) => (r.date ? String(r.date).slice(0, 10) : "—"),
      },
      { key: "course", label: "Course", render: (r) => String(r.course || "—") },
      {
        key: "specialization",
        label: "Specialization",
        render: (r) => String(r.specialization || "—"),
      },
      { key: "subject", label: "Subject", render: (r) => String(r.subject || "—") },
      { key: "classroom", label: "Class", render: (r) => String(r.classroom || "—") },
    ];
  }, [listKind]);

  if (!meta) {
    return (
      <Box>
        <PageHeader subtitle="Unknown department list" />
        <Box color="error.main">Unknown department list</Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader subtitle={meta.subtitle} />

      {loading ? (
        <Box minHeight={280} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={rows}
          rowKey={(r) => Number(r.id)}
          searchPlaceholder="Search list…"
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
