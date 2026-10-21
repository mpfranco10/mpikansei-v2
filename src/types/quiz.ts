export type ScoredTrait = "E" | "N" | "L";
export type Trait = ScoredTrait | "Buffer";

export type Answer = "Yes" | "DK" | "No";

export type QuestionId = `q${number}`;

export interface Question {
  readonly id: QuestionId;
  readonly trait: Trait;
  readonly key?: Exclude<Answer, "DK">;
}

export type Answers = Partial<Record<QuestionId, Answer>>;

export type Scores = Record<ScoredTrait, number>;

export interface Translation {
  yes: string;
  no: string;
  dk: string;

  buttons: {
    next: string;
    prev: string;
    submit: string;
    downloadChart: string;
  };

  alerts: {
    selectAnswer: string;
    completeAll: string;
  };

  results: {
    e: string;
    n: string;
    l: string;
  };

  chart: {
    point: string;
    x: string;
    y: string;
  };

  page: {
    title: string;
    heading: string;
    plot: string;
  };

  description: string;
  note: string;

  questions: Record<QuestionId, string>;
}
