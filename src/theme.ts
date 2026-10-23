import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#0B2C34",
      light: "#1A4A55",
      dark: "#061A1F",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#C45C3A",
      light: "#D47A5C",
      dark: "#9A4328",
    },
    background: {
      default: "#EEF2F4",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F1C20",
      secondary: "#5A6A72",
    },
    success: { main: "#1A7A6D" },
    warning: { main: "#C4A035" },
    error: { main: "#B84336" },
    info: { main: "#3A6B85" },
    divider: "rgba(11, 44, 52, 0.1)",
  },
  typography: {
    fontFamily: '"Josefin Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 600, letterSpacing: "-0.01em" },
    h2: { fontWeight: 600, letterSpacing: "-0.01em" },
    h3: { fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.02em" },
    overline: { fontWeight: 600, letterSpacing: "0.12em", fontSize: "0.7rem" },
    body1: { fontWeight: 400, letterSpacing: "0.01em" },
    body2: { fontWeight: 400, letterSpacing: "0.01em" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#EEF2F4",
          minHeight: "100vh",
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 100% -10%, rgba(26,122,109,0.07), transparent), radial-gradient(ellipse 60% 40% at -5% 100%, rgba(196,92,58,0.05), transparent)",
        },
        "#root": { minHeight: "100vh" },
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes softPulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.72 },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

export default theme;
