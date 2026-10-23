import { Alert, Snackbar } from "@mui/material";
import { useToastStore } from "@/store/toastStore";

export default function ToastHost() {
  const open = useToastStore((s) => s.open);
  const message = useToastStore((s) => s.message);
  const severity = useToastStore((s) => s.severity);
  const hideToast = useToastStore((s) => s.hideToast);

  return (
    <Snackbar
      open={open}
      autoHideDuration={4500}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        hideToast();
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={hideToast}
        severity={severity}
        variant="filled"
        sx={{ width: "100%", borderRadius: 1, fontWeight: 500 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
