import { Box, CircularProgress, Grid } from "@mui/material";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import { useEffect, useState } from "react";
import { fetchAccountCategories, type AccountCategoryItem } from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { toastError } from "@/store/toastStore";

export default function AccountCategoriesPage() {
  const [items, setItems] = useState<AccountCategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(50);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchAccountCategories({ page, pageSize });
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load fee categories.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [page, pageSize]);

  const columns: Column<AccountCategoryItem>[] = [
    { key: "name", label: "Name", render: (r) => r.name, getValue: (r) => r.name, minWidth: 140 },
    { key: "code", label: "Code", render: (r) => r.code, getValue: (r) => r.code },
    {
      key: "feeUnitName",
      label: "Fee Unit",
      render: (r) => r.feeUnitName,
      getValue: (r) => r.feeUnitName,
    },
    {
      key: "description",
      label: "Description",
      render: (r) => r.description,
      getValue: (r) => r.description,
      minWidth: 160,
    },
    {
      key: "bankAccounts",
      label: "Bank Accounts",
      render: (r) => r.bankAccounts,
      getValue: (r) => r.bankAccounts,
      minWidth: 160,
    },
  ];

  return (
    <Box>
      <PageHeader subtitle="Fee categories for settlement mapping." />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Fee Categories"
            value={total.toLocaleString("en-IN")}
            subtitle="Fee categories"
            accent="#1A7A6D"
            icon={<CategoryRoundedIcon />}
          />
        </Grid>
      </Grid>

      {loading ? (
        <Box minHeight={240} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <DataTableCard
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          searchPlaceholder="Search name, code, fee unit…"
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
