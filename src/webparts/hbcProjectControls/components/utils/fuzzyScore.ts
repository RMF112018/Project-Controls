/**
 * Lightweight fuzzy string scorer for project search.
 * Returns a score between 0 (no match) and 1 (exact match).
 * Favors: prefix matches, consecutive character runs, shorter targets.
 */
export function fuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0;

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact substring match — highest score
  if (t.includes(q)) {
    // Prefix match is better than mid-string match
    const prefixBonus = t.startsWith(q) ? 0.15 : 0;
    return Math.min(1, 0.8 + prefixBonus + (q.length / t.length) * 0.05);
  }

  // Character-by-character fuzzy match
  let qi = 0;
  let ti = 0;
  let score = 0;
  let consecutiveBonus = 0;
  let lastMatchIndex = -2;

  while (qi < q.length && ti < t.length) {
    if (q[qi] === t[ti]) {
      // Consecutive chars score higher
      if (ti === lastMatchIndex + 1) {
        consecutiveBonus += 0.1;
      }
      // Word-boundary bonus (char after space, dash, or start)
      if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-') {
        score += 0.15;
      }
      score += 0.1;
      lastMatchIndex = ti;
      qi++;
    }
    ti++;
  }

  // All query chars must be found
  if (qi < q.length) return 0;

  // Normalize by query length and add bonuses
  const normalized = (score + consecutiveBonus) / q.length;
  // Penalize long targets (prefer shorter, more relevant matches)
  const lengthPenalty = 1 - Math.min(0.3, (t.length - q.length) / (t.length * 3));

  return Math.min(1, normalized * lengthPenalty);
}

/**
 * Highlight matching characters in target for display.
 * Returns array of { text, highlight } segments.
 */
export function fuzzyHighlight(
  query: string,
  target: string,
): Array<{ text: string; highlight: boolean }> {
  if (!query || !target) return [{ text: target || '', highlight: false }];

  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const segments: Array<{ text: string; highlight: boolean }> = [];

  // For substring matches, highlight the substring range
  const substringIndex = t.indexOf(q);
  if (substringIndex >= 0) {
    if (substringIndex > 0) {
      segments.push({ text: target.slice(0, substringIndex), highlight: false });
    }
    segments.push({ text: target.slice(substringIndex, substringIndex + q.length), highlight: true });
    if (substringIndex + q.length < target.length) {
      segments.push({ text: target.slice(substringIndex + q.length), highlight: false });
    }
    return segments;
  }

  // For fuzzy matches, highlight individual matched characters
  let qi = 0;
  let lastEnd = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (q[qi] === t[ti]) {
      if (ti > lastEnd) {
        segments.push({ text: target.slice(lastEnd, ti), highlight: false });
      }
      segments.push({ text: target[ti], highlight: true });
      lastEnd = ti + 1;
      qi++;
    }
  }

  if (lastEnd < target.length) {
    segments.push({ text: target.slice(lastEnd), highlight: false });
  }

  return segments;
}
