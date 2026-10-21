import { questions } from "../data/questions";
import { detectLanguage, translations } from "../i18n/translations";
import { allAnswered, scoreAnswers } from "../utils/scoring";
import { downloadChart, plotScores } from "./chart";

import type { Answer, Answers, Scores } from "../types/quiz";
type HTMLElementConstructor<T extends HTMLElement> = new () => T;

/**
 * Gets an element by ID and checks that it is the expected HTML element type.
 * Throws an error immediately if the quiz HTML and script are out of sync.
 */

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

/**
 * Maximum possible score for each MPI scale.
 *
 * E: 24 scored questions × 2 = 48
 * N: 24 scored questions × 2 = 48
 * L: 20 scored questions × 2 = 40
 *
 * Buffer questions do not contribute to any score.
 */
const SCORE_MAXIMUMS = {
  E: 48,
  N: 48,
  L: 40,
} as const;

/**
 * Initializes and controls the MPI questionnaire.
 */
function initializeQuiz() {
  // --------------------------------------------------
  // Language
  // --------------------------------------------------

  const language = detectLanguage(navigator.language);
  const t = translations[language];

  document.documentElement.lang = language;
  document.title = t.page.title;

  // --------------------------------------------------
  // DOM elements
  // --------------------------------------------------

  const form = getElement("quizForm", HTMLFormElement);

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
  downloadButton.textContent = t.buttons.downloadChart;

  const inputs = [
    ...form.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ];

  // --------------------------------------------------
  // Static translated content
  // --------------------------------------------------

  getElement("mainTitle", HTMLElement).textContent = t.page.heading;
  getElement("description", HTMLElement).innerHTML = t.description;
  getElement("note", HTMLElement).innerHTML = t.note;
  getElement("plotTitle", HTMLElement).textContent = t.page.plot;

  previousButton.textContent = t.buttons.prev;
  nextButton.textContent = t.buttons.next;
  submitButton.textContent = t.buttons.submit;

  getElement("yesLabel", HTMLElement).textContent = t.yes;
  getElement("dkLabel", HTMLElement).textContent = t.dk;
  getElement("noLabel", HTMLElement).textContent = t.no;

  // --------------------------------------------------
  // Quiz state
  // --------------------------------------------------

  const answers: Answers = {};

  let currentIndex = 0;
  let finished = false;

  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------

  /**
   * Updates the UI to display the current question and its saved answer.
   */
  function renderQuestion(focus = true) {
    const question = questions[currentIndex];

    questionLabel.textContent = t.questions[question.id];
    questionCount.textContent = `${currentIndex + 1} / ${questions.length}`;

    // Number of questions already answered.
    progress.value = Object.keys(answers).length;

    // Restore the selected answer when navigating backwards.
    for (const input of inputs) {
      input.name = question.id;
      input.checked = answers[question.id] === input.value;
    }

    previousButton.disabled = currentIndex === 0;

    const isLastQuestion = currentIndex === questions.length - 1;

    nextButton.hidden = isLastQuestion;
    submitButton.hidden = !isLastQuestion;

    // Submission is only possible after all 80 questions are answered.
    submitButton.disabled = !allAnswered(questions, answers);

    if (focus) {
      questionLabel.focus({ preventScroll: true });
    }
  }

  /**
   * Displays the final E, N and L scores.
   */
  function renderResults(scores: Scores) {
    results.replaceChildren();

    const scoreRows = [
      ["E", t.results.e, SCORE_MAXIMUMS.E],
      ["N", t.results.n, SCORE_MAXIMUMS.N],
      ["L", t.results.l, SCORE_MAXIMUMS.L],
    ] as const;

    for (const [trait, text, maximum] of scoreRows) {
      const paragraph = document.createElement("p");
      const heading = document.createElement("strong");

      heading.textContent = `${text}:`;

      paragraph.append(heading, ` ${scores[trait]} / ${maximum}`);

      results.append(paragraph);
    }

    results.hidden = false;
  }

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  previousButton.addEventListener("click", () => {
    if (finished || currentIndex === 0) {
      return;
    }

    currentIndex--;
    renderQuestion();
  });

  nextButton.addEventListener("click", () => {
    if (finished) {
      return;
    }

    const currentQuestion = questions[currentIndex];

    if (!answers[currentQuestion.id]) {
      alert(t.alerts.selectAnswer);
      return;
    }

    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    }
  });

  // --------------------------------------------------
  // Answer selection
  // --------------------------------------------------

  form.addEventListener("change", (event) => {
    if (finished || !(event.target instanceof HTMLInputElement)) {
      return;
    }

    const value = event.target.value;

    // Ignore unexpected radio values.
    if (!["Yes", "DK", "No"].includes(value)) {
      return;
    }

    const currentQuestion = questions[currentIndex];

    answers[currentQuestion.id] = value as Answer;

    // Automatically continue to the next question after answering.
    if (currentIndex < questions.length - 1) {
      currentIndex++;
    }

    renderQuestion();
  });

  // --------------------------------------------------
  // Submission
  // --------------------------------------------------

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (finished) {
      return;
    }

    if (!allAnswered(questions, answers)) {
      alert(t.alerts.completeAll);
      return;
    }

    const scores = scoreAnswers(questions, answers);

    finished = true;
    form.hidden = true;

    // Display numerical results.
    renderResults(scores);

    // Display the E/N personality plot.
    plotContainer.hidden = false;

    canvas.setAttribute(
      "aria-label",
      `${t.chart.x}: ${scores.E}; ${t.chart.y}: ${scores.N}`,
    );

    const chart = plotScores(canvas, scores.E, scores.N, t);
    downloadButton.addEventListener("click", () => downloadChart(chart));

    results.focus();
  });

  // --------------------------------------------------
  // Start quiz
  // --------------------------------------------------

  form.hidden = false;
  renderQuestion(false);
}

initializeQuiz();
