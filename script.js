
'use strict';
 
// ══════════════════════════════════════════════
// THEMES
// ══════════════════════════════════════════════
const THEMES = [
  { id: 'kristall',    name: 'Kristall' },
  { id: 'mitternacht', name: 'Mitternacht' },
  { id: 'ozean',       name: 'Ozean' },
  { id: 'blumenwiese', name: 'Blumenwiese' },
];
 
let currentThemeIndex = 0;
let selectedThemeIndex = 0;
let cards = [];
let deck = [];
let currentIndex = 0;
let seenSet = new Set();
 
// ══════════════════════════════════════════════
// DOM REFS
// ══════════════════════════════════════════════
const body              = document.body;
const screens           = {
  theme:  document.getElementById('screen-theme'),
  start:  document.getElementById('screen-start'),
  quiz:   document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result'),
};
 
// Theme picker
const btnPrev           = document.getElementById('btn-prev');
const btnNext           = document.getElementById('btn-next');
const btnChoose         = document.getElementById('btn-choose');
const themeNameDisplay  = document.getElementById('theme-name-display');
const previewCardInner  = document.getElementById('preview-card-inner');
const previewCard       = document.getElementById('preview-card');
const themeDots         = document.querySelectorAll('.tdot');
 
// Start
const startCount        = document.getElementById('start-count');
const btnStart          = document.getElementById('btn-start');
const btnChangeTheme    = document.getElementById('btn-change-theme');
 
// Quiz
const quizCounter       = document.getElementById('quiz-counter');
const progressFill      = document.getElementById('progress-fill');
const progressLabel     = document.getElementById('progress-label');
const cardInner         = document.getElementById('card-inner');
const flashcard         = document.getElementById('flashcard');
const cardQuestion      = document.getElementById('card-question');
const cardAnswer        = document.getElementById('card-answer');
const btnQuizPrev       = document.getElementById('btn-quiz-prev');
const btnQuizNext       = document.getElementById('btn-quiz-next');
const btnBackToStart    = document.getElementById('btn-back-to-start');
const btnThemeToggle    = document.getElementById('btn-theme-toggle');
 
// Font-size controls
const btnFontToggle     = document.getElementById('btn-font-toggle');
const fontPanel         = document.getElementById('font-panel');
const fontSlider        = document.getElementById('font-slider');
const fontValue         = document.getElementById('font-value');
const fontSizeControl   = document.getElementById('font-size-control');
 
// Result
const resultSub         = document.getElementById('result-sub');
const btnShuffle        = document.getElementById('btn-shuffle');
const btnRestart        = document.getElementById('btn-restart');
const btnResultHome     = document.getElementById('btn-result-home');
 
// ══════════════════════════════════════════════
// SCREEN NAVIGATION
// ══════════════════════════════════════════════
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}
 
// ══════════════════════════════════════════════
// THEME APPLICATION
// FIX: Theme-Klasse gezielt tauschen, nicht
//      body.className komplett überschreiben
// ══════════════════════════════════════════════
function applyTheme(index) {
  THEMES.forEach(t => body.classList.remove(`theme-${t.id}`));
  body.classList.add(`theme-${THEMES[index].id}`);
}
 
function applyPickerTheme(index) {
  applyTheme(index);
  themeNameDisplay.textContent = THEMES[index].name;
  themeDots.forEach((d, i) => d.classList.toggle('active', i === index));
  previewCardInner.classList.remove('flipped');
}
 
// ══════════════════════════════════════════════
// FONT SIZE
// ══════════════════════════════════════════════
const FONT_STORAGE_KEY = 'quiz-font-size';
const DEFAULT_FONT_SIZE = 18;
 
function applyFontSize(px) {
  document.documentElement.style.setProperty('--base-font-size', px + 'px');
  fontSlider.value = px;
  fontValue.textContent = px + 'px';
  try { localStorage.setItem(FONT_STORAGE_KEY, px); } catch(e) {}
}
 
// Gespeicherte Größe laden
(function loadSavedFontSize() {
  try {
    const saved = parseInt(localStorage.getItem(FONT_STORAGE_KEY));
    applyFontSize(saved >= 14 && saved <= 28 ? saved : DEFAULT_FONT_SIZE);
  } catch(e) {
    applyFontSize(DEFAULT_FONT_SIZE);
  }
})();
 
fontSlider.addEventListener('input', () => {
  applyFontSize(parseInt(fontSlider.value));
});
 
// Panel öffnen / schließen
btnFontToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const willOpen = fontPanel.hidden;
  fontPanel.hidden = !willOpen;
  btnFontToggle.classList.toggle('btn-icon--active', willOpen);
});
 
// Klick außerhalb → Panel schließen
document.addEventListener('click', (e) => {
  if (!fontSizeControl.contains(e.target)) {
    fontPanel.hidden = true;
    btnFontToggle.classList.remove('btn-icon--active');
  }
});
 
// ══════════════════════════════════════════════
// THEME PICKER EVENTS
// ══════════════════════════════════════════════
btnPrev.addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex - 1 + THEMES.length) % THEMES.length;
  applyPickerTheme(currentThemeIndex);
});
 
btnNext.addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
  applyPickerTheme(currentThemeIndex);
});
 
themeDots.forEach(dot => {
  dot.addEventListener('click', () => {
    currentThemeIndex = parseInt(dot.dataset.i);
    applyPickerTheme(currentThemeIndex);
  });
});
 
previewCard.addEventListener('click', () => {
  previewCardInner.classList.toggle('flipped');
});
 
btnChoose.addEventListener('click', () => {
  selectedThemeIndex = currentThemeIndex;
  applyTheme(selectedThemeIndex);
  startCount.textContent = `${cards.length} Karten geladen`;
  showScreen('start');
});
 
// ══════════════════════════════════════════════
// START SCREEN EVENTS
// ══════════════════════════════════════════════
btnStart.addEventListener('click', () => {
  deck = [...cards];
  startQuiz();
});
 
btnChangeTheme.addEventListener('click', () => {
  showScreen('theme');
});
 
// ══════════════════════════════════════════════
// QUIZ LOGIC
// ══════════════════════════════════════════════
function startQuiz() {
  currentIndex = 0;
  seenSet = new Set();
  showCard(0);
  showScreen('quiz');
}
 
function showCard(index) {
  const card = deck[index];
  cardQuestion.textContent = card.question;
  cardAnswer.textContent   = card.answer;
  cardInner.classList.remove('flipped');
  seenSet.add(index);
  updateHeader();
  updateProgress();
  updateNavButtons();
}
 
function updateHeader() {
  quizCounter.textContent = `${currentIndex + 1} / ${deck.length}`;
}
 
function updateProgress() {
  const pct = (seenSet.size / deck.length) * 100;
  progressFill.style.width = `${pct}%`;
  progressLabel.textContent = `${seenSet.size} von ${deck.length} gesehen`;
}
 
function updateNavButtons() {
  btnQuizPrev.disabled = currentIndex === 0;
  btnQuizPrev.style.opacity = currentIndex === 0 ? '0.35' : '1';
}
 
flashcard.addEventListener('click', () => {
  cardInner.classList.toggle('flipped');
});
 
btnQuizNext.addEventListener('click', () => {
  if (currentIndex < deck.length - 1) {
    currentIndex++;
    showCard(currentIndex);
  } else {
    showResult();
  }
});
 
btnQuizPrev.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    showCard(currentIndex);
  }
});
 
btnBackToStart.addEventListener('click', () => {
  showScreen('start');
});
 
btnThemeToggle.addEventListener('click', () => {
  selectedThemeIndex = (selectedThemeIndex + 1) % THEMES.length;
  applyTheme(selectedThemeIndex);
});
 
// ══════════════════════════════════════════════
// RESULT
// ══════════════════════════════════════════════
function showResult() {
  resultSub.textContent = `Du hast alle ${deck.length} Karten gesehen.`;
  showScreen('result');
}
 
btnShuffle.addEventListener('click', () => {
  deck = shuffle([...cards]);
  startQuiz();
});
 
btnRestart.addEventListener('click', () => {
  deck = [...cards];
  startQuiz();
});
 
btnResultHome.addEventListener('click', () => {
  showScreen('start');
});
 
// ══════════════════════════════════════════════
// SHUFFLE (Fisher-Yates)
// ══════════════════════════════════════════════
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
 
// ══════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ══════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (!screens.quiz.classList.contains('active')) return;
  if (e.key === 'ArrowRight' || e.key === 'Enter') {
    btnQuizNext.click();
  } else if (e.key === 'ArrowLeft') {
    btnQuizPrev.click();
  } else if (e.key === ' ') {
    e.preventDefault();
    cardInner.classList.toggle('flipped');
  }
});
 
// ══════════════════════════════════════════════
// LOAD JSON
// ══════════════════════════════════════════════
async function loadCards() {
  try {
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error('Laden fehlgeschlagen');
    cards = await res.json();
    deck  = [...cards];
  } catch (err) {
    console.error('Fehler beim Laden der Karten:', err);
    cards = [{ question: 'Fehler beim Laden.', answer: 'Bitte questions.json prüfen.' }];
    deck  = [...cards];
  }
}
 
// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
(async () => {
  await loadCards();
  applyPickerTheme(0);
  showScreen('theme');
})();
 
