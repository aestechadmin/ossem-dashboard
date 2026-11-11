/** Prefer MBBS (locked default); else keep preferredId if valid; else first course. */
export function pickDefaultCourse<T extends { id: number; name?: string; label?: string }>(
  courses: T[],
  preferredId?: number | null
): number | null {
  if (!courses.length) return null;
  const mbbs = courses.find((c) => {
    const name = String(c.name || c.label || "")
      .trim()
      .toLowerCase();
    return name === "mbbs" || name.startsWith("mbbs ");
  });
  if (mbbs) return mbbs.id;
  if (preferredId != null && courses.some((c) => c.id === preferredId)) {
    return preferredId;
  }
  return courses[0].id;
}
