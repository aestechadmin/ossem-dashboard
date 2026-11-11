import { useEffect, useRef } from "react";
import type { FilterOption } from "@/api/adminPortal";

/** When course changes, pick the first specialization. User can still clear to All. */
export function useAutoSpecialization(
  courseKey: string,
  specializations: FilterOption[],
  current: string,
  onSelect: (id: string) => void
) {
  const lastAutoCourseRef = useRef("");
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!courseKey || !specializations.length) return;

    const valid =
      Boolean(current) &&
      specializations.some((item) => String(item.id) === current);

    if (valid) {
      lastAutoCourseRef.current = courseKey;
      return;
    }

    // Same course, user cleared to All — leave empty so table can show the column
    if (lastAutoCourseRef.current === courseKey && !current) return;

    lastAutoCourseRef.current = courseKey;
    onSelectRef.current(String(specializations[0].id));
  }, [courseKey, specializations, current]);
}
