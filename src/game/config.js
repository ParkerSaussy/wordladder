// Text content and tunable settings for the Word Ladder game.
// Ported verbatim from the original PythonAnywhere/Flask app's wl_db.csv database.

export const config = {
  tabTitle: 'Word Ladder',
  title: 'Word Ladder',
  instructions:
    'Connect the first word to the last word by guessing the words that link them. ' +
    'These can be synonyms, antonyms, homonyms, members of the same group or other related words.',
  helpButtonLabel: 'Game Instructions',
  restartButtonLabel: 'Start Over',
  giveUpButtonLabel: 'See Answers',
  hintButtonLabel: 'Get Hint',
  submitButtonLabel: 'Enter',
  helpText:
    'The objective of Word Ladder is to link the first word to the last word by guessing the words ' +
    'in between. These can be synonyms, antonyms, homonyms, members of the same group (e.g. cow, ' +
    'chicken are both farm animals) or connected by other relationships. You can guess either down ' +
    'from the first or up the last word, one word at a time. If your guess is correct, you’ll be able ' +
    'to continue to the next blank word (up or down) until all words have been guessed. If your guess ' +
    'is invalid (not a real word, or not long enough), the game will let you know so you can try again. ' +
    'If your guess is valid but incorrect, you will be able to see if you guessed the right letter in the ' +
    'right location (green) or the right letter but in the wrong location (blue-grey). You can get a hint ' +
    '(one letter chosen at random) any time you like, but each hint will be counted as part of your guess count.',
  closeHelpLabel: 'Return to Game',
  guessCountLabel: 'Guess Count: ',
  startPrefix: 'Start: ',
  endPrefix: 'End: ',
  guessPrefix: 'Guess:',
  tryAgainPrefix: 'Try Again:',
  correctPrefix: 'Correct:',
  gaveUpPrefix: 'Gave Up:',
  notInWordLabel: 'Not in Word: ',
  giveUpMessage: "Here's the entire Word Ladder. Better luck next time!",
  successMessage: 'Congratulations! You guessed the entire Word Ladder.',
  invalidWordMessage: 'That is not a valid word. Try again.',
  incompleteWordMessage: 'Fill in all the letters before submitting.',

  // the number of words in a generated word ladder, including the start and end words
  wordLadderLength: 7,
  // a candidate start word must have more than this many one-hop related words
  minStartWordNeighbors: 3,
  // safety valve for the random-walk ladder builder
  maxBuildAttempts: 1000,
};

export const dataUrls = {
  wordGraph: `${import.meta.env.BASE_URL}data/word-graph.json`,
  dictionary: `${import.meta.env.BASE_URL}data/dictionary.json`,
};
