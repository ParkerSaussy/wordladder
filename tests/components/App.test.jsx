import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { resetDataCache } from '../../src/game/dataLoader';
import { CELL_STATUS } from '../../src/game/ladder';

// A small deterministic word graph: ONE has four neighbors (so it's the only
// eligible start word) and the rest form a single chain of connected words,
// long enough to build the default 7-word ladder.
const graph = {
  ONE: ['TWO', 'X1', 'X2', 'X3'],
  TWO: ['ONE', 'THREE'],
  THREE: ['TWO', 'FOUR'],
  FOUR: ['THREE', 'FIVE'],
  FIVE: ['FOUR', 'SIX'],
  SIX: ['FIVE', 'SEVEN'],
  SEVEN: ['SIX'],
  X1: ['ONE'],
  X2: ['ONE'],
  X3: ['ONE'],
};

const dictionary = ['TWO', 'SIX', 'FOO', 'BAR', 'ABC'];

function mockFetch() {
  globalThis.fetch = vi.fn((url) => {
    const href = url.toString();
    if (href.includes('word-graph.json')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(graph) });
    }
    if (href.includes('dictionary.json')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(dictionary) });
    }
    return Promise.reject(new Error(`Unexpected fetch url: ${href}`));
  });
}

function rowContainer(container, rowIndex) {
  return container.querySelector(`[data-row-index="${rowIndex}"]`);
}

function guessCountText(container) {
  return container.querySelector('.word-ladder__count').textContent;
}

async function typeWord(user, rowNumber, word) {
  for (let i = 0; i < word.length; i += 1) {
    const input = screen.queryByLabelText(`Row ${rowNumber}, letter ${i + 1}`);
    if (input) {
      await user.type(input, word[i]);
    }
  }
}

describe('App (Word Ladder game)', () => {
  beforeEach(() => {
    resetDataCache();
    mockFetch();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds the ladder, revealing the known start/end words and two active rows', async () => {
    const { container } = render(<App />);

    await waitFor(() => expect(container.querySelector('.ladder')).toBeTruthy());

    expect(rowContainer(container, 0).textContent).toContain('ONE');
    expect(rowContainer(container, 6).textContent).toContain('SEVEN');
    expect(rowContainer(container, 1).className).toContain('row--active');
    expect(rowContainer(container, 5).className).toContain('row--active');
    expect(guessCountText(container)).toContain('0');
  });

  it('rejects a guess that is not a dictionary word, without incrementing the count', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector('.ladder')).toBeTruthy());

    await typeWord(user, 2, 'ZZZ'); // row index 1 -> "Row 2, letter N"
    await user.click(within(rowContainer(container, 1)).getByText('Enter'));

    expect(await screen.findByText(/not a valid word/i)).toBeInTheDocument();
    expect(guessCountText(container)).toContain('0');
  });

  it('shows letter feedback for a valid but incorrect guess, then solves the row', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector('.ladder')).toBeTruthy());

    // Row 1 (index 1) target word is "TWO". "FOO" is a valid dictionary word
    // that shares the final O in the right place.
    await typeWord(user, 2, 'FOO');
    await user.click(within(rowContainer(container, 1)).getByText('Enter'));

    await waitFor(() => expect(guessCountText(container)).toContain('1'));
    const row1 = rowContainer(container, 1);
    expect(row1.className).toContain('row--retry');
    expect(row1.querySelectorAll('.tile--locked')).toHaveLength(1); // the final "O"
    expect(row1.textContent).toContain('Not in Word:');
    expect(row1.textContent).toContain('F');

    // Now submit the correct word; only the two un-locked letters are editable.
    await typeWord(user, 2, 'TW');
    await user.click(within(rowContainer(container, 1)).getByText('Enter'));

    await waitFor(() => expect(guessCountText(container)).toContain('2'));
    const solvedRow = rowContainer(container, 1);
    expect(solvedRow.className).toContain('row--correct');
    // solving row 1 activates row 2 (the next unknown row toward the middle)
    expect(rowContainer(container, 2).className).toContain('row--active');
  });

  it('reveals a locked letter and increments the guess count when a hint is requested', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector('.ladder')).toBeTruthy());

    await user.click(screen.getByText('Get Hint'));

    await waitFor(() => expect(guessCountText(container)).toContain('1'));
    const lockedTiles = [...container.querySelectorAll('.row--active .tile--locked')];
    expect(lockedTiles.length).toBeGreaterThan(0);
  });

  it('reveals the full ladder and disables further play when giving up', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector('.ladder')).toBeTruthy());

    await user.click(screen.getByText('See Answers'));

    expect(await screen.findByText(/better luck next time/i)).toBeInTheDocument();
    [0, 1, 2, 3, 4, 5, 6].forEach((index) => {
      expect(rowContainer(container, index).textContent).not.toBe('');
    });
    expect(screen.getByText('Get Hint')).toBeDisabled();
    expect(screen.getByText('See Answers')).toBeDisabled();
  });

  it('resets the game state when restarting', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector('.ladder')).toBeTruthy());

    await user.click(screen.getByText('Get Hint'));
    await waitFor(() => expect(guessCountText(container)).toContain('1'));

    await user.click(screen.getByText('Start Over'));

    await waitFor(() => expect(guessCountText(container)).toContain('0'));
    const row1 = rowContainer(container, 1);
    expect(row1.querySelectorAll(`.tile--${CELL_STATUS.LOCKED}`)).toHaveLength(0);
  });
});
