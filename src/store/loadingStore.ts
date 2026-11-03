import { create } from "zustand";

type LoadingState = {
  pending: number;
  progress: number;
  visible: boolean;
  start: () => void;
  stop: () => void;
};

let tickTimer: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearTick() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function clearHide() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function startTick() {
  clearTick();
  tickTimer = setInterval(() => {
    const { pending, progress } = useLoadingStore.getState();
    if (pending <= 0) {
      clearTick();
      return;
    }
    // Ease toward 90% while requests are in flight (never finish until stop)
    if (progress < 90) {
      const step = progress < 40 ? 8 : progress < 70 ? 4 : 1.5;
      useLoadingStore.setState({ progress: Math.min(90, progress + step) });
    }
  }, 180);
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  pending: 0,
  progress: 0,
  visible: false,
  start: () => {
    clearHide();
    const next = get().pending + 1;
    if (next === 1) {
      set({ pending: 1, progress: 0, visible: true });
      startTick();
      return;
    }
    set({ pending: next, visible: true });
  },
  stop: () => {
    const next = Math.max(0, get().pending - 1);
    if (next > 0) {
      set({ pending: next });
      return;
    }
    clearTick();
    set({ pending: 0, progress: 100, visible: true });
    clearHide();
    hideTimer = setTimeout(() => {
      useLoadingStore.setState({ visible: false, progress: 0 });
      hideTimer = null;
    }, 280);
  },
}));
