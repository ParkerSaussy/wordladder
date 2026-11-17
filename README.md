# Word Ladder

A React + Vite recreation of the Word Ladder word-association game (originally a
Flask app hosted on PythonAnywhere). Connect the first word to the last word by
guessing the words that link them — synonyms, antonyms, homonyms, members of
the same group, or other related words.

## How it works

- A random "start" word is picked from a graph of ~2,850 words, each linked to
  a handful of related words (`public/data/word-graph.json`, converted from
  the original app's `wld.csv`).
- A 7-word ladder is built by randomly walking that graph, backtracking around
  dead ends, until the ladder reaches full length.
- The first and last words are shown; the rows adjacent to them are guessable.
  Guesses are checked against a ~280k-word dictionary
  (`public/data/dictionary.json`, converted from `allwords.csv`) and scored
  letter-by-letter: a correct letter in the correct position locks in green
  (and stays locked across future guesses), a correct letter in the wrong
  position is shown blue-grey, and letters confirmed absent from the word are
  listed below the row.
- Solving a row activates the next adjacent unsolved row until the ladder is
  complete. "Get Hint" reveals a random unrevealed letter (counted as a
  guess); "See Answers" reveals the whole ladder; "Start Over" generates a new
  ladder.

The game logic lives in [src/game/](src/game) (pure, unit-tested functions for
building ladders and scoring guesses) and is orchestrated by the
[useWordLadderGame](src/hooks/useWordLadderGame.js) hook.

## Scripts

```bash
npm run dev          # start the Vite dev server
npm run build        # production build
npm run preview      # preview the production build
npm run lint         # run ESLint
npm run test         # run the test suite once
npm run test:watch   # run the test suite in watch mode
```

## Tests

Tests live in [tests/](tests) and run with [Vitest](https://vitest.dev/):

- `tests/game/` — unit tests for the pure word-graph and ladder/guess-scoring
  logic.
- `tests/components/` — an integration test that renders the full `App` with
  mocked data and simulates guessing, hinting, giving up, and restarting.

## React + Vite

This project is bootstrapped with Vite's React template, providing HMR and
ESLint rules out of the box.
