import { useCallback, useEffect, useMemo, useState } from 'react';
import { config } from '../game/config';
import { loadDictionary, loadWordGraph } from '../game/dataLoader';
import { generateWordLadder } from '../game/wordGraph';
import {
  CELL_STATUS,
  ROW_STATUS,
  activateNextRow,
  applyHint,
  createInitialRows,
  evaluateGuess,
  revealAll,
} from '../game/ladder';

/**
 * Orchestrates a full game of Word Ladder: loading the data files, generating
 * a new ladder, and handling guesses/hints/give-up/restart. This is the React
 * equivalent of the Flask routes in flask_app.py, driven by client state
 * instead of a server session.
 */
export function useWordLadderGame() {
  const [phase, setPhase] = useState('loading'); // loading | error | playing | won | gaveup
  const [error, setError] = useState(null);
  const [data, setData] = useState(null); // { graph, dictionary }
  const [rows, setRows] = useState([]);
  const [guessCount, setGuessCount] = useState(0);
  const [message, setMessage] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const startNewLadder = useCallback((graph) => {
    const wordLadder = generateWordLadder(graph, config.wordLadderLength, {
      minNeighbors: config.minStartWordNeighbors,
      maxAttempts: config.maxBuildAttempts,
    });
    setRows(createInitialRows(wordLadder, config));
    setGuessCount(0);
    setMessage(null);
    setPhase('playing');
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadWordGraph(), loadDictionary()])
      .then(([graph, dictionary]) => {
        if (cancelled) return;
        setData({ graph, dictionary });
        startNewLadder(graph);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load the word ladder data.');
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
    // startNewLadder is stable (useCallback with no deps), safe to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLetter = useCallback((rowIndex, position, value) => {
    setRows((prevRows) => {
      const row = prevRows[rowIndex];
      if (!row || row.status !== ROW_STATUS.ACTIVE) return prevRows;
      if (row.cellStatus[position] === CELL_STATUS.LOCKED) return prevRows;

      const letters = [...row.letters];
      letters[position] = value;

      const next = [...prevRows];
      next[rowIndex] = { ...row, letters };
      return next;
    });
  }, []);

  const submitGuess = useCallback(
    (rowIndex) => {
      const row = rows[rowIndex];
      if (!row || row.status !== ROW_STATUS.ACTIVE || !data) return;

      const guess = row.letters.join('');
      if (row.letters.some((letter) => letter === '')) {
        setMessage({ tone: 'warning', text: config.incompleteWordMessage });
        return;
      }

      if (!data.dictionary.has(guess)) {
        setMessage({ tone: 'error', text: config.invalidWordMessage });
        return;
      }

      setGuessCount((count) => count + 1);
      const result = evaluateGuess(row, guess);

      if (result.isCorrect) {
        setRows((prevRows) => {
          const { rows: nextRows, isComplete } = activateNextRow(prevRows, rowIndex, config);
          if (isComplete) {
            setPhase('won');
            setMessage({ tone: 'success', text: config.successMessage });
          } else {
            setMessage(null);
          }
          return nextRows;
        });
      } else {
        setMessage(null);
        setRows((prevRows) => {
          const next = [...prevRows];
          next[rowIndex] = {
            ...row,
            letters: result.letters,
            cellStatus: result.cellStatus,
            notIn: result.notIn,
            prefix: config.tryAgainPrefix,
          };
          return next;
        });
      }
    },
    [rows, data],
  );

  const requestHint = useCallback(() => {
    setRows((prevRows) => applyHint(prevRows, config));
    setGuessCount((count) => count + 1);
  }, []);

  const giveUp = useCallback(() => {
    setRows((prevRows) => revealAll(prevRows, config));
    setPhase('gaveup');
    setMessage({ tone: 'info', text: config.giveUpMessage });
  }, []);

  const restart = useCallback(() => {
    if (data) startNewLadder(data.graph);
  }, [data, startNewLadder]);

  const toggleHelp = useCallback(() => setShowHelp((show) => !show), []);

  return useMemo(
    () => ({
      phase,
      error,
      rows,
      guessCount,
      message,
      showHelp,
      config,
      setLetter,
      submitGuess,
      requestHint,
      giveUp,
      restart,
      toggleHelp,
    }),
    [phase, error, rows, guessCount, message, showHelp, setLetter, submitGuess, requestHint, giveUp, restart, toggleHelp],
  );
}
