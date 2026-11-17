/**
 * Word Ladder
 * Copyright (c) Parker & Gordon Saussy. All rights reserved.
 * This code and the Word Ladder game concept/design are credited to
 * Gordon Saussy and Parker Saussy. Built with React & Vercel.
 * See the LICENSE file for usage terms.
 */

import { useWordLadderGame } from './hooks/useWordLadderGame';
import Toolbar from './components/Toolbar';
import HelpModal from './components/HelpModal';
import LadderRow from './components/LadderRow';
import Footer from './components/Footer';
import './App.css';

function App() {
  const {
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
  } = useWordLadderGame();

  if (phase === 'loading') {
    return (
      <>
        <main id="word-ladder" className="word-ladder word-ladder--loading">
          <p>Loading the word ladder…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (phase === 'error') {
    return (
      <>
        <main id="word-ladder" className="word-ladder word-ladder--error">
          <p>Something went wrong: {error}</p>
        </main>
        <Footer />
      </>
    );
  }

  const gameOver = phase === 'won' || phase === 'gaveup';

  return (
    <>
      <main id="word-ladder" className="word-ladder">
        <header className="word-ladder__header">
          <p className="word-ladder__tab">{config.tabTitle}</p>
          <h1>{config.title}</h1>
          <p className="word-ladder__instructions">{config.instructions}</p>
        </header>

        <Toolbar
          config={config}
          onHelp={toggleHelp}
          onRestart={restart}
          onGiveUp={giveUp}
          onHint={requestHint}
          disabled={gameOver}
        />

        <p className="word-ladder__count">
          {config.guessCountLabel}
          {guessCount}
        </p>

        {message && <p className={`word-ladder__message word-ladder__message--${message.tone}`}>{message.text}</p>}

        <div className="ladder">
          {rows.map((row, index) => (
            <LadderRow
              key={index}
              row={row}
              rowIndex={index}
              config={config}
              onLetterChange={setLetter}
              onSubmit={submitGuess}
            />
          ))}
        </div>

        {showHelp && <HelpModal config={config} onClose={toggleHelp} />}
      </main>
      <Footer />
    </>
  );
}

export default App;
