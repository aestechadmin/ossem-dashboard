import { create } from "zustand";
import { persist } from "zustand/middleware";

type StudentFilters = {
  course: string;
  specialization: string;
  academicYear: string;
  courseYear: string;
};

type AdmissionFilters = {
  course: string;
  specialization: string;
  academicYear: string;
};

type FeeFilters = {
  course: string;
  specialization: string;
  academicYear: string;
  courseYear: string;
  quota: string;
};

type AttendanceFilters = {
  course: string;
  specialization: string;
  academicYear: string;
  courseYear: string;
  classroom: string;
  present: "" | "true" | "false";
  today: boolean;
};

/** Shared on Dashboard + Hostel overview + Hostel list pages. */
type HostelFilters = {
  academicYear: string;
  courseYear: string;
  hostel: string;
  room: string;
  category: string;
};

type FilterState = {
  students: StudentFilters;
  admissions: AdmissionFilters;
  fees: FeeFilters;
  attendance: AttendanceFilters;
  hostel: HostelFilters;
  setStudentFilters: (patch: Partial<StudentFilters>) => void;
  setAdmissionFilters: (patch: Partial<AdmissionFilters>) => void;
  setFeeFilters: (patch: Partial<FeeFilters>) => void;
  setAttendanceFilters: (patch: Partial<AttendanceFilters>) => void;
  setHostelFilters: (patch: Partial<HostelFilters>) => void;
  resetStudentFilters: () => void;
  resetAdmissionFilters: () => void;
  resetFeeFilters: () => void;
  resetAttendanceFilters: () => void;
  resetHostelFilters: () => void;
};

const emptyStudents: StudentFilters = {
  course: "",
  specialization: "",
  academicYear: "",
  courseYear: "",
};

const emptyAdmissions: AdmissionFilters = {
  course: "",
  specialization: "",
  academicYear: "",
};

const emptyFees: FeeFilters = {
  course: "",
  specialization: "",
  academicYear: "",
  courseYear: "",
  quota: "",
};

const emptyAttendance: AttendanceFilters = {
  course: "",
  specialization: "",
  academicYear: "",
  courseYear: "",
  classroom: "",
  present: "",
  today: false,
};

const emptyHostel: HostelFilters = {
  academicYear: "",
  courseYear: "",
  hostel: "",
  room: "",
  category: "",
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      students: emptyStudents,
      admissions: emptyAdmissions,
      fees: emptyFees,
      attendance: emptyAttendance,
      hostel: emptyHostel,
      setStudentFilters: (patch) =>
        set((s) => ({ students: { ...s.students, ...patch } })),
      setAdmissionFilters: (patch) =>
        set((s) => ({ admissions: { ...s.admissions, ...patch } })),
      setFeeFilters: (patch) => set((s) => ({ fees: { ...s.fees, ...patch } })),
      setAttendanceFilters: (patch) =>
        set((s) => ({ attendance: { ...s.attendance, ...patch } })),
      setHostelFilters: (patch) => {
        const next = { ...patch };
        if (Object.prototype.hasOwnProperty.call(patch, "hostel") && !patch.hostel) {
          next.room = "";
        }
        if (Object.prototype.hasOwnProperty.call(patch, "academicYear") && !patch.academicYear) {
          next.courseYear = "";
        }
        set((s) => ({ hostel: { ...s.hostel, ...next } }));
      },
      resetStudentFilters: () => set({ students: emptyStudents }),
      resetAdmissionFilters: () => set({ admissions: emptyAdmissions }),
      resetFeeFilters: () => set({ fees: emptyFees }),
      resetAttendanceFilters: () => set({ attendance: emptyAttendance }),
      resetHostelFilters: () => set({ hostel: emptyHostel }),
    }),
    { name: "ossem-admin-filters" }
  )
);
