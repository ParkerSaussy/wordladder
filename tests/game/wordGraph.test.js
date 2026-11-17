import { describe, expect, it } from 'vitest';
import { buildLadder, generateWordLadder, pickStartWord } from '../../src/game/wordGraph';

// A small, hand-built graph with known connectivity so the random-walk ladder
// builder's behavior is fully deterministic and verifiable.
const graph = {
  START: ['A', 'B', 'C', 'D'], // 4 neighbors -> eligible start word
  A: ['START', 'MID'],
  B: ['START'],
  C: ['START'],
  D: ['START'],
  MID: ['A', 'END'],
  END: ['MID'],
  LONELY: ['A'], // only 1 neighbor -> not eligible as a start word
};

function sequenceRandom(values) {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i += 1;
    return value;
  };
}

describe('pickStartWord', () => {
  it('only picks words with more than minNeighbors related words', () => {
    // random() = 0 always selects the first candidate in Object.keys order
    const start = pickStartWord(graph, { random: () => 0, minNeighbors: 3 });
    expect(start).toBe('START');
  });

  it('throws when no word has enough neighbors', () => {
    expect(() => pickStartWord(graph, { random: () => 0, minNeighbors: 10 })).toThrow();
  });
});

describe('buildLadder', () => {
  it('builds a ladder of the requested length using only connected words', () => {
    // Force the walk: START -> A -> MID -> END, then it needs one more word but
    // END has no unused neighbors, so it must backtrack to MID -> (no options,
    // A excluded) -> backtrack further... use a graph where a 4-word ladder is
    // reachable directly instead, to keep this test simple and deterministic.
    const random = sequenceRandom([0]); // always take the first available neighbor
    const ladder = buildLadder('START', 4, graph, { random });

    expect(ladder).toHaveLength(4);
    expect(ladder[0]).toBe('START');
    // every consecutive pair must be connected in the graph
    for (let i = 0; i < ladder.length - 1; i += 1) {
      expect(graph[ladder[i]]).toContain(ladder[i + 1]);
    }
  });

  it('backtracks around dead ends instead of failing', () => {
    // D only connects back to START, so picking D first forces a dead end that
    // must be excluded before trying another branch.
    const dSeekingGraph = {
      START: ['D', 'A'],
      D: ['START'],
      A: ['FINISH'],
      FINISH: ['A'],
    };
    const random = sequenceRandom([0]); // always pick the first remaining option
    const ladder = buildLadder('START', 3, dSeekingGraph, { random });

    expect(ladder).toEqual(['START', 'A', 'FINISH']);
  });

  it('throws if it cannot complete the ladder within maxAttempts', () => {
    // START only connects to two dead-end words, so the walk bounces back and
    // forth without ever reaching a 3-word ladder.
    const bouncingGraph = { START: ['X', 'Y'], X: ['START'], Y: ['START'] };
    expect(() =>
      buildLadder('START', 3, bouncingGraph, { random: () => 0, maxAttempts: 4 }),
    ).toThrow(/maximum attempts/i);
  });

  it('throws if every branch from the start word is exhausted', () => {
    const deadEndGraph = { START: ['ONLY'], ONLY: ['START'] };
    expect(() =>
      buildLadder('START', 5, deadEndGraph, { random: () => 0, maxAttempts: 100 }),
    ).toThrow(/unable to build/i);
  });

  it('rejects a target length below 2', () => {
    expect(() => buildLadder('START', 1, graph)).toThrow();
  });
});

describe('generateWordLadder', () => {
  it('picks a start word and builds a full-length ladder in one call', () => {
    const ladder = generateWordLadder(graph, 3, { random: () => 0, minNeighbors: 3 });
    expect(ladder).toHaveLength(3);
    expect(ladder[0]).toBe('START');
  });
});
