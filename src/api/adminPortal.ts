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
  studentId?: number | null;
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
  reason?: string;
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
  hostels?: Array<{ id: number; label: string }>;
  rooms?: Array<{
    id: number;
    label: string;
    roomNo?: string;
    category?: string | null;
    hostelId?: number | null;
  }>;
  roomCategories?: Array<{ label: string; value: string } | string>;
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
  roomCategory?: string;
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
  id: number | string;
  label: string;
  yearNumber?: number;
  courseId?: number | null;
  courseIds?: number[];
  specializationId?: number | null;
  specializationIds?: number[];
  academicYearId?: number | null;
};

export type PortalFilters = {
  courses: FilterOption[];
  specializations: FilterOption[];
  academicYears: FilterOption[];
  courseYears: FilterOption[];
  classrooms: FilterOption[];
  subjects?: FilterOption[];
  quotas?: FilterOption[];
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

export type FeeKind = "all" | "total" | "online" | "offline" | "advance" | "demand" | "adjust";

export type FeeSummaryBucket = {
  amount: number;
  count: number;
};

export type FeeSummary = {
  total: FeeSummaryBucket;
  online: FeeSummaryBucket;
  offline: FeeSummaryBucket;
  advance: FeeSummaryBucket;
  demand: FeeSummaryBucket;
  adjust: FeeSummaryBucket;
  paidCount?: number;
  unpaidCount?: number;
};

export type FeeItem = {
  id: number;
  studentId?: number | null;
  studentName: string;
  rollNumber: string;
  amount: number;
  pendingAmount: number;
  mode: string;
  status: string;
  type: string;
  academicYear: string;
  courseYear: string;
  date: string | null;
  remarks?: string;
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

export async function fetchOverview(branch?: number | null, course?: number | null) {
  const { data } = await api.get<OverviewStats>("/admin-portal/overview", {
    params: {
      branch: branch || undefined,
      course: course || undefined,
    },
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
  hostelRoom?: string | null;
  hostelBlock?: string | null;
  roomCategory?: string | null;
  hostelAllocated?: boolean;
  feePaid?: boolean | null;
  feeStatus?: "Paid" | "Unpaid" | "No fee";
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

export type StudentSummary = {
  student: StudentItem & { courseId?: number | null };
  fees: {
    summary: FeeSummary;
    totalAmount: number;
    demandAmount: number;
  };
  hostel: {
    allocated: boolean;
    room: string | null;
    block: string | null;
    roomId: number | null;
    blockId: number | null;
  };
  attendance: {
    presentMarks: number;
    absentMarks: number;
    totalMarks: number;
  };
};

export async function fetchStudentSummary(studentId: number | string) {
  const { data } = await api.get<StudentSummary>(
    `/admin-portal/students/${studentId}/summary`
  );
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
  totalAll?: number;
  category?: string;
  otherCategories: Array<{ label: string; value: number; type: string }>;
};

export async function fetchEmployees(
  branch?: number | null,
  paging?: PaginatedParams & { category?: string }
) {
  const { data } = await api.get<EmployeesResult>("/admin-portal/employees", {
    params: {
      branch: branch || undefined,
      category: paging?.category || undefined,
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
    branch?: number | null;
    today?: boolean;
    kind?: FeeKind;
    course?: string;
    specialization?: string;
    academicYear?: string;
    courseYear?: string;
    quota?: string;
    student?: string;
  } & PaginatedParams
) {
  const { data } = await api.get<
    PaginatedResult<FeeItem> & {
      kind: FeeKind;
      today: boolean;
      summary: FeeSummary;
      totalAmount: number;
      pendingAmount: number;
    }
  >("/admin-portal/fees", {
    params: {
      branch: params.branch || undefined,
      today: params.today ? "true" : undefined,
      kind: params.kind || "total",
      course: params.student ? undefined : params.course || undefined,
      specialization: params.student ? undefined : params.specialization || undefined,
      academicYear: params.student ? undefined : params.academicYear || undefined,
      courseYear: params.student ? undefined : params.courseYear || undefined,
      quota: params.student ? undefined : params.quota || undefined,
      student: params.student || undefined,
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

export async function fetchHostelOverview(
  branch?: number | null,
  filters?: {
    course?: string;
    specialization?: string;
    academicYear?: string;
    courseYear?: string;
    hostel?: string;
    room?: string;
    category?: string;
  }
) {
  const { data } = await api.get<HostelOverviewStats>("/admin-portal/hostel/overview", {
    params: {
      branch: branch || undefined,
      course: filters?.course || undefined,
      specialization: filters?.specialization || undefined,
      academicYear: filters?.academicYear || undefined,
      courseYear: filters?.courseYear || undefined,
      hostel: filters?.hostel || undefined,
      room: filters?.room || undefined,
      category: filters?.category || undefined,
    },
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

export type HostelListFilters = {
  course?: string;
  specialization?: string;
  academicYear?: string;
  courseYear?: string;
  hostel?: string;
  room?: string;
  category?: string;
  student?: string;
};

export async function fetchHostelRooms(
  branch?: number | null,
  paging?: PaginatedParams,
  status?: HostelRoomStatusFilter,
  filters?: HostelListFilters
) {
  const { data } = await api.get<
    PaginatedResult<Record<string, string | number>> & {
      hostels?: Array<{ id: number; label: string }>;
    }
  >("/admin-portal/hostel/rooms", {
    params: {
      branch: branch || undefined,
      page: paging?.page || 1,
      pageSize: paging?.pageSize || 50,
      status: status && status !== "all" ? status : undefined,
      hostel: filters?.hostel || undefined,
      room: filters?.room || undefined,
    },
  });
  return data;
}

export async function fetchHostelStudents(
  branch?: number | null,
  paging?: PaginatedParams,
  gender?: "all" | "mens" | "women",
  filters?: HostelListFilters
) {
  const { data } = await api.get<PaginatedResult<HostelStudentItem>>(
    "/admin-portal/hostel/students",
    {
      params: {
        branch: branch || undefined,
        page: paging?.page || 1,
        pageSize: paging?.pageSize || 50,
        gender: gender && gender !== "all" ? gender : undefined,
        course: filters?.student ? undefined : filters?.course || undefined,
        specialization: filters?.student ? undefined : filters?.specialization || undefined,
        academicYear: filters?.student ? undefined : filters?.academicYear || undefined,
        courseYear: filters?.student ? undefined : filters?.courseYear || undefined,
        hostel: filters?.hostel || undefined,
        room: filters?.room || undefined,
        category: filters?.category || undefined,
        student: filters?.student || undefined,
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
    student?: string;
    present?: string;
    today?: boolean;
  } & PaginatedParams
) {
  const { data } = await api.get<
    PaginatedResult<AttendanceItem> & {
      present: number;
      absent: number;
      presentStudents?: number;
      absentStudents?: number;
      presentRecords?: number;
      absentRecords?: number;
      presentRate?: number;
      totalRecords?: number;
      listTotal?: number;
    }
  >("/admin-portal/attendances", {
    params: {
      branch: params.branch || undefined,
      course: params.student ? undefined : params.course || undefined,
      specialization: params.student ? undefined : params.specialization || undefined,
      academicYear: params.student ? undefined : params.academicYear || undefined,
      courseYear: params.student ? undefined : params.courseYear || undefined,
      classroom: params.student ? undefined : params.classroom || undefined,
      schedule: params.schedule || undefined,
      student: params.student || undefined,
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
