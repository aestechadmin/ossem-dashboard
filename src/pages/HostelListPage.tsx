import { Box, CircularProgress } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchHostelBlocks,
  fetchHostelHostels,
  fetchHostelQuarters,
  fetchHostelRooms,
  fetchHostelStudents,
  type HostelRoomStatusFilter,
} from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

type ListKind =
  | "hostels"
  | "quarters"
  | "blocks"
  | "rooms"
  | "rooms-vacant"
  | "rooms-occupied"
  | "rooms-partial"
  | "rooms-blocked"
  | "students"
  | "students-mens"
  | "students-women";
type StudentGenderFilter = "all" | "mens" | "women";

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
  "rooms-vacant": {
    subtitle: "Vacant (Available) student hostel rooms only.",
    searchLabel: "vacant rooms",
  },
  "rooms-occupied": {
    subtitle: "Fully occupied student hostel rooms only.",
    searchLabel: "occupied rooms",
  },
  "rooms-partial": {
    subtitle: "Partially occupied student hostel rooms only.",
    searchLabel: "partial rooms",
  },
  "rooms-blocked": {
    subtitle: "Blocked / repair (not available) student hostel rooms only.",
    searchLabel: "blocked rooms",
  },
  students: {
    subtitle: "All students allocated to student hostel rooms.",
    searchLabel: "students",
  },
  "students-mens": {
    subtitle: "Mens (male) students in student hostels.",
    searchLabel: "mens students",
  },
  "students-women": {
    subtitle: "Women (female) students in student hostels.",
    searchLabel: "women students",
  },
};

function genderFromKind(kind: ListKind): StudentGenderFilter {
  if (kind === "students-mens") return "mens";
  if (kind === "students-women") return "women";
  return "all";
}

function roomStatusFromKind(kind: ListKind): HostelRoomStatusFilter {
  if (kind === "rooms-vacant") return "AVAILABLE";
  if (kind === "rooms-occupied") return "FULL_OCCUPIED";
  if (kind === "rooms-partial") return "PARTIAL_OCCUPIED";
  if (kind === "rooms-blocked") return "NOT_AVAILABLE";
  return "all";
}

function isStudentsKind(kind: ListKind) {
  return kind === "students" || kind === "students-mens" || kind === "students-women";
}

function isRoomsKind(kind: ListKind) {
  return (
    kind === "rooms" ||
    kind === "rooms-vacant" ||
    kind === "rooms-occupied" ||
    kind === "rooms-partial" ||
    kind === "rooms-blocked"
  );
}

export default function HostelListPage() {
  const { kind } = useParams<{ kind: string }>();
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);

  const listKind = (kind || "") as ListKind;
  const genderFilter = genderFromKind(listKind);
  const roomStatusFilter = roomStatusFromKind(listKind);
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
        else if (isStudentsKind(listKind))
          data = await fetchHostelStudents(selectedBranchId, paging, genderFilter);
        else if (isRoomsKind(listKind))
          data = await fetchHostelRooms(selectedBranchId, paging, roomStatusFilter);
        else data = await fetchHostelRooms(selectedBranchId, paging);
        if (active) {
          setRows(data.items as Record<string, unknown>[]);
          setTotal(data.total);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: unknown) {
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
  }, [listKind, meta, selectedBranchId, page, pageSize, genderFilter, roomStatusFilter]);

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
    if (isStudentsKind(listKind)) {
      return [
        { key: "rollNumber", label: "Roll No", render: (r) => String(r.rollNumber || "—") },
        { key: "name", label: "Name", render: (r) => String(r.name || "—") },
        { key: "gender", label: "Gender", render: (r) => String(r.gender || "—") },
        { key: "mobile", label: "Mobile", render: (r) => String(r.mobile || "—") },
        { key: "course", label: "Course", render: (r) => String(r.course || "—") },
        {
          key: "specialization",
          label: "Specialization",
          render: (r) => String(r.specialization || "—"),
        },
        { key: "courseYear", label: "Year", render: (r) => String(r.courseYear || "—") },
        { key: "block", label: "Block", render: (r) => String(r.block || "—") },
        { key: "room", label: "Room", render: (r) => String(r.room || "—") },
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
