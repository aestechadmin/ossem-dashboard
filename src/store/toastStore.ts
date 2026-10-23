import { create } from "zustand";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

type ToastSeverity = "error" | "success" | "info" | "warning";

type ToastState = {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  showToast: (message: string, severity?: ToastSeverity) => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  open: false,
  message: "",
  severity: "error",
  showToast: (message, severity = "error") =>
    set({ open: true, message, severity }),
  hideToast: () => set({ open: false }),
}));

/** Prefer: toastError(err, "Could not load …") — never shows raw 500 text. */
export function toastError(errOrMessage: unknown, fallback?: string) {
  const message = getFriendlyErrorMessage(
    typeof errOrMessage === "string" ? { message: errOrMessage } : errOrMessage,
    fallback || "Something went wrong. Please try again in a moment."
  );
  useToastStore.getState().showToast(message, "error");
}
