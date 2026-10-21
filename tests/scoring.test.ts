import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import { questions } from "../src/data/questions";
import { detectLanguage, translations } from "../src/i18n/translations";
import { allAnswered, scoreAnswers } from "../src/utils/scoring";

import type { Answer, Answers, ScoredTrait } from "../src/types/quiz";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const scoredQuestions = questions.filter(
  (question) => question.trait !== "Buffer",
);

const bufferQuestions = questions.filter(
  (question) => question.trait === "Buffer",
);

/**
 * Creates an answer set for all 80 questions.
 *
 * Buffer questions receive DK because their answer should never
 * affect E, N, or L scores.
 */
function createAnswers(
  getAnswer: (question: (typeof questions)[number]) => Answer,
): Answers {
  return Object.fromEntries(
    questions.map((question) => [question.id, getAnswer(question)]),
  ) as Answers;
}

// --------------------------------------------------
// Question structure
// --------------------------------------------------

test("MPI contains 80 questions", () => {
  assert.equal(questions.length, 80);
});

test("MPI contains the correct number of questions per scale", () => {
  const counts = {
    E: questions.filter((question) => question.trait === "E").length,
    N: questions.filter((question) => question.trait === "N").length,
    L: questions.filter((question) => question.trait === "L").length,
    Buffer: bufferQuestions.length,
  };

  assert.deepEqual(counts, {
    E: 24,
    N: 24,
    L: 20,
    Buffer: 12,
  });
});

test("buffer questions are the expected MPI items", () => {
  assert.deepEqual(
    bufferQuestions.map((question) => question.id),
    [
      "q7",
      "q21",
      "q22",
      "q29",
      "q30",
      "q34",
      "q53",
      "q60",
      "q70",
      "q74",
      "q78",
      "q80",
    ],
  );
});

test("all scored questions have a scoring key", () => {
  for (const question of scoredQuestions) {
    assert.ok(
      question.key === "Yes" || question.key === "No",
      `${question.id} must have a Yes/No scoring key`,
    );
  }
});

test("buffer questions do not have scoring keys", () => {
  for (const question of bufferQuestions) {
    assert.equal(Reflect.get(question, "key"), undefined);
  }
});

// --------------------------------------------------
// Scoring
// --------------------------------------------------

test("all keyed answers produce maximum scores", () => {
  const answers = createAnswers((question) => {
    if (question.trait === "Buffer") {
      return "DK";
    }

    return question.key;
  });

  assert.deepEqual(scoreAnswers(questions, answers), {
    E: 48,
    N: 48,
    L: 40,
  });
});

test("all opposite answers produce zero scores", () => {
  const answers = createAnswers((question) => {
    if (question.trait === "Buffer") {
      return "DK";
    }

    return question.key === "Yes" ? "No" : "Yes";
  });

  assert.deepEqual(scoreAnswers(questions, answers), {
    E: 0,
    N: 0,
    L: 0,
  });
});

test("all DK answers produce midpoint scores", () => {
  const answers = createAnswers(() => "DK");

  assert.deepEqual(scoreAnswers(questions, answers), {
    E: 24,
    N: 24,
    L: 20,
  });
});

test("a keyed answer gives 2 points", () => {
  const question = scoredQuestions[0];

  const answers: Answers = {
    [question.id]: question.key,
  };

  const scores = scoreAnswers(questions, answers);

  assert.equal(scores[question.trait as ScoredTrait], 2);
});

test("a DK answer gives 1 point", () => {
  const question = scoredQuestions[0];

  const answers: Answers = {
    [question.id]: "DK",
  };

  const scores = scoreAnswers(questions, answers);

  assert.equal(scores[question.trait as ScoredTrait], 1);
});

test("an opposite answer gives 0 points", () => {
  const question = scoredQuestions[0];

  const oppositeAnswer: Answer = question.key === "Yes" ? "No" : "Yes";

  const answers: Answers = {
    [question.id]: oppositeAnswer,
  };

  const scores = scoreAnswers(questions, answers);

  assert.equal(scores[question.trait as ScoredTrait], 0);
});

test("buffer answers never affect scores", () => {
  const yesAnswers = createAnswers((question) =>
    question.trait === "Buffer" ? "Yes" : "DK",
  );

  const noAnswers = createAnswers((question) =>
    question.trait === "Buffer" ? "No" : "DK",
  );

  const dkAnswers = createAnswers(() => "DK");

  assert.deepEqual(
    scoreAnswers(questions, yesAnswers),
    scoreAnswers(questions, dkAnswers),
  );

  assert.deepEqual(
    scoreAnswers(questions, noAnswers),
    scoreAnswers(questions, dkAnswers),
  );
});

// --------------------------------------------------
// Completion
// --------------------------------------------------

test("quiz is complete only when all 80 questions are answered", () => {
  const answers: Answers = {};

  assert.equal(allAnswered(questions, answers), false);

  for (const question of questions) {
    answers[question.id] = "DK";
  }

  assert.equal(allAnswered(questions, answers), true);

  delete answers.q80;

  assert.equal(allAnswered(questions, answers), false);
});

// --------------------------------------------------
// Translations
// --------------------------------------------------

test("translations remain unchanged", () => {
  const source = readFileSync(
    new URL("./fixtures/original-translations.txt", import.meta.url),
    "utf8",
  );

  const oldTranslations = JSON.parse(
    JSON.stringify(
      runInNewContext(
        source.replace("export const translations =", "const translations =") +
          "\ntranslations",
      ),
    ),
  );

  // The new download label is additive; all original content stays identical.
  for (const language of ["en", "ja"] as const) {
    const { downloadChart, ...originalButtons } =
      translations[language].buttons;
    assert.equal(
      downloadChart,
      language === "en" ? "Download chart" : "グラフをダウンロード",
    );
    assert.deepEqual(
      { ...translations[language], buttons: originalButtons },
      oldTranslations[language],
    );
  }

  for (const language of ["en", "ja"] as const) {
    assert.equal(Object.keys(translations[language].questions).length, 80);

    for (const { id } of questions) {
      assert.ok(
        translations[language].questions[id],
        `Missing ${language} translation for ${id}`,
      );
    }
  }
});

// --------------------------------------------------
// Language detection
// --------------------------------------------------

test("language detection works correctly", () => {
  for (const language of ["ja", "ja-JP"]) {
    assert.equal(detectLanguage(language), "ja");
  }

  for (const language of ["en-US", "fr", ""]) {
    assert.equal(detectLanguage(language), "en");
  }
});
