// Loads the word-relationship graph and the valid-guess dictionary that were
// converted from the original app's wld.csv and allwords.csv. Results are
// cached in-module so repeated game restarts don't re-fetch the data.

import { dataUrls } from './config';

let graphPromise = null;
let dictionaryPromise = null;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/** Loads the word graph: { WORD: [relatedWord, ...] }. */
export function loadWordGraph() {
  if (!graphPromise) {
    graphPromise = fetchJson(dataUrls.wordGraph);
  }
  return graphPromise;
}

/** Loads the full list of valid dictionary words and returns it as a Set. */
export function loadDictionary() {
  if (!dictionaryPromise) {
    dictionaryPromise = fetchJson(dataUrls.dictionary).then((words) => new Set(words));
  }
  return dictionaryPromise;
}

/** Test/dev helper to reset the in-memory caches. */
export function resetDataCache() {
  graphPromise = null;
  dictionaryPromise = null;
}
