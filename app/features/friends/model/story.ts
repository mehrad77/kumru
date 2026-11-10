// Where a friend is in the main story line, for the Friends screens (lazy: not in the entry chunk with the profile model).

/** Where a learner is in the main story line, from their furthest story: "On episode 13", "Season 1 finished" at its last. */
export function frStoryLabel(storyAt: string | undefined, seasonLength = 48): string {
  const m = storyAt ? /^s(\d+)e(\d{2})$/.exec(storyAt) : null;
  if (!m) return "";
  const season = +m[1], ep = +m[2];
  return ep >= seasonLength ? `Season ${season} finished` : season > 1 ? `On season ${season}, episode ${ep + 1}` : `On episode ${ep + 1}`;
}
