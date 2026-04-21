/** Sections 1–10 of the requirements document; section 0 is metadata and not counted. */
const DOCUMENT_SECTION_TOTAL = 10;

/**
 * Match chat + document panel: progress = completed count among sections 1–10, over 10 slots.
 * Missing sections count as incomplete (same as merging API rows with INITIAL_SECTIONS in Chat).
 */
export function calculateDocumentProgress(
  items: { sectionNo: number; isComplete: boolean }[],
): number {
  const byNo = new Map(items.map((s) => [s.sectionNo, s.isComplete]));
  let completed = 0;
  for (let n = 1; n <= DOCUMENT_SECTION_TOTAL; n++) {
    if (byNo.get(n) === true) completed++;
  }
  return Math.round((completed / DOCUMENT_SECTION_TOTAL) * 100);
}
