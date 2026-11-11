import { useAuthStore } from "@/store/authStore";

/** Header institution + course scope used across student life-cycle pages. */
export function useSelectedCourse() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const selectedCourseId = useAuthStore((s) => s.selectedCourseId);
  const courses = useAuthStore((s) => s.courses);
  const courseKey = selectedCourseId != null ? String(selectedCourseId) : "";
  const courseName =
    courses.find((c) => c.id === selectedCourseId)?.name || "Selected course";
  const ready = selectedBranchId != null && selectedCourseId != null;

  return {
    selectedBranchId,
    selectedCourseId,
    courseKey,
    courseName,
    ready,
  };
}
