import { describe, expect, it } from 'vitest';
import {
  CELL_STATUS,
  ROW_STATUS,
  activateNextRow,
  applyHint,
  createInitialRows,
  evaluateGuess,
  getActiveRowIndices,
  revealAll,
} from '../../src/game/ladder';
import { config } from '../../src/game/config';

const wordLadder = ['START', 'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FINISH'];

describe('createInitialRows', () => {
  const rows = createInitialRows(wordLadder, config);

  it('marks the first and last rows known and fully revealed', () => {
    expect(rows[0].status).toBe(ROW_STATUS.KNOWN);
    expect(rows[0].prefix).toBe(config.startPrefix);
    expect(rows[0].letters).toEqual(['S', 'T', 'A', 'R', 'T']);
    expect(rows[0].cellStatus.every((s) => s === CELL_STATUS.LOCKED)).toBe(true);

    const last = rows[rows.length - 1];
    expect(last.status).toBe(ROW_STATUS.KNOWN);
    expect(last.prefix).toBe(config.endPrefix);
  });

  it('marks the second and second-to-last rows active with blank cells', () => {
    expect(rows[1].status).toBe(ROW_STATUS.ACTIVE);
    expect(rows[1].letters).toEqual(['', '', '', '', '']);
    expect(rows[rows.length - 2].status).toBe(ROW_STATUS.ACTIVE);
  });

  it('marks everything in between as unknown', () => {
    for (let i = 2; i < rows.length - 2; i += 1) {
      expect(rows[i].status).toBe(ROW_STATUS.UNKNOWN);
    }
  });
});

describe('evaluateGuess', () => {
  const row = {
    word: 'BRAVO',
    letters: ['', '', '', '', ''],
    cellStatus: Array(5).fill(CELL_STATUS.EMPTY),
    notIn: [],
  };

  it('locks exact-position matches as green and flags an incorrect guess', () => {
    const result = evaluateGuess(row, 'BROIL');
    expect(result.isCorrect).toBe(false);
    // B-R-A-V-O vs B-R-O-I-L: positions 0,1 exact
    expect(result.cellStatus[0]).toBe(CELL_STATUS.LOCKED);
    expect(result.cellStatus[1]).toBe(CELL_STATUS.LOCKED);
    expect(result.letters[0]).toBe('B');
    expect(result.letters[1]).toBe('R');
  });

  it('flags letters present elsewhere in the word without duplicating beyond their count', () => {
    // target BRAVO has a single "O"; guessing "OCTET" puts O in position 0
    // (wrong place -> present), it should not also appear as present anywhere else.
    const result = evaluateGuess(row, 'OCTET');
    expect(result.cellStatus[0]).toBe(CELL_STATUS.PRESENT);
    expect(result.letters[0]).toBe('O');
  });

  it('keeps previously-locked letters locked even on a later wrong guess', () => {
    const partiallyLocked = {
      ...row,
      letters: ['B', 'R', '', '', ''],
      cellStatus: [CELL_STATUS.LOCKED, CELL_STATUS.LOCKED, CELL_STATUS.EMPTY, CELL_STATUS.EMPTY, CELL_STATUS.EMPTY],
    };
    const result = evaluateGuess(partiallyLocked, 'BRXXX');
    expect(result.cellStatus[0]).toBe(CELL_STATUS.LOCKED);
    expect(result.cellStatus[1]).toBe(CELL_STATUS.LOCKED);
    expect(result.letters[0]).toBe('B');
    expect(result.letters[1]).toBe('R');
  });

  it('accumulates not-in-word letters across guesses and detects an exact match', () => {
    const first = evaluateGuess(row, 'OCTET');
    expect(first.notIn).toEqual(['C', 'E', 'T']);

    const rowAfterFirstGuess = { ...row, notIn: first.notIn };
    const second = evaluateGuess(rowAfterFirstGuess, 'BRAVO');
    expect(second.isCorrect).toBe(true);
    expect(second.notIn).toEqual(['C', 'E', 'T']);
  });
});

describe('activateNextRow', () => {
  it('activates the row below when it is unknown', () => {
    const rows = createInitialRows(wordLadder, config);
    const { rows: next, isComplete } = activateNextRow(rows, 1, config);

    expect(next[1].status).toBe(ROW_STATUS.KNOWN);
    expect(next[1].prefix).toBe(config.correctPrefix);
    expect(next[2].status).toBe(ROW_STATUS.ACTIVE);
    expect(isComplete).toBe(false);
  });

  it('falls back to activating the row above when the row below is not unknown', () => {
    const rows = createInitialRows(wordLadder, config);
    const { rows: next } = activateNextRow(rows, rows.length - 2, config);

    expect(next[rows.length - 2].status).toBe(ROW_STATUS.KNOWN);
    expect(next[rows.length - 3].status).toBe(ROW_STATUS.ACTIVE);
  });

  it('reports completion once every row is known', () => {
    let rows = createInitialRows(['AB', 'CD', 'EF'], config); // 3-word ladder, row 1 is the only active row
    expect(rows[1].status).toBe(ROW_STATUS.ACTIVE);

    const result = activateNextRow(rows, 1, config);
    expect(result.isComplete).toBe(true);
    expect(result.rows.every((r) => r.status === ROW_STATUS.KNOWN)).toBe(true);
  });
});

describe('getActiveRowIndices', () => {
  it('returns the indices of all active rows', () => {
    const rows = createInitialRows(wordLadder, config);
    expect(getActiveRowIndices(rows)).toEqual([1, rows.length - 2]);
  });
});

describe('applyHint', () => {
  it('reveals a letter from the active rows and locks it in', () => {
    const rows = createInitialRows(['AB', 'CD', 'EF'], config);
    const next = applyHint(rows, config, { random: () => 0 });

    const activeRow = next[1];
    const revealedCount = activeRow.cellStatus.filter((s) => s === CELL_STATUS.LOCKED).length;
    expect(revealedCount).toBeGreaterThan(0);
  });

  it('adds the revealed letter to notIn when it does not appear in a given active row', () => {
    // Two simultaneously-active rows with no shared letters: CD and XY.
    const rows = [
      { status: ROW_STATUS.KNOWN, prefix: config.startPrefix, word: 'A', letters: ['A'], cellStatus: [CELL_STATUS.LOCKED], notIn: [] },
      { status: ROW_STATUS.ACTIVE, prefix: config.guessPrefix, word: 'CD', letters: ['', ''], cellStatus: [CELL_STATUS.EMPTY, CELL_STATUS.EMPTY], notIn: [] },
      { status: ROW_STATUS.ACTIVE, prefix: config.guessPrefix, word: 'XY', letters: ['', ''], cellStatus: [CELL_STATUS.EMPTY, CELL_STATUS.EMPTY], notIn: [] },
      { status: ROW_STATUS.KNOWN, prefix: config.endPrefix, word: 'Z', letters: ['Z'], cellStatus: [CELL_STATUS.LOCKED], notIn: [] },
    ];

    // candidate letters pool is C,D,X,Y - random() picks index 0 -> 'C'
    const next = applyHint(rows, config, { random: () => 0 });
    expect(next[1].letters[0]).toBe('C');
    expect(next[1].cellStatus[0]).toBe(CELL_STATUS.LOCKED);
    expect(next[2].notIn).toContain('C');
  });

  it('does nothing when there are no active rows', () => {
    const rows = [
      { status: ROW_STATUS.KNOWN, prefix: '', word: 'A', letters: ['A'], cellStatus: [CELL_STATUS.LOCKED], notIn: [] },
    ];
    expect(applyHint(rows, config)).toBe(rows);
  });
});

describe('revealAll', () => {
  it('reveals every non-known row and marks it as gave-up', () => {
    const rows = createInitialRows(wordLadder, config);
    const next = revealAll(rows, config);

    next.forEach((row) => {
      expect(row.status).toBe(ROW_STATUS.KNOWN);
      expect(row.letters.join('')).toBe(row.word);
    });
    expect(next[2].prefix).toBe(config.gaveUpPrefix);
    // rows that were already known (start/end) keep their original prefix
    expect(next[0].prefix).toBe(config.startPrefix);
  });
});
