/** Prefer GEMS (Great Eastern / Ragolu) as default institution after login. */
export function pickDefaultBranch<T extends { id: number; name?: string }>(
  branches: T[],
  preferredId?: number | null
): number | null {
  if (!branches.length) return null;

  const gems = branches.find((b) => {
    const name = String(b.name || "")
      .trim()
      .toLowerCase();
    return (
      name.includes("great eastern") ||
      name.includes("gems") ||
      /\bragolu\b/.test(name)
    );
  });
  if (gems) return gems.id;

  if (preferredId != null && branches.some((b) => b.id === preferredId)) {
    return preferredId;
  }
  return branches[0].id;
}
