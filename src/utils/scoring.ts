import type { Answers, Question, Scores } from "../types/quiz";

export function scoreAnswers(
  questions: readonly Question[],
  answers: Answers,
): Scores {
  const scores: Scores = { E: 0, N: 0, L: 0 };

  for (const question of questions) {
    if (question.trait === "Buffer" || !question.key) {
      continue;
    }

    const answer = answers[question.id];

    if (answer === "DK") {
      scores[question.trait] += 1;
    } else if (answer === question.key) {
      scores[question.trait] += 2;
    }
  }

  return scores;
}

export function allAnswered(
  questions: readonly Question[],
  answers: Answers,
): boolean {
  return questions.every(({ id }) => answers[id] !== undefined);
}
