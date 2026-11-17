// Pure functions for selecting a start word and building a word ladder from the
// one-hop word-relationship graph. Ported from gs_functions.py (get_start, make_ladder).

/**
 * Picks a random start word from the graph, restricted to words that have more
 * than `minNeighbors` related words so the ladder builder has room to work with.
 */
export function pickStartWord(graph, { random = Math.random, minNeighbors = 3 } = {}) {
  const candidates = Object.keys(graph).filter(
    (word) => (graph[word] || []).length > minNeighbors,
  );

  if (candidates.length === 0) {
    throw new Error('No candidate start words found in the word graph.');
  }

  const index = Math.floor(random() * candidates.length);
  return candidates[index];
}

/**
 * Builds a word ladder of `targetLength` words by randomly walking the one-hop
 * graph from `startWord`, backtracking (and excluding dead ends) whenever a
 * branch runs out of unused neighbors.
 */
export function buildLadder(
  startWord,
  targetLength,
  graph,
  { random = Math.random, maxAttempts = 1000 } = {},
) {
  if (targetLength < 2) {
    throw new Error('targetLength must be at least 2.');
  }

  const words = [startWord];
  // excluded[n] holds words we already know are dead ends when the ladder is n words long
  const excluded = Array.from({ length: targetLength }, () => []);

  let attempts = 0;
  while (words.length < targetLength) {
    attempts += 1;
    if (attempts >= maxAttempts) {
      throw new Error('Reached maximum attempts without completing the word ladder.');
    }

    const seekWord = words[words.length - 1];
    const neighbors = (graph[seekWord] || []).filter(
      (candidate) => !words.includes(candidate) && !excluded[words.length].includes(candidate),
    );

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(random() * neighbors.length)];
      words.push(next);
    } else {
      words.pop();
      if (words.length === 0) {
        throw new Error('Unable to build a word ladder from the chosen start word.');
      }
      excluded[words.length].push(seekWord);
    }
  }

  return words;
}

/**
 * Convenience helper that picks a start word and builds a full ladder in one call.
 */
export function generateWordLadder(graph, targetLength, options = {}) {
  const startWord = pickStartWord(graph, options);
  return buildLadder(startWord, targetLength, graph, options);
}
