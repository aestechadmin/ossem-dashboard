import api from "./client";

export type OverviewStats = {
  totalStudents: number;
  totalAdmissions: number;
  totalEmployees: number;
  totalHostels: number;
  totalAttendances: number;
};

export type AttendanceItem = {
  id: number;
  studentName: string;
  rollNumber: string;
  present: boolean;
  date: string | null;
  intime: string | null;
  topic: string;
  scheduleDate: string | null;
  scheduleInTime: string | null;
  scheduleOutTime: string | null;
  course: string;
  specialization: string;
  subject: string;
  classroom: string;
  scheduleId: number | null;
};

export type HostelOverviewStats = {
  totalHostels: number;
  totalQuarters: number;
  totalBlocks: number;
  totalRooms: number;
  vacantRooms: number;
  occupiedRooms: number;
  partialOccupiedRooms: number;
  blockedRooms: number;
  totalHostelStudents: number;
  mensHostelStudents: number;
  womenHostelStudents: number;
};

export type HostelStudentItem = {
  id: number;
  rollNumber: string;
  name: string;
  mobile: string;
  gender: string;
  course: string;
  specialization: string;
  courseYear: string;
  room: string;
  block: string;
};

export type DepartmentStats = {
  totalCourses: number;
  totalSpecializations: number;
  totalClassrooms: number;
  totalSubjects: number;
  totalDepartments: number;
};

export type FilterOption = {
  id: number;
  label: string;
  yearNumber?: number;
  courseId?: number | null;
  specializationId?: number | null;
  academicYearId?: number | null;
};

export type PortalFilters = {
  courses: FilterOption[];
  specializations: FilterOption[];
  academicYears: FilterOption[];
  courseYears: FilterOption[];
  classrooms: FilterOption[];
};

export type PieSlice = {
  label: string;
  value: number;
};

export type StudentStats = {
  totalStudents: number;
  totalAdmissions: number;
  boysCount: number;
  girlsCount: number;
  byCourse: PieSlice[];
  bySpecialization: PieSlice[];
  byCourseYear: PieSlice[];
  byAcademicYear: PieSlice[];
};

export type StudentStatsParams = {
  course?: string;
  specialization?: string;
  academicYear?: string;
  courseYear?: string;
  year?: string;
  branch?: number | null;
};

export type AdmissionItem = {
  id: number;
  name: string;
  mobile: string;
  email: string;
  dateOfAdmission: string | null;
  gender: string;
  feePaid?: boolean;
  course: string;
  specialization: string;
  academicYear: string;
  branch: string;
};

export type FeeItem = {
  id: number;
  studentName: string;
  rollNumber: string;
  totalAmount: number;
  pendingAmount: number;
  feePaid: boolean;
  dueDate: string | null;
  type: string;
  academicYear: string;
  courseYear: string;
};

export type PageSizeOption = 50 | 100 | 200;

export type PaginatedParams = {
  page?: number;
  pageSize?: PageSizeOption;
};

export type PaginatedResult<T> = {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  items: T[];
};

export type BranchItem = {
  id: number;
  name: string;
  branchType?: string;
};

export async function fetchBranches() {
  const { data } = await api.get<
    { items?: BranchItem[] } | BranchItem[] | { data?: { items?: BranchItem[] } | BranchItem[] }
  >("/admin-portal/branches");

  let raw: BranchItem[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else if (data && typeof data === "object" && Array.isArray((data as { items?: BranchItem[] }).items)) {
    raw = (data as { items: BranchItem[] }).items;
  } else if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    raw = (data as { data: BranchItem[] }).data;
  } else if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    (data as { data?: { items?: BranchItem[] } }).data &&
    Array.isArray((data as { data: { items: BranchItem[] } }).data.items)
  ) {
    raw = (data as { data: { items: BranchItem[] } }).data.items;
  }

  return raw
    .map((b) => ({
      id: Number(b.id),
      name: String(b.name || `Branch ${b.id}`),
      branchType: b.branchType,
    }))
    .filter((b) => Number.isFinite(b.id) && b.id > 0);
}

export async function fetchOverview(branch?: number | null) {
  const { data } = await api.get<OverviewStats>("/admin-portal/overview", {
    params: { branch: branch || undefined },
  });
  return data;
}

export async function fetchDepartments(branch?: number | null) {
  const { data } = await api.get<DepartmentStats>("/admin-portal/departments", {
    params: { branch: branch || undefined },
  });
  return data;
}

export async function fetchFilters(branch?: number | null) {
  const { data } = await api.get<PortalFilters>("/admin-portal/filters", {
    params: { branch: branch || undefined },
  });
  return data;
}

export async function fetchStudentStats(params: StudentStatsParams) {
  const { data } = await api.get<StudentStats>("/admin-portal/students/stats", {
    params: {
      course: params.course || undefined,
      specialization: params.specialization || undefined,
      academicYear: params.academicYear || undefined,
      courseYear: params.courseYear || undefined,
      year: params.year || undefined,
      branch: params.branch || undefined,
    },
  });
  return data;
}

export type StudentItem = {
  id: number;
  rollNumber: string;
  name: string;
  mobile: string;
  gender: string;
  dateOfAdmission: string | null;
  course: string;
  specialization: string;
  academicYear: string;
  courseYear: string;
};

export async function fetchStudents(
  params: StudentStatsParams & PaginatedParams
) {
  const { data } = await api.get<PaginatedResult<StudentItem>>("/admin-portal/students", {
    params: {
      course: params.course || undefined,
      specialization: params.specialization || undefined,
      academicYear: params.academicYear || undefined,
      courseYear: params.courseYear || undefined,
      year: params.year || undefined,
      branch: params.branch || undefined,
      page: params.page || 1,
      pageSize: params.pageSize || 50,
    },
  });
  return data;
}

export type EmployeeItem = {
  id: number;
  empId: string;
  name: string;
  designation: string;
  mobile: string;
  email: string;
  type: string;
  status: string;
  branches: string;
};

export type EmployeesResult = PaginatedResult<EmployeeItem> & {
  adminCount: number;
  employeeCount: number;
  otherCategories: Array<{ label: string; value: number }>;
};

export async function fetchEmployees(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<EmployeesResult>("/admin-portal/employees", {
    params: {
      branch: branch || undefined,
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
    },
  });
  return data;
}

export async function fetchAdmissions(
  params: {
    branch?: number | null;
    course?: string;
    specialization?: string;
    academicYear?: string;
  } & PaginatedParams
) {
  const { data } = await api.get<
    PaginatedResult<AdmissionItem> & {
      todayAdmissions: number;
      feePaid: number;
      feePending: number;
    }
  >("/admin-portal/admissions", {
    params: {
      branch: params.branch || undefined,
      course: params.course || undefined,
      specialization: params.specialization || undefined,
      academicYear: params.academicYear || undefined,
      page: params.page || 1,
      pageSize: params.pageSize || 50,
    },
  });
  return data;
}

export async function fetchFees(
  params: {
    paid?: string;
    course?: string;
    specialization?: string;
    academicYear?: string;
    branch?: number | null;
    today?: boolean;
  } & PaginatedParams
) {
  const { data } = await api.get<
    PaginatedResult<FeeItem> & {
      totalAmount: number;
      pendingAmount: number;
      todayTotal?: number;
      todayAmount?: number;
    }
  >("/admin-portal/fees", {
    params: {
      paid: params.paid || undefined,
      course: params.course || undefined,
      specialization: params.specialization || undefined,
      academicYear: params.academicYear || undefined,
      branch: params.branch || undefined,
      today: params.today ? "true" : undefined,
      page: params.page || 1,
      pageSize: params.pageSize || 50,
    },
  });
  return data;
}

export async function fetchCourses(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<
    PaginatedResult<{ id: number; name: string; branch: string }>
  >("/admin-portal/courses", {
    params: {
      branch: branch || undefined,
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
    },
  });
  return data;
}

export async function fetchSpecializations(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<
    PaginatedResult<{ id: number; name: string; course: string }>
  >("/admin-portal/specializations", {
    params: {
      branch: branch || undefined,
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
    },
  });
  return data;
}

export async function fetchClassrooms(paging?: PaginatedParams) {
  const { data } = await api.get<PaginatedResult<{ id: number; name: string }>>(
    "/admin-portal/classrooms",
    {
      params: {
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
      },
    }
  );
  return data;
}

export async function fetchSubjects(paging?: PaginatedParams) {
  const { data } = await api.get<
    PaginatedResult<{ id: number; name: string; type: string }>
  >("/admin-portal/subjects", {
    params: {
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
    },
  });
  return data;
}

export async function fetchDepartmentList(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<
    PaginatedResult<{
      id: number;
      name: string;
      course: string;
      email: string;
      mobile: string;
      location: string;
    }>
  >("/admin-portal/departments", {
    params: {
      branch: branch || undefined,
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
    },
  });
  return data;
}

export async function fetchSchedules(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<
    PaginatedResult<{
      id: number;
      topic: string;
      date: string | null;
      inTime: string | null;
      outTime: string | null;
      course: string;
      specialization: string;
      subject: string;
      classroom: string;
      branch: string;
    }>
  >("/admin-portal/schedules", {
    params: {
      branch: branch || undefined,
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
    },
  });
  return data;
}

export type BiometricDeviceItem = {
  id: number;
  name: string;
  deviceNumber: string;
  punchState: string;
  details: string;
  enabled: string;
  branch: string;
  department: string;
  courses: string;
};

export async function fetchBiometricDevices(params: {
  branch?: number | null;
  course?: string;
  page?: number;
  pageSize?: PageSizeOption;
}) {
  const { data } = await api.get<PaginatedResult<BiometricDeviceItem>>(
    "/admin-portal/biometric-devices",
    {
      params: {
        branch: params.branch || undefined,
        course: params.course || undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 50,
      },
    }
  );
  return data;
}

export type AccountCategoryItem = {
  id: number;
  name: string;
  code: string;
  description: string;
  feeUnitName: string;
  bankAccounts: string;
};

export async function fetchAccountCategories(paging?: PaginatedParams) {
  const { data } = await api.get<PaginatedResult<AccountCategoryItem>>(
    "/admin-portal/account-categories",
    {
      params: {
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
      },
    }
  );
  return data;
}

export type BankAccountItem = {
  id: number;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branchName: string;
  branches: string;
  categories: string;
  courses: string;
};

export async function fetchBankAccounts(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<PaginatedResult<BankAccountItem>>("/admin-portal/bank-accounts", {
    params: {
      branch: branch || undefined,
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
    },
  });
  return data;
}

export async function fetchHostelOverview(branch?: number | null) {
  const { data } = await api.get<HostelOverviewStats>("/admin-portal/hostel/overview", {
    params: { branch: branch || undefined },
  });
  return data;
}

export async function fetchHostelHostels(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<PaginatedResult<Record<string, string | number>>>(
    "/admin-portal/hostel/hostels",
    {
      params: {
        branch: branch || undefined,
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
      },
    }
  );
  return data;
}

export async function fetchHostelQuarters(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<PaginatedResult<Record<string, string | number>>>(
    "/admin-portal/hostel/quarters",
    {
      params: {
        branch: branch || undefined,
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
      },
    }
  );
  return data;
}

export async function fetchHostelBlocks(branch?: number | null, paging?: PaginatedParams) {
  const { data } = await api.get<PaginatedResult<Record<string, string | number>>>(
    "/admin-portal/hostel/blocks",
    {
      params: {
        branch: branch || undefined,
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
      },
    }
  );
  return data;
}

export type HostelRoomStatusFilter =
  | "all"
  | "AVAILABLE"
  | "FULL_OCCUPIED"
  | "PARTIAL_OCCUPIED"
  | "NOT_AVAILABLE";

export async function fetchHostelRooms(
  branch?: number | null,
  paging?: PaginatedParams,
  status?: HostelRoomStatusFilter
) {
  const { data } = await api.get<PaginatedResult<Record<string, string | number>>>(
    "/admin-portal/hostel/rooms",
    {
      params: {
        branch: branch || undefined,
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
        status: status && status !== "all" ? status : undefined,
      },
    }
  );
  return data;
}

export async function fetchHostelStudents(
  branch?: number | null,
  paging?: PaginatedParams,
  gender?: "all" | "mens" | "women"
) {
  const { data } = await api.get<PaginatedResult<HostelStudentItem>>(
    "/admin-portal/hostel/students",
    {
      params: {
        branch: branch || undefined,
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
        gender: gender && gender !== "all" ? gender : undefined,
      },
    }
  );
  return data;
}

export async function fetchAttendances(
  params: {
    branch?: number | null;
    course?: string;
    specialization?: string;
    academicYear?: string;
    courseYear?: string;
    classroom?: string;
    schedule?: string;
    present?: string;
    today?: boolean;
  } & PaginatedParams
) {
  const { data } = await api.get<
    PaginatedResult<AttendanceItem> & {
      present: number;
      absent: number;
      listTotal?: number;
    }
  >("/admin-portal/attendances", {
    params: {
      branch: params.branch || undefined,
      course: params.course || undefined,
      specialization: params.specialization || undefined,
      academicYear: params.academicYear || undefined,
      courseYear: params.courseYear || undefined,
      classroom: params.classroom || undefined,
      schedule: params.schedule || undefined,
      present: params.present || undefined,
      today: params.today ? "true" : undefined,
      page: params.page || 1,
      pageSize: params.pageSize || 50,
    },
  });
  return data;
}

export async function fetchAttendanceSchedules(params: {
  branch?: number | null;
  course?: string;
  specialization?: string;
  academicYear?: string;
  courseYear?: string;
  classroom?: string;
  today?: boolean;
}) {
  const { data } = await api.get<{
    total: number;
    items: Array<{
      id: number;
      label: string;
      topic: string;
      date: string | null;
      course: string;
      specialization: string;
      subject: string;
      classroom?: string;
      courseYear?: string;
    }>;
  }>("/admin-portal/attendance-schedules", {
    params: {
      branch: params.branch || undefined,
      course: params.course || undefined,
      specialization: params.specialization || undefined,
      academicYear: params.academicYear || undefined,
      courseYear: params.courseYear || undefined,
      classroom: params.classroom || undefined,
      today: params.today ? "true" : undefined,
    },
  });
  return data;
}
