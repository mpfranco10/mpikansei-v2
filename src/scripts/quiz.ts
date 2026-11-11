import { questions } from "../data/questions";
import { detectLanguage, translations } from "../i18n/translations";
import { allAnswered, scoreAnswers } from "../utils/scoring";
import { downloadChart, plotScores } from "./chart";

import type { Answer, Answers, Scores } from "../types/quiz";

type HTMLElementConstructor<T extends HTMLElement> = new () => T;

const AUTO_ADVANCE_DELAY = 180;
const SCORE_MAXIMUMS = { E: 48, N: 48, L: 40 } as const;
const VALID_ANSWERS: readonly string[] = ["Yes", "DK", "No"];

function getElement<T extends HTMLElement>(
  id: string,
  constructor: HTMLElementConstructor<T>,
): T {
  const element = document.getElementById(id);

  if (!(element instanceof constructor)) {
    throw new TypeError(`Missing or invalid element: ${id}`);
  }

  return element;
}

function initializeQuiz() {
  const language = detectLanguage(navigator.language);
  const t = translations[language];

  document.documentElement.lang = language;
  document.title = t.page.title;

  const form = getElement("quizForm", HTMLFormElement);
  const note = getElement("note", HTMLElement);
  const description = getElement("description", HTMLElement);
  const previousButton = getElement("prevBtn", HTMLButtonElement);
  const nextButton = getElement("nextBtn", HTMLButtonElement);
  const submitButton = getElement("submitBtn", HTMLButtonElement);
  const questionLabel = getElement("questionLabel", HTMLElement);
  const questionCount = getElement("questionCount", HTMLElement);
  const progress = getElement("progress", HTMLProgressElement);
  const results = getElement("results", HTMLElement);
  const plotContainer = getElement("plotContainer", HTMLElement);
  const canvas = getElement("scoreChart", HTMLCanvasElement);
  const downloadButton = getElement("downloadChartBtn", HTMLButtonElement);
  const inputs = [
    ...form.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ];

  // Static translated content
  getElement("mainTitle", HTMLElement).textContent = t.page.heading;
  description.innerHTML = t.description;
  note.innerHTML = t.note;
  getElement("plotTitle", HTMLElement).textContent = t.page.plot;
  previousButton.textContent = t.buttons.prev;
  nextButton.textContent = t.buttons.next;
  submitButton.textContent = t.buttons.submit;
  downloadButton.textContent = t.buttons.downloadChart;
  getElement("yesLabel", HTMLElement).textContent = t.yes;
  getElement("dkLabel", HTMLElement).textContent = t.dk;
  getElement("noLabel", HTMLElement).textContent = t.no;

  const answers: Answers = {};
  let currentIndex = 0;
  let finished = false;
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | undefined;

  function cancelAutoAdvance() {
    if (autoAdvanceTimer !== undefined) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = undefined;
    }
  }

  function renderQuestion(focus = true) {
    const question = questions[currentIndex];

    questionLabel.textContent = t.questions[question.id];
    questionCount.textContent = `${currentIndex + 1} / ${questions.length}`;
    progress.value = Object.keys(answers).length;

    for (const input of inputs) {
      input.name = question.id;
      input.checked = answers[question.id] === input.value;
    }

    previousButton.disabled = currentIndex === 0;

    const isLastQuestion = currentIndex === questions.length - 1;
    nextButton.hidden = isLastQuestion;
    submitButton.hidden = !isLastQuestion;
    submitButton.disabled = !allAnswered(questions, answers);

    if (focus) {
      questionLabel.focus({ preventScroll: true });
    }
  }

  function renderResults(scores: Scores) {
    results.replaceChildren();

    const scoreRows = [
      ["E", t.results.e, SCORE_MAXIMUMS.E],
      ["N", t.results.n, SCORE_MAXIMUMS.N],
      ["L", t.results.l, SCORE_MAXIMUMS.L],
    ] as const;

    for (const [trait, label, maximum] of scoreRows) {
      const paragraph = document.createElement("p");
      const heading = document.createElement("strong");
      heading.textContent = `${label}:`;
      paragraph.append(heading, ` ${scores[trait]} / ${maximum}`);
      results.append(paragraph);
    }

    results.hidden = false;
  }

  function goToQuestion(index: number) {
    cancelAutoAdvance();
    currentIndex = index;
    renderQuestion();
  }

  previousButton.addEventListener("click", () => {
    if (finished) return;
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
    else cancelAutoAdvance();
  });

  nextButton.addEventListener("click", () => {
    if (finished) return;

    // A manual navigation action replaces any pending automatic advance.
    cancelAutoAdvance();

    if (!answers[questions[currentIndex].id]) {
      alert(t.alerts.selectAnswer);
      return;
    }

    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  });

  form.addEventListener("change", (event) => {
    if (
      finished ||
      !(event.target instanceof HTMLInputElement) ||
      event.target.type !== "radio" ||
      !form.contains(event.target) ||
      !VALID_ANSWERS.includes(event.target.value)
    ) {
      return;
    }

    const question = questions[currentIndex];
    answers[question.id] = event.target.value as Answer;

    // Keep the selected radio visible during the delay.
    // Do not renderQuestion() here: it would immediately replace the state.
    progress.value = Object.keys(answers).length;
    submitButton.disabled = !allAnswered(questions, answers);

    cancelAutoAdvance();

    if (currentIndex < questions.length - 1) {
      const answeredIndex = currentIndex;
      autoAdvanceTimer = setTimeout(() => {
        autoAdvanceTimer = undefined;
        if (!finished && currentIndex === answeredIndex) {
          goToQuestion(answeredIndex + 1);
        }
      }, AUTO_ADVANCE_DELAY);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (finished) return;

    cancelAutoAdvance();

    if (!allAnswered(questions, answers)) {
      alert(t.alerts.completeAll);
      return;
    }

    const scores = scoreAnswers(questions, answers);
    finished = true;
    form.hidden = true;
    note.hidden = true;
    description.hidden = true;

    renderResults(scores);
    plotContainer.hidden = false;

    canvas.setAttribute(
      "aria-label",
      `${t.chart.x}: ${scores.E}; ${t.chart.y}: ${scores.N}`,
    );

    const chart = plotScores(canvas, scores.E, scores.N, t);
    downloadButton.addEventListener("click", () => downloadChart(chart));
    results.focus();
  });

  form.hidden = false;
  renderQuestion(false);
}

initializeQuiz();
