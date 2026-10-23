import { Box, CircularProgress } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchHostelBlocks,
  fetchHostelHostels,
  fetchHostelQuarters,
  fetchHostelRooms,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

type ListKind = "hostels" | "quarters" | "blocks" | "rooms";

const titles: Record<ListKind, { subtitle: string; searchLabel: string }> = {
  hostels: {
    subtitle: "Student hostel blocks for the selected branch.",
    searchLabel: "hostels",
  },
  quarters: {
    subtitle: "Residence quarters master list.",
    searchLabel: "quarters",
  },
  blocks: {
    subtitle: "All hostel blocks.",
    searchLabel: "blocks",
  },
  rooms: {
    subtitle: "Hostel rooms with status and capacity.",
    searchLabel: "rooms",
  },
};

export default function HostelListPage() {
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
        if (listKind === "hostels") data = await fetchHostelHostels(selectedBranchId, paging);
        else if (listKind === "quarters")
          data = await fetchHostelQuarters(selectedBranchId, paging);
        else if (listKind === "blocks") data = await fetchHostelBlocks(selectedBranchId, paging);
        else data = await fetchHostelRooms(selectedBranchId, paging);
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
    if (listKind === "hostels") {
      return [
        { key: "name", label: "Name", render: (r) => String(r.name || "—") },
        { key: "code", label: "Code", render: (r) => String(r.code || "—") },
        { key: "gender", label: "Gender", render: (r) => String(r.gender || "—") },
        { key: "location", label: "Location", render: (r) => String(r.location || "—") },
        { key: "typeOfPeople", label: "People", render: (r) => String(r.typeOfPeople || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    if (listKind === "quarters") {
      return [
        { key: "name", label: "Quarter", render: (r) => String(r.name || "—") },
        { key: "value", label: "Value", render: (r) => String(r.value || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    if (listKind === "blocks") {
      return [
        { key: "name", label: "Block", render: (r) => String(r.name || "—") },
        { key: "code", label: "Code", render: (r) => String(r.code || "—") },
        { key: "category", label: "Category", render: (r) => String(r.category || "—") },
        { key: "gender", label: "Gender", render: (r) => String(r.gender || "—") },
        { key: "floors", label: "Floors", render: (r) => String(r.floors || "—") },
        { key: "location", label: "Location", render: (r) => String(r.location || "—") },
        { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
      ];
    }
    return [
      { key: "roomNo", label: "Room", render: (r) => String(r.roomNo || "—") },
      { key: "block", label: "Block", render: (r) => String(r.block || "—") },
      { key: "floorNo", label: "Floor", render: (r) => String(r.floorNo || "—") },
      { key: "capacity", label: "Capacity", render: (r) => String(r.capacity ?? "—") },
      { key: "vacancies", label: "Vacancies", render: (r) => String(r.vacancies ?? "—") },
      { key: "status", label: "Status", render: (r) => String(r.status || "—") },
      { key: "category", label: "Category", render: (r) => String(r.category || "—") },
      { key: "maintenance", label: "Maintenance", render: (r) => String(r.maintenance || "—") },
      { key: "branch", label: "Branch", render: (r) => String(r.branch || "—") },
    ];
  }, [listKind]);

  if (!meta) {
    return (
      <Box>
        <PageHeader subtitle="Unknown hostel list" />
        <Box color="error.main">Unknown hostel list</Box>
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
          searchPlaceholder={`Search ${meta.searchLabel}…`}
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
