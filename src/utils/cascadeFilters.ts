import type { FilterOption, PortalFilters } from "@/api/adminPortal";

/** Course → Specialization → Academic Year → Course Year */
export function getCascadedOptions(
  all: PortalFilters,
  selected: {
    course?: string;
    specialization?: string;
    academicYear?: string;
  }
) {
  const courseId = selected.course ? Number(selected.course) : null;
  const specializationId = selected.specialization
    ? Number(selected.specialization)
    : null;
  const academicYearId = selected.academicYear ? Number(selected.academicYear) : null;

  const specializations: FilterOption[] = courseId
    ? all.specializations.filter((item) => item.courseId === courseId)
    : [];

  const academicYears: FilterOption[] = specializationId
    ? all.academicYears.filter((item) => item.specializationId === specializationId)
    : [];

  const courseYears: FilterOption[] = academicYearId
    ? all.courseYears.filter((item) => item.academicYearId === academicYearId)
    : [];

  const classrooms: FilterOption[] = courseId
    ? (all.classrooms || []).filter((item) => !item.courseId || item.courseId === courseId)
    : all.classrooms || [];

  const quotas: FilterOption[] = courseId
    ? (all.quotas || []).filter((item) => !item.courseId || item.courseId === courseId)
    : (() => {
        const seen = new Set<string>();
        return (all.quotas || []).filter((item) => {
          const key = String(item.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      })();

  return {
    courses: all.courses,
    specializations,
    academicYears,
    courseYears,
    classrooms,
    quotas,
  };
}

/** Drop child filters when a parent changes and the child is no longer valid. */
export function pruneStudentFilters(
  all: PortalFilters,
  next: {
    course: string;
    specialization: string;
    academicYear: string;
    courseYear: string;
  }
) {
  const cascaded = getCascadedOptions(all, next);
  let specialization = next.specialization;
  let academicYear = next.academicYear;
  let courseYear = next.courseYear;

  if (
    specialization &&
    !cascaded.specializations.some((s) => String(s.id) === specialization)
  ) {
    specialization = "";
  }
  if (
    academicYear &&
    !getCascadedOptions(all, { ...next, specialization }).academicYears.some(
      (y) => String(y.id) === academicYear
    )
  ) {
    academicYear = "";
  }
  if (
    courseYear &&
    !getCascadedOptions(all, {
      course: next.course,
      specialization,
      academicYear,
    }).courseYears.some((y) => String(y.id) === courseYear)
  ) {
    courseYear = "";
  }

  return {
    course: next.course,
    specialization,
    academicYear,
    courseYear,
  };
}

export function pruneAdmissionFilters(
  all: PortalFilters,
  next: {
    course: string;
    specialization: string;
    academicYear: string;
  }
) {
  const pruned = pruneStudentFilters(all, { ...next, courseYear: "" });
  return {
    course: pruned.course,
    specialization: pruned.specialization,
    academicYear: pruned.academicYear,
  };
}

export function pruneFeeFilters(
  all: PortalFilters,
  next: {
    course: string;
    specialization: string;
    academicYear: string;
    courseYear: string;
    quota: string;
  }
) {
  const pruned = pruneStudentFilters(all, next);
  const cascaded = getCascadedOptions(all, pruned);
  let quota = next.quota;
  if (quota && !cascaded.quotas.some((item) => String(item.id) === quota)) {
    quota = "";
  }
  return { ...pruned, quota };
}

export function pruneAttendanceFilters(
  all: PortalFilters,
  next: {
    course: string;
    specialization: string;
    academicYear: string;
    courseYear: string;
    classroom: string;
    schedule: string;
    present: "" | "true" | "false";
    today: boolean;
  }
) {
  const pruned = pruneStudentFilters(all, {
    course: next.course,
    specialization: next.specialization,
    academicYear: next.academicYear,
    courseYear: next.courseYear,
  });
  const cascaded = getCascadedOptions(all, pruned);
  let classroom = next.classroom;
  if (classroom && !cascaded.classrooms.some((c) => String(c.id) === classroom)) {
    classroom = "";
  }
  const cascadeChanged =
    pruned.course !== next.course ||
    pruned.specialization !== next.specialization ||
    pruned.academicYear !== next.academicYear ||
    pruned.courseYear !== next.courseYear ||
    classroom !== next.classroom;
  return {
    course: pruned.course,
    specialization: pruned.specialization,
    academicYear: pruned.academicYear,
    courseYear: pruned.courseYear,
    classroom,
    schedule: cascadeChanged ? "" : next.schedule,
    present: next.present,
    today: next.today,
  };
}
