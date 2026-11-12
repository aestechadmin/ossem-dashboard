import { create } from "zustand";
import type { HostelOverviewStats, OverviewStats, StudentStats } from "@/api/adminPortal";

type CacheEntry<T> = {
  key: string;
  data: T;
};

type PortalCacheState = {
  hostelOverview: CacheEntry<HostelOverviewStats> | null;
  dashboardOverview: CacheEntry<{
    overview: OverviewStats;
    studentStats: StudentStats;
    hostelStats: HostelOverviewStats;
  }> | null;
  setHostelOverview: (key: string, data: HostelOverviewStats) => void;
  setDashboardOverview: (
    key: string,
    data: {
      overview: OverviewStats;
      studentStats: StudentStats;
      hostelStats: HostelOverviewStats;
    }
  ) => void;
  clear: () => void;
};

export const usePortalCacheStore = create<PortalCacheState>((set) => ({
  hostelOverview: null,
  dashboardOverview: null,
  setHostelOverview: (key, data) => set({ hostelOverview: { key, data } }),
  setDashboardOverview: (key, data) => set({ dashboardOverview: { key, data } }),
  clear: () => set({ hostelOverview: null, dashboardOverview: null }),
}));
