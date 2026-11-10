// Schematic insulin activity curve. Shows timing only: heights are not comparable.
const mid = ([a, b]) => (a + b) / 2;
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export function activity(t, ins) {
  const onset = mid(ins.onset);
  const end = mid(ins.duration);
  if (t <= onset || t >= end) return 0;
  if (ins.peak) {
    const [ps, pe] = ins.peak;
    if (t < ps) return smooth((t - onset) / (ps - onset));
    if (t <= pe) return 1;
    return 1 - smooth((t - pe) / (end - pe));
  }
  const level = 0.5;
  const riseEnd = Math.min(onset + 3, end * 0.5);
  const fallStart = end * 0.8;
  if (t < riseEnd) return level * smooth((t - onset) / (riseEnd - onset));
  if (t <= fallStart) return level;
  return level * (1 - smooth((t - fallStart) / (end - fallStart)));
}
