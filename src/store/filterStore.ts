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
  schedule: string;
  present: "" | "true" | "false";
  today: boolean;
};

type FilterState = {
  students: StudentFilters;
  admissions: AdmissionFilters;
  fees: FeeFilters;
  attendance: AttendanceFilters;
  setStudentFilters: (patch: Partial<StudentFilters>) => void;
  setAdmissionFilters: (patch: Partial<AdmissionFilters>) => void;
  setFeeFilters: (patch: Partial<FeeFilters>) => void;
  setAttendanceFilters: (patch: Partial<AttendanceFilters>) => void;
  resetStudentFilters: () => void;
  resetAdmissionFilters: () => void;
  resetFeeFilters: () => void;
  resetAttendanceFilters: () => void;
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
  schedule: "",
  present: "",
  today: false,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      students: emptyStudents,
      admissions: emptyAdmissions,
      fees: emptyFees,
      attendance: emptyAttendance,
      setStudentFilters: (patch) =>
        set((s) => ({ students: { ...s.students, ...patch } })),
      setAdmissionFilters: (patch) =>
        set((s) => ({ admissions: { ...s.admissions, ...patch } })),
      setFeeFilters: (patch) => set((s) => ({ fees: { ...s.fees, ...patch } })),
      setAttendanceFilters: (patch) =>
        set((s) => ({ attendance: { ...s.attendance, ...patch } })),
      resetStudentFilters: () => set({ students: emptyStudents }),
      resetAdmissionFilters: () => set({ admissions: emptyAdmissions }),
      resetFeeFilters: () => set({ fees: emptyFees }),
      resetAttendanceFilters: () => set({ attendance: emptyAttendance }),
    }),
    { name: "ossem-admin-filters" }
  )
);
