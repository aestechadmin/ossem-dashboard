import { Box, CircularProgress, Grid } from "@mui/material";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import { useEffect, useState } from "react";
import { fetchBankAccounts, type BankAccountItem } from "@/api/adminPortal";
import DataTableCard, { type Column, type PageSizeOption } from "@/components/DataTableCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";

export default function BankAccountsPage() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const [items, setItems] = useState<BankAccountItem[]>([]);
  const [total, setTotal] = useState(0);
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
        const data = await fetchBankAccounts(selectedBranchId, { page, pageSize });
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setPageCount(data.pageCount || 1);
          if (data.page && data.page !== page) setPage(data.page);
        }
      } catch (err: unknown) {
        if (active) toastError(err, "Could not load bank accounts.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedBranchId, page, pageSize]);

  const columns: Column<BankAccountItem>[] = [
    {
      key: "accountName",
      label: "Account Name",
      render: (r) => r.accountName,
      getValue: (r) => r.accountName,
      minWidth: 140,
    },
    {
      key: "accountNumber",
      label: "Account No",
      render: (r) => r.accountNumber,
      getValue: (r) => r.accountNumber,
    },
    { key: "ifsc", label: "IFSC", render: (r) => r.ifsc, getValue: (r) => r.ifsc },
    {
      key: "bankName",
      label: "Bank",
      render: (r) => r.bankName,
      getValue: (r) => r.bankName,
    },
    {
      key: "branchName",
      label: "Bank Branch",
      render: (r) => r.branchName,
      getValue: (r) => r.branchName,
    },
    {
      key: "categories",
      label: "Categories",
      render: (r) => r.categories,
      getValue: (r) => r.categories,
      minWidth: 140,
    },
    {
      key: "courses",
      label: "Courses",
      render: (r) => r.courses,
      getValue: (r) => r.courses,
      minWidth: 140,
    },
  ];

  return (
    <Box>
      <PageHeader subtitle="Bank accounts for the selected institution." />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Bank Accounts"
            value={total.toLocaleString("en-IN")}
            subtitle="Matching institution"
            accent="#3A6B85"
            icon={<AccountBalanceRoundedIcon />}
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
          searchPlaceholder="Search account, IFSC, bank…"
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
