// Pure functions that manage the "display" state of a word ladder: building the
// initial rows, scoring guesses letter-by-letter (Wordle-style, with permanent
// locked-in correct letters), activating neighboring rows once a row is solved,
// hints, and "give up" reveal-all. Ported from gs_functions.py
// (make_display_wl, update_display_i, update_display_v, show_all) and the
// `hint` route in flask_app.py.

export const ROW_STATUS = {
  KNOWN: 'known',
  ACTIVE: 'active',
  UNKNOWN: 'unknown',
};

export const CELL_STATUS = {
  LOCKED: 'locked', // confirmed right letter, right place - permanent, shown in green
  PRESENT: 'present', // right letter, wrong place - recomputed each guess, shown blue-grey
  EMPTY: 'empty', // not yet revealed / editable
};

function blankCells(word) {
  return {
    letters: Array.from({ length: word.length }, () => ''),
    cellStatus: Array.from({ length: word.length }, () => CELL_STATUS.EMPTY),
  };
}

function lockedCells(word) {
  return {
    letters: word.split(''),
    cellStatus: Array.from({ length: word.length }, () => CELL_STATUS.LOCKED),
  };
}

/**
 * Builds the initial row display state for a freshly generated word ladder.
 * The first and last words are fully known, the second and second-to-last rows
 * are active (guessable), and everything in between is unknown/blank.
 */
export function createInitialRows(wordLadder, config) {
  const lastIndex = wordLadder.length - 1;

  return wordLadder.map((word, index) => {
    if (index === 0) {
      return {
        status: ROW_STATUS.KNOWN,
        prefix: config.startPrefix,
        word,
        notIn: [],
        ...lockedCells(word),
      };
    }

    if (index === lastIndex) {
      return {
        status: ROW_STATUS.KNOWN,
        prefix: config.endPrefix,
        word,
        notIn: [],
        ...lockedCells(word),
      };
    }

    if (index === 1 || index === lastIndex - 1) {
      return {
        status: ROW_STATUS.ACTIVE,
        prefix: config.guessPrefix,
        word,
        notIn: [],
        ...blankCells(word),
      };
    }

    return {
      status: ROW_STATUS.UNKNOWN,
      prefix: '',
      word,
      notIn: [],
      ...blankCells(word),
    };
  });
}

function countOccurrences(word, letter) {
  return word.split('').filter((char) => char === letter).length;
}

/**
 * Scores a single guess against a row's target word. Returns the new letters /
 * cellStatus / notIn arrays plus whether the guess was an exact match. Letters
 * that were already locked in (from a previous correct guess or a hint) stay
 * locked even if this guess is wrong elsewhere.
 */
export function evaluateGuess(row, guess) {
  const target = row.word;
  if (guess.length !== target.length) {
    throw new Error('Guess length must match the target word length.');
  }

  const letters = [...row.letters];
  const cellStatus = [...row.cellStatus];

  // Pass 1: exact matches lock in; any previously-unlocked cell is cleared so
  // we can recompute "present elsewhere" highlighting from scratch below.
  for (let i = 0; i < target.length; i += 1) {
    if (guess[i] === target[i]) {
      letters[i] = guess[i];
      cellStatus[i] = CELL_STATUS.LOCKED;
    } else if (cellStatus[i] !== CELL_STATUS.LOCKED) {
      letters[i] = '';
      cellStatus[i] = CELL_STATUS.EMPTY;
    }
  }

  // Pass 2: right letter, wrong place - duplicate-letter aware, matching the
  // original Python logic (instances in target minus already-locked instances
  // minus instances already flagged "present" earlier in this same guess).
  for (let i = 0; i < target.length; i += 1) {
    const letter = guess[i];
    if (letter === target[i] || !target.includes(letter)) continue;

    const instances = countOccurrences(target, letter);
    const lockedInstances = target
      .split('')
      .filter((char, j) => char === letter && cellStatus[j] === CELL_STATUS.LOCKED).length;

    let remaining = instances - lockedInstances;
    for (let j = 0; j < i; j += 1) {
      if (letters[j] === letter && cellStatus[j] === CELL_STATUS.PRESENT) {
        remaining -= 1;
      }
    }

    if (remaining > 0) {
      letters[i] = letter;
      cellStatus[i] = CELL_STATUS.PRESENT;
    }
  }

  const notIn = new Set(row.notIn);
  for (const letter of guess) {
    if (!target.includes(letter)) notIn.add(letter);
  }

  return {
    letters,
    cellStatus,
    notIn: Array.from(notIn).sort(),
    isCorrect: guess === target,
  };
}

/**
 * Applies a correct guess to `rows` at `rowIndex`: marks the row fully known,
 * then activates the next adjacent unknown row (preferring below, then above).
 * If both neighbors are already known, the ladder is complete.
 */
export function activateNextRow(rows, rowIndex, config) {
  const next = rows.map((row) => ({ ...row }));
  const row = next[rowIndex];

  next[rowIndex] = {
    ...row,
    status: ROW_STATUS.KNOWN,
    prefix: config.correctPrefix,
    ...lockedCells(row.word),
  };

  const below = next[rowIndex + 1];
  const above = next[rowIndex - 1];

  if (below && below.status === ROW_STATUS.UNKNOWN) {
    next[rowIndex + 1] = {
      ...below,
      status: ROW_STATUS.ACTIVE,
      prefix: config.guessPrefix,
      ...blankCells(below.word),
    };
  } else if (above && above.status === ROW_STATUS.UNKNOWN) {
    next[rowIndex - 1] = {
      ...above,
      status: ROW_STATUS.ACTIVE,
      prefix: config.guessPrefix,
      ...blankCells(above.word),
    };
  }

  const isComplete = next.every((r) => r.status === ROW_STATUS.KNOWN);

  return { rows: next, isComplete };
}

/** Returns the indices of all currently-active (guessable) rows. */
export function getActiveRowIndices(rows) {
  const indices = [];
  rows.forEach((row, index) => {
    if (row.status === ROW_STATUS.ACTIVE) indices.push(index);
  });
  return indices;
}

/**
 * Reveals one random, not-yet-locked letter across the active row(s), counted
 * as part of the guess count. If the chosen letter isn't present in a given
 * active row's target word, that row's "not in word" list is updated instead.
 * Mirrors the `/hint` route in flask_app.py, including its fallback of
 * re-revealing an already-guessed letter if nothing new remains.
 */
export function applyHint(rows, config, { random = Math.random } = {}) {
  const activeIndices = getActiveRowIndices(rows);
  if (activeIndices.length === 0) return rows;

  const targetIndices = [...new Set([activeIndices[0], activeIndices[activeIndices.length - 1]])];

  const guessedLetters = new Set();
  targetIndices.forEach((index) => {
    const row = rows[index];
    row.letters.forEach((letter, i) => {
      if (row.cellStatus[i] === CELL_STATUS.LOCKED && letter) guessedLetters.add(letter);
    });
  });

  const candidateLetters = new Set();
  targetIndices.forEach((index) => {
    rows[index].word.split('').forEach((letter) => {
      if (!guessedLetters.has(letter)) candidateLetters.add(letter);
    });
  });

  const pool =
    candidateLetters.size > 0 ? Array.from(candidateLetters) : Array.from(guessedLetters);
  if (pool.length === 0) return rows;

  const reveal = pool[Math.floor(random() * pool.length)];

  const next = rows.map((row) => ({ ...row }));
  targetIndices.forEach((index) => {
    const row = next[index];
    const letters = [...row.letters];
    const cellStatus = [...row.cellStatus];
    let foundInWord = false;

    row.word.split('').forEach((letter, i) => {
      if (letter === reveal) {
        letters[i] = reveal;
        cellStatus[i] = CELL_STATUS.LOCKED;
        foundInWord = true;
      }
    });

    const notIn = foundInWord
      ? row.notIn
      : Array.from(new Set([...row.notIn, reveal])).sort();

    next[index] = { ...row, letters, cellStatus, notIn };
  });

  return next;
}

/** Reveals the full answer for every row that isn't already known ("give up"). */
export function revealAll(rows, config) {
  return rows.map((row) => {
    if (row.status === ROW_STATUS.KNOWN) return row;
    return {
      ...row,
      status: ROW_STATUS.KNOWN,
      prefix: config.gaveUpPrefix,
      ...lockedCells(row.word),
    };
  });
}
