import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useMemo, useState, type ReactNode } from "react";

export type PageSizeOption = 50 | 100 | 200;

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  minWidth?: number;
  /** Used for search + sort. Defaults to row[key]. */
  getValue?: (row: T) => string | number | boolean | null | undefined;
  sortable?: boolean;
  searchable?: boolean;
};

export type ServerPagination = {
  page: number;
  pageSize: PageSizeOption;
  total: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
};

type DataTableCardProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyText?: string;
  searchPlaceholder?: string;
  pagination?: ServerPagination;
};

type SortDir = "asc" | "desc";

function cellText<T>(row: T, col: Column<T>): string {
  const raw = col.getValue
    ? col.getValue(row)
    : (row as Record<string, unknown>)[col.key];
  if (raw == null) return "";
  return String(raw);
}

function compareValues(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (a !== "" && b !== "" && !Number.isNaN(na) && !Number.isNaN(nb)) {
    return na - nb;
  }
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

export default function DataTableCard<T>({
  columns,
  rows,
  rowKey,
  emptyText = "No records found",
  searchPlaceholder = "Search…",
  pagination,
}: DataTableCardProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = rows;

    if (q) {
      next = next.filter((row) =>
        columns.some((col) => {
          if (col.searchable === false) return false;
          return cellText(row, col).toLowerCase().includes(q);
        })
      );
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col && col.sortable !== false) {
        next = [...next].sort((ra, rb) => {
          const cmp = compareValues(cellText(ra, col), cellText(rb, col));
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    return next;
  }, [rows, columns, query, sortKey, sortDir]);

  function handleSort(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col || col.sortable === false) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const overallTotal = pagination?.total ?? rows.length;
  const from =
    pagination && overallTotal > 0
      ? (pagination.page - 1) * pagination.pageSize + 1
      : filteredSorted.length > 0
        ? 1
        : 0;
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, overallTotal)
    : filteredSorted.length;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(11,44,52,0.04)",
        animation: "fadeUp 0.45s ease 80ms both",
      }}
    >
      <Box
        px={2}
        py={1.5}
        display="flex"
        alignItems="center"
        gap={1.5}
        flexWrap="wrap"
        borderBottom="1px solid"
        borderColor="divider"
        bgcolor="rgba(255,255,255,0.9)"
      >
        <TextField
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          sx={{
            minWidth: { xs: "100%", sm: 280 },
            flex: { sm: "0 1 360px" },
            "& .MuiOutlinedInput-root": {
              bgcolor: "#F4F7F8",
              borderRadius: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {pagination
            ? `${from.toLocaleString("en-IN")}–${to.toLocaleString("en-IN")} of ${overallTotal.toLocaleString("en-IN")}`
            : `${filteredSorted.length.toLocaleString("en-IN")} of ${rows.length.toLocaleString("en-IN")}${query.trim() ? " match" : " records"}`}
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: { xs: 480, md: 620, xl: 720 } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => {
                const canSort = col.sortable !== false;
                return (
                  <TableCell
                    key={col.key}
                    align={col.align || "left"}
                    sortDirection={sortKey === col.key ? sortDir : false}
                    sx={{
                      fontWeight: 600,
                      bgcolor: "#F3F6F7",
                      color: "text.secondary",
                      fontSize: 12,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      minWidth: col.minWidth,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {canSort ? (
                      <TableSortLabel
                        active={sortKey === col.key}
                        direction={sortKey === col.key ? sortDir : "asc"}
                        onClick={() => handleSort(col.key)}
                        sx={{
                          "& .MuiTableSortLabel-icon": { fontSize: 16 },
                        }}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">{emptyText}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSorted.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  hover
                  sx={{
                    "&:last-child td": { borderBottom: 0 },
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align || "left"}
                      sx={{ fontSize: 13, py: 1.35 }}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        px={2}
        py={1.25}
        borderTop="1px solid"
        borderColor="divider"
        bgcolor="rgba(243,246,247,0.6)"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        flexWrap="wrap"
      >
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {pagination
            ? `Page ${pagination.page} of ${pagination.pageCount} · ${overallTotal.toLocaleString("en-IN")} total`
            : `Showing ${filteredSorted.length.toLocaleString("en-IN")} record${filteredSorted.length === 1 ? "" : "s"}`}
          {sortKey
            ? ` · sorted by ${columns.find((c) => c.key === sortKey)?.label || sortKey} (${sortDir})`
            : ""}
        </Typography>

        {pagination ? (
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Rows</InputLabel>
              <Select
                label="Rows"
                value={pagination.pageSize}
                onChange={(e) =>
                  pagination.onPageSizeChange(Number(e.target.value) as PageSizeOption)
                }
              >
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
                <MenuItem value={200}>200</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ChevronLeftRoundedIcon />}
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              sx={{ borderRadius: 1, textTransform: "none" }}
            >
              Prev
            </Button>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ChevronRightRoundedIcon />}
              disabled={pagination.page >= pagination.pageCount}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              sx={{ borderRadius: 1, textTransform: "none" }}
            >
              Next
            </Button>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
