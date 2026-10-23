import { Box, CircularProgress, Grid } from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useEffect, useState } from "react";
import { fetchEmployees, type EmployeeItem } from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

const OTHER_ACCENTS = ["#C45C26", "#6B4E71", "#2F6F6A", "#8B5E3C", "#4A6FA5", "#9C4A4A"];

export default function EmployeesPage() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [items, setItems] = useState<EmployeeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [otherCategories, setOtherCategories] = useState<Array<{ label: string; value: number }>>(
    []
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [selectedBranchId]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchEmployees(selectedBranchId, { page, pageSize });
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setAdminCount(data.adminCount || 0);
          setOtherCategories(data.otherCategories || []);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load employees.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedBranchId, page, pageSize]);

  const columns: Column<EmployeeItem>[] = [
    {
      key: "empId",
      label: "Emp ID",
      render: (r) => r.empId,
      getValue: (r) => r.empId,
    },
    {
      key: "name",
      label: "Name",
      render: (r) => r.name,
      getValue: (r) => r.name,
      minWidth: 160,
    },
    {
      key: "type",
      label: "Category",
      render: (r) => r.type,
      getValue: (r) => r.type,
    },
    {
      key: "designation",
      label: "Designation",
      render: (r) => r.designation,
      getValue: (r) => r.designation,
    },
    {
      key: "mobile",
      label: "Mobile",
      render: (r) => r.mobile,
      getValue: (r) => r.mobile,
    },
    {
      key: "email",
      label: "Email",
      render: (r) => r.email,
      getValue: (r) => r.email,
      minWidth: 160,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => r.status,
      getValue: (r) => r.status,
    },
  ];

  return (
    <Box>
      <PageHeader subtitle="Staff list for the selected institution." />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Total"
            value={total.toLocaleString("en-IN")}
            subtitle="All staff in institution"
            accent="#3A6B85"
            icon={<GroupsRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Admin"
            value={adminCount.toLocaleString("en-IN")}
            subtitle="Admin / superadmin"
            accent="#0B2C34"
            icon={<AdminPanelSettingsRoundedIcon />}
            delay={40}
          />
        </Grid>
      </Grid>

      {otherCategories.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {otherCategories.map((cat, i) => (
            <Grid item xs={12} sm={6} md={3} key={cat.label}>
              <StatCard
                title={cat.label}
                value={cat.value.toLocaleString("en-IN")}
                subtitle="Category count"
                accent={OTHER_ACCENTS[i % OTHER_ACCENTS.length]}
                icon={<CategoryRoundedIcon />}
                delay={100 + i * 40}
              />
            </Grid>
          ))}
        </Grid>
      ) : null}

      {loading ? (
        <Box minHeight={280} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search name, emp id, category, mobile…"
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
