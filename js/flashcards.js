/**
 * Dictionary Random Word Trainer
 * Replaces the old spaced-repetition/Leitner system.
 * Every time the trainer is opened or "Another word" is pressed,
 * a dictionary word is selected randomly. Built-in and custom words are supported.
 */
let dictionaryPool = [];
let currentDictionaryWord = null;

function shuffleArray(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildDictionaryPool() {
  const builtin = (typeof BUILTIN_DICTIONARY !== "undefined" ? BUILTIN_DICTIONARY : []).map(
    ([word, pos, bnMeaning, enMeaning, synonyms, example]) => ({
      word, pos, bnMeaning, enMeaning, synonyms, example, custom: false,
    })
  );

  let custom = [];
  try {
    custom = typeof Dictionary !== "undefined" && Dictionary.listCustom
      ? await Dictionary.listCustom()
      : [];
  } catch (_) {
    custom = [];
  }

  dictionaryPool = shuffleArray([...builtin, ...custom]);
  return dictionaryPool;
}

function renderRandomWord() {
  const wordEl = document.getElementById("card-front-text");
  const meaningEl = document.getElementById("card-back-text");
  const posEl = document.getElementById("card-pos");
  const synEl = document.getElementById("card-synonyms");
  const exampleEl = document.getElementById("card-example");
  const countEl = document.getElementById("dictionary-random-count");

  if (!dictionaryPool.length) {
    if (wordEl) wordEl.textContent = "কোনো শব্দ পাওয়া যায়নি";
    if (meaningEl) meaningEl.textContent = "অভিধানে শব্দ যোগ করুন।";
    return;
  }

  currentDictionaryWord = dictionaryPool[Math.floor(Math.random() * dictionaryPool.length)];
  const c = currentDictionaryWord;

  if (wordEl) wordEl.textContent = c.word || "—";
  if (posEl) posEl.textContent = c.pos || "Dictionary word";
  if (meaningEl) meaningEl.textContent = c.bnMeaning || c.enMeaning || "অর্থ যোগ করা হয়নি";
  if (synEl) synEl.textContent = c.synonyms ? `Synonyms: ${c.synonyms}` : "";
  if (exampleEl) exampleEl.textContent = c.example ? `Example: ${c.example}` : "";
  if (countEl) countEl.textContent = `${dictionaryPool.length} words available`;
}

async function initRandomDictionary() {
  await buildDictionaryPool();
  renderRandomWord();
}

async function nextRandomWord() {
  if (!dictionaryPool.length) await buildDictionaryPool();
  renderRandomWord();
}

window.Flashcards = {
  init: initRandomDictionary,
  next: nextRandomWord,
  flip: nextRandomWord,
};
