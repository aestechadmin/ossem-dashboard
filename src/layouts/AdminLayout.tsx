import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Collapse,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputBase,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Select,
  Toolbar,
  Tooltip,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { fetchBranches } from "@/api/adminPortal";
import { useAuthStore } from "@/store/authStore";
import { toastError } from "@/store/toastStore";
import OssemLogo from "@/components/OssemLogo";

type NavChild = {
  label: string;
  path: string;
  icon: ReactNode;
};

type NavItem = {
  label: string;
  path?: string;
  icon: ReactNode;
  children?: NavChild[];
};

const accountsChildren: NavChild[] = [
  { label: "Bio Metrics", path: "/biometrics", icon: <FingerprintRoundedIcon fontSize="small" /> },
  {
    label: "Fee Category",
    path: "/account-categories",
    icon: <CategoryRoundedIcon fontSize="small" />,
  },
  {
    label: "Bank Account",
    path: "/bank-accounts",
    icon: <AccountBalanceRoundedIcon fontSize="small" />,
  },
];

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <DashboardRoundedIcon fontSize="small" /> },
  { label: "Academics", path: "/departments", icon: <ApartmentRoundedIcon fontSize="small" /> },
  { label: "Admissions", path: "/admissions", icon: <HowToRegRoundedIcon fontSize="small" /> },
  { label: "Students", path: "/students", icon: <SchoolRoundedIcon fontSize="small" /> },
  { label: "Employees", path: "/employees", icon: <BadgeRoundedIcon fontSize="small" /> },
  { label: "Fees", path: "/fees", icon: <PaymentsRoundedIcon fontSize="small" /> },
  { label: "Hostel", path: "/hostel", icon: <HomeWorkRoundedIcon fontSize="small" /> },
  { label: "Attendance", path: "/attendance", icon: <FactCheckRoundedIcon fontSize="small" /> },
  {
    label: "Accounts",
    icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
    children: accountsChildren,
  },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/departments/list": "Department List",
  "/departments/courses": "Courses",
  "/departments/specializations": "Specializations",
  "/departments/classrooms": "Classrooms",
  "/departments/subjects": "Subjects",
  "/departments/schedules": "Class Schedules",
  "/departments": "Academics",
  "/admissions": "Admissions",
  "/students": "Students",
  "/employees": "Employees",
  "/fees": "Fees",
  "/hostel/hostels": "Hostels",
  "/hostel/quarters": "Quarters",
  "/hostel/blocks": "Blocks",
  "/hostel/rooms": "Rooms",
  "/hostel/rooms-vacant": "Vacant Rooms",
  "/hostel/rooms-occupied": "Occupied Rooms",
  "/hostel/rooms-partial": "Partial Rooms",
  "/hostel/rooms-blocked": "Blocked Rooms",
  "/hostel/students": "Hostel Students",
  "/hostel/students-mens": "Mens Students",
  "/hostel/students-women": "Women Students",
  "/hostel": "Hostel",
  "/attendance": "Attendance",
  "/biometrics": "Bio Metrics",
  "/account-categories": "Fee Category",
  "/bank-accounts": "Bank Account",
};

const searchableMenus = [
  ...navItems.flatMap((item) =>
    item.children?.length
      ? item.children.map((child) => ({
          label: child.label,
          path: child.path,
          group: item.label,
        }))
      : item.path
        ? [{ label: item.label, path: item.path, group: "Main" }]
        : []
  ),
  { label: "Department List", path: "/departments/list", group: "Academics" },
  { label: "Courses", path: "/departments/courses", group: "Academics" },
  { label: "Specializations", path: "/departments/specializations", group: "Academics" },
  { label: "Classrooms", path: "/departments/classrooms", group: "Academics" },
  { label: "Subjects", path: "/departments/subjects", group: "Academics" },
  { label: "Class Schedules", path: "/departments/schedules", group: "Academics" },
  { label: "Hostels", path: "/hostel/hostels", group: "Hostel" },
  { label: "Hostel Students", path: "/hostel/students", group: "Hostel" },
  { label: "Quarters", path: "/hostel/quarters", group: "Hostel" },
  { label: "Blocks", path: "/hostel/blocks", group: "Hostel" },
  { label: "Rooms", path: "/hostel/rooms", group: "Hostel" },
];

const accountsChildPaths = accountsChildren.map((c) => c.path);

const COLLAPSED_WIDTH = 72;

export default function AdminLayout() {
  const theme = useTheme();
  const isTv = useMediaQuery("(min-width:1800px)");
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const expandedWidth = isTv ? 300 : 260;

  /** expanded = full labels; collapsed = icons only (still visible) */
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAnchor, setSearchAnchor] = useState<HTMLElement | null>(null);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setExpanded(isDesktop);
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  const user = useAuthStore((s) => s.user);
  const jwt = useAuthStore((s) => s.jwt);
  const adminSessionId = useAuthStore((s) => s.adminSessionId);
  const logout = useAuthStore((s) => s.logout);
  const branches = useAuthStore((s) => s.branches);
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const setBranches = useAuthStore((s) => s.setBranches);
  const setSelectedBranch = useAuthStore((s) => s.setSelectedBranch);
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = user?.email || user?.username || user?.mobileNo || "Admin";
  const userMenuOpen = Boolean(userMenuAnchor);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchMenuAnchor, setBranchMenuAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Wait until persisted auth is ready — otherwise branches call 401s and list stays empty
    if (!jwt || !adminSessionId) return;

    let active = true;
    setBranchesLoading(true);
    fetchBranches()
      .then((items) => {
        if (!active) return;
        if (items.length) {
          setBranches(items);
          const current = useAuthStore.getState().selectedBranchId;
          const stillValid = current != null && items.some((b) => b.id === current);
          // Initial / invalid → first institution in the list
          setSelectedBranch(stillValid ? current! : items[0].id);
        } else if (useAuthStore.getState().branches.length === 0) {
          toastError(null, "No institutions found.");
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (useAuthStore.getState().branches.length === 0) {
          toastError(err, "Could not load institutions.");
        }
      })
      .finally(() => {
        if (active) setBranchesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jwt, adminSessionId, setBranches, setSelectedBranch]);

  const effectiveBranchId = useMemo(() => {
    if (selectedBranchId != null && branches.some((b) => b.id === selectedBranchId)) {
      return selectedBranchId;
    }
    return branches.length > 0 ? branches[0].id : "";
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (branches.length === 0) return;
    if (selectedBranchId == null || !branches.some((b) => b.id === selectedBranchId)) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranchId, setSelectedBranch]);

  function renderInstitutionSelect() {
    const fallbackId = branches.length > 0 ? branches[0].id : null;
    const selectValue =
      effectiveBranchId === "" || effectiveBranchId == null
        ? fallbackId != null
          ? String(fallbackId)
          : ""
        : String(effectiveBranchId);

    return (
      <FormControl
        size="small"
        fullWidth
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            bgcolor: "#F4F7F8",
            fontWeight: 500,
            fontSize: 13,
          },
        }}
      >
        <InputLabel id="sidebar-institution-label">Institution</InputLabel>
        <Select
          labelId="sidebar-institution-label"
          label="Institution"
          value={selectValue}
          disabled={branchesLoading && branches.length === 0}
          onChange={(e) => {
            const id = Number(e.target.value);
            if (Number.isFinite(id) && id > 0) setSelectedBranch(id);
          }}
          startAdornment={
            <InputAdornment position="start">
              <BusinessRoundedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
            </InputAdornment>
          }
          MenuProps={{
            PaperProps: { sx: { maxHeight: 360 } },
          }}
        >
          {branches.length === 0 ? (
            <MenuItem value="" disabled>
              {branchesLoading ? "Loading…" : "No institutions"}
            </MenuItem>
          ) : (
            branches.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>
                {b.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    );
  }

  const pageTitle = useMemo(() => {
    const match = Object.keys(pageTitles)
      .sort((a, b) => b.length - a.length)
      .find((path) =>
        path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
      );
    return match ? pageTitles[match] : "OSSEM";
  }, [location.pathname]);

  const menuSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchableMenus;
    return searchableMenus.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function openMenuSearch(el: HTMLElement) {
    setSearchAnchor(el);
    setSearchOpen(true);
    setSearchQuery("");
    window.setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeMenuSearch() {
    setSearchOpen(false);
    setSearchAnchor(null);
    setSearchQuery("");
  }

  function goToMenuPath(path: string) {
    navigate(path);
    closeMenuSearch();
  }

  const railExpanded = isDesktop ? expanded : true;
  const contentOffset = isDesktop
    ? expanded
      ? expandedWidth
      : COLLAPSED_WIDTH
    : COLLAPSED_WIDTH;

  function openUserMenu(el: HTMLElement) {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setUserMenuAnchor(el);
  }

  function scheduleCloseUserMenu() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setUserMenuAnchor(null);
      closeTimer.current = null;
    }, 180);
  }

  function closeUserMenu() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setUserMenuAnchor(null);
  }

  useEffect(() => {
    const onAccountsChild = accountsChildPaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
    );
    if (onAccountsChild) setAccountsOpen(true);
  }, [location.pathname]);

  function renderNavList(showLabels: boolean, onNav?: () => void) {
    const itemSx = {
      borderRadius: 1,
      mb: 0.5,
      py: 1.05,
      px: showLabels ? 1.5 : 1,
      justifyContent: showLabels ? "flex-start" : "center",
      "&.active": {
        bgcolor: "rgba(11,44,52,0.08)",
        color: "primary.main",
        "& .MuiListItemIcon-root": { color: "primary.main" },
        "& .MuiListItemText-primary": { fontWeight: 700 },
      },
      transition: "background-color 0.2s ease",
    } as const;

    return (
      <List sx={{ flex: 1, px: showLabels ? 0.25 : 0.5 }}>
        {navItems.map((item) => {
          if (item.children?.length) {
            const childActive = item.children.some(
              (c) => location.pathname === c.path || location.pathname.startsWith(`${c.path}/`)
            );
            const parentButton = (
              <ListItemButton
                onClick={() => {
                  if (!showLabels) {
                    setExpanded(true);
                    setAccountsOpen(true);
                    return;
                  }
                  setAccountsOpen((v) => !v);
                }}
                selected={childActive}
                sx={{
                  ...itemSx,
                  ...(childActive
                    ? {
                        bgcolor: "rgba(11,44,52,0.06)",
                        color: "primary.main",
                        "& .MuiListItemIcon-root": { color: "primary.main" },
                      }
                    : {}),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: showLabels ? 36 : 0,
                    color: "text.secondary",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {showLabels ? (
                  <>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    />
                    {accountsOpen ? (
                      <ExpandLessRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    ) : (
                      <ExpandMoreRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    )}
                  </>
                ) : null}
              </ListItemButton>
            );

            return (
              <Box key={item.label}>
                {showLabels ? (
                  parentButton
                ) : (
                  <Tooltip title={item.label} placement="right">
                    {parentButton}
                  </Tooltip>
                )}
                <Collapse in={showLabels && accountsOpen} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1.25 }}>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.path}
                        component={NavLink}
                        to={child.path}
                        onClick={onNav}
                        sx={{
                          ...itemSx,
                          py: 0.85,
                          pl: 1.25,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 32,
                            color: "text.secondary",
                            justifyContent: "center",
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const button = (
            <ListItemButton
              component={NavLink}
              to={item.path || "/"}
              end={item.path === "/"}
              onClick={onNav}
              sx={itemSx}
            >
              <ListItemIcon
                sx={{
                  minWidth: showLabels ? 36 : 0,
                  color: "text.secondary",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {showLabels ? (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
              ) : null}
            </ListItemButton>
          );

          return showLabels ? (
            <Box key={item.path || item.label}>{button}</Box>
          ) : (
            <Tooltip key={item.path || item.label} title={item.label} placement="right">
              {button}
            </Tooltip>
          );
        })}
      </List>
    );
  }

  const desktopDrawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: railExpanded ? { xs: 1.75, xl: 2.25 } : 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: railExpanded ? "space-between" : "center",
          gap: 1,
          mb: 1.5,
        }}
      >
        {railExpanded ? (
          <Box
            sx={{
              flex: 1,
              px: 1.5,
              py: 1.5,
              borderRadius: 1,
              background: "linear-gradient(145deg, #0B2C34 0%, #164854 100%)",
              color: "white",
              minWidth: 0,
            }}
          >
            <OssemLogo maxWidth={160} sx={{ maxWidth: { xs: 140, xl: 170 } }} />
          </Box>
        ) : null}
        <IconButton
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse menu" : "Expand menu"}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "#fff",
            flexShrink: 0,
            "&:hover": { bgcolor: "#F4F7F8", borderColor: "primary.main" },
          }}
        >
          {expanded ? <ChevronLeftRoundedIcon /> : <MenuRoundedIcon />}
        </IconButton>
      </Box>

      {railExpanded ? (
        renderInstitutionSelect()
      ) : (
        <Tooltip title="Institution" placement="right">
          <IconButton
            onClick={(e) => setBranchMenuAnchor(e.currentTarget)}
            aria-label="Select institution"
            sx={{
              mb: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "#F4F7F8",
            }}
          >
            <BusinessRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {railExpanded ? (
        <Typography
          variant="overline"
          sx={{ px: 1.25, mb: 0.75, color: "text.secondary", fontSize: 10 }}
        >
          Menu
        </Typography>
      ) : null}

      {renderNavList(railExpanded)}
    </Box>
  );

  const mobileMiniRail = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 1.25,
        px: 0.75,
        gap: 0.5,
      }}
    >
      <IconButton
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        sx={{
          mb: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "#fff",
        }}
      >
        <MenuRoundedIcon />
      </IconButton>
      {renderNavList(false)}
    </Box>
  );

  const mobileFullDrawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 1.75,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
        }}
      >
        <Box
          sx={{
            flex: 1,
            px: 1.75,
            py: 2,
            borderRadius: 1,
            background: "linear-gradient(145deg, #0B2C34 0%, #164854 100%)",
            color: "white",
            minWidth: 0,
          }}
        >
          <OssemLogo maxWidth={150} />
        </Box>
        <IconButton
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "#fff",
          }}
        >
          <ChevronLeftRoundedIcon />
        </IconButton>
      </Box>
      {renderInstitutionSelect()}
      <Typography
        variant="overline"
        sx={{ px: 1.25, mb: 0.75, color: "text.secondary", fontSize: 10 }}
      >
        Menu
      </Typography>
      {renderNavList(true, () => setMobileOpen(false))}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xs: `calc(100% - ${COLLAPSED_WIDTH}px)`, md: `calc(100% - ${contentOffset}px)` },
          ml: { xs: `${COLLAPSED_WIDTH}px`, md: `${contentOffset}px` },
          bgcolor: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(14px)",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 68, xl: 76 },
            gap: { xs: 1, sm: 1.5 },
            px: { xs: 1.5, sm: 2.5, xl: 3 },
          }}
        >
          {location.pathname !== "/" ? (
            <IconButton
              edge="start"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate("/");
              }}
              aria-label="Go back"
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          ) : null}

          <Typography
            variant="h6"
            fontWeight={600}
            noWrap
            sx={{
              flex: "1 1 auto",
              minWidth: 0,
              fontSize: { xs: 15, sm: 18, xl: 20 },
              ml: location.pathname === "/" ? 0 : 0.25,
              mr: 1,
            }}
          >
            {pageTitle}
          </Typography>

          <Tooltip title="Search menu">
            <IconButton
              aria-label="Search menu"
              onClick={(e) => openMenuSearch(e.currentTarget)}
              sx={{
                border: "1px solid",
                borderColor: searchOpen ? "primary.main" : "divider",
                borderRadius: 1,
                bgcolor: searchOpen ? "rgba(11,44,52,0.04)" : "#F4F7F8",
              }}
            >
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              aria-label="Notifications"
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{
                border: "1px solid",
                borderColor: notifAnchor ? "primary.main" : "divider",
                borderRadius: 1,
                bgcolor: notifAnchor ? "rgba(11,44,52,0.04)" : "#F4F7F8",
              }}
            >
              <Badge color="error" variant="dot" invisible>
                <NotificationsNoneRoundedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Popover
            open={searchOpen}
            anchorEl={searchAnchor}
            onClose={closeMenuSearch}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  width: { xs: 300, sm: 360 },
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 12px 32px rgba(11,44,52,0.12)",
                  overflow: "hidden",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "#F4F7F8",
              }}
            >
              <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              <InputBase
                inputRef={searchInputRef}
                fullWidth
                placeholder="Search menu…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && menuSearchResults[0]) {
                    goToMenuPath(menuSearchResults[0].path);
                  }
                  if (e.key === "Escape") closeMenuSearch();
                }}
                sx={{ fontSize: 14, fontWeight: 500 }}
              />
              {searchQuery ? (
                <IconButton size="small" onClick={() => setSearchQuery("")} aria-label="Clear">
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              ) : null}
            </Box>
            <List dense sx={{ maxHeight: 320, overflow: "auto", py: 0.5 }}>
              {menuSearchResults.length === 0 ? (
                <Box px={2} py={2}>
                  <Typography fontSize={13} color="text.secondary">
                    No menu matches “{searchQuery}”
                  </Typography>
                </Box>
              ) : (
                menuSearchResults.map((item) => (
                  <ListItemButton
                    key={`${item.group}-${item.path}`}
                    onClick={() => goToMenuPath(item.path)}
                    sx={{ borderRadius: 1, mx: 0.75, my: 0.25 }}
                  >
                    <ListItemText
                      primary={item.label}
                      secondary={item.group}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </Popover>

          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  width: 300,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 12px 32px rgba(11,44,52,0.12)",
                },
              },
            }}
          >
            <Box px={2} py={1.5} borderBottom="1px solid" borderColor="divider">
              <Typography fontWeight={700} fontSize={14}>
                Notifications
              </Typography>
            </Box>
            <Box px={2} py={3} textAlign="center">
              <Typography fontSize={13} color="text.secondary">
                No new notifications
              </Typography>
            </Box>
          </Popover>

          <Box
            onMouseEnter={(e) => openUserMenu(e.currentTarget)}
            onMouseLeave={scheduleCloseUserMenu}
          >
            <Button
              onClick={(e) => {
                if (userMenuOpen) closeUserMenu();
                else openUserMenu(e.currentTarget);
              }}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? "true" : undefined}
              sx={{
                ml: 0.5,
                px: { xs: 0.75, sm: 1.25 },
                py: 0.5,
                minWidth: 0,
                borderRadius: 1,
                textTransform: "none",
                color: "text.primary",
                border: "1px solid",
                borderColor: userMenuOpen ? "primary.main" : "divider",
                bgcolor: userMenuOpen ? "rgba(11,44,52,0.04)" : "#F4F7F8",
                "&:hover": { bgcolor: "rgba(11,44,52,0.06)", borderColor: "primary.light" },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.main",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {String(displayName).slice(0, 1).toUpperCase()}
              </Avatar>
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                  ml: 1,
                  textAlign: "left",
                  minWidth: 0,
                  maxWidth: 140,
                }}
              >
                <Typography noWrap fontSize={13} fontWeight={600} lineHeight={1.2}>
                  {displayName}
                </Typography>
                <Typography noWrap fontSize={11} color="text.secondary" lineHeight={1.2}>
                  {user?.type || "admin"}
                </Typography>
              </Box>
              <KeyboardArrowDownRoundedIcon
                sx={{
                  ml: { xs: 0.25, sm: 0.5 },
                  fontSize: 18,
                  color: "text.secondary",
                  transition: "transform 0.2s ease",
                  transform: userMenuOpen ? "rotate(180deg)" : "none",
                }}
              />
            </Button>

            <Menu
              anchorEl={userMenuAnchor}
              open={userMenuOpen}
              onClose={closeUserMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  onMouseEnter: () => {
                    if (closeTimer.current) {
                      window.clearTimeout(closeTimer.current);
                      closeTimer.current = null;
                    }
                  },
                  onMouseLeave: scheduleCloseUserMenu,
                  sx: {
                    mt: 1,
                    minWidth: 220,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 12px 32px rgba(11,44,52,0.12)",
                  },
                },
              }}
              MenuListProps={{ sx: { py: 0.75 } }}
            >
              <Box px={2} py={1.25}>
                <Typography fontWeight={600} fontSize={14} noWrap>
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.type || "admin"}
                </Typography>
              </Box>
              <Divider />
              <MenuItem
                onClick={() => {
                  closeUserMenu();
                  setLogoutOpen(true);
                }}
                sx={{ py: 1.25, mx: 0.75, mt: 0.5, borderRadius: 1, color: "error.main" }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "error.main" }}>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                />
              </MenuItem>
            </Menu>

            <Menu
              anchorEl={branchMenuAnchor}
              open={Boolean(branchMenuAnchor)}
              onClose={() => setBranchMenuAnchor(null)}
              anchorOrigin={{ vertical: "center", horizontal: "right" }}
              transformOrigin={{ vertical: "center", horizontal: "left" }}
            >
              {branches.length === 0 ? (
                <MenuItem disabled>
                  {branchesLoading ? "Loading…" : "No institutions"}
                </MenuItem>
              ) : (
                branches.map((b) => (
                  <MenuItem
                    key={b.id}
                    selected={String(b.id) === String(effectiveBranchId)}
                    onClick={() => {
                      setSelectedBranch(b.id);
                      setBranchMenuAnchor(null);
                    }}
                  >
                    {b.name}
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile: icon rail always visible */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "block", md: "none" },
          width: COLLAPSED_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: COLLAPSED_WIDTH,
            border: "none",
            bgcolor: "rgba(255,255,255,0.96)",
            borderRight: "1px solid",
            borderColor: "divider",
            overflowX: "hidden",
          },
        }}
        open
      >
        {mobileMiniRail}
      </Drawer>

      {/* Mobile: full menu overlay */}
      <Drawer
        variant="temporary"
        open={!isDesktop && mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: expandedWidth,
            border: "none",
            boxShadow: "8px 0 32px rgba(11,44,52,0.12)",
          },
        }}
      >
        {mobileFullDrawer}
      </Drawer>

      {/* Desktop: expand / collapse (icons remain) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: contentOffset,
          flexShrink: 0,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          "& .MuiDrawer-paper": {
            width: contentOffset,
            border: "none",
            bgcolor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            borderRight: "1px solid",
            borderColor: "divider",
            overflowX: "hidden",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open
      >
        {desktopDrawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: `calc(100% - ${COLLAPSED_WIDTH}px)`,
            md: `calc(100% - ${contentOffset}px)`,
          },
          p: {
            xs: 1.75,
            sm: 2.5,
            md: 3,
            lg: 3.5,
            xl: isDesktop ? 4 : 3.5,
          },
          mt: { xs: 8, sm: 8.5, xl: 9.5 },
          maxWidth: { xl: 1600 },
          mx: { xl: "auto" },
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Outlet />
      </Box>

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Logout?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary" }}>
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setLogoutOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setLogoutOpen(false);
              logout();
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
