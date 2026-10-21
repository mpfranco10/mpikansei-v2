# Maudsley / Eysenck questionnaire

Astro + TypeScript static application. No client UI framework. English and Japanese content, the 80-question ordering and scoring keys are preserved verbatim.

## Run

Requires Node.js 22.22+.

```sh
npm ci
npm run dev
npm run check
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

Development URL: http://localhost:4321/mpikansei/
Production output: `dist/`. The Astro site/base configuration preserves hosting at https://mpfranco10.github.io/mpikansei/. Publish the contents of `dist`, rather than the repository root.

## Structure

- `src/pages/index.astro`: semantic page presentation
- `src/styles/global.css`: responsive purple theme, focus and selection states
- `src/data/questions.ts`: exact original ordered question configuration
- `src/types/quiz.ts`: questionnaire and translation types
- `src/i18n/translations.ts`: original translations and browser locale selection
- `src/utils/scoring.ts`: pure scoring and completeness functions
- `src/scripts/quiz.ts`: local quiz state, ID-based answers and navigation
- `src/scripts/chart.ts`: Chart.js scatter plot and original grid background
- `tests/fixtures`: frozen original implementation, translations, and question data
- `tests/scoring.test.ts`: equivalence and content regression checks
- `tests/browser/quiz.spec.ts`: complete EN/JA questionnaires at mobile/desktop sizes

## Research behavior

A matching answer adds exactly one point to its trait. DK is valid and adds zero. q53 (N) and q69 (E) are the only No-scored items. Actual all-key totals are E=31, N=37, L=12. The original displayed denominators (48/48/24) and 0–48 chart axes intentionally remain unchanged. No interpretation or scoring correction is introduced.

The scoring tests execute the original scoring block against fixed input cases and compare both implementations to explicit expected totals. Tests also compare all questions and the entire translation object with the frozen originals. Browser tests verify every question renders, locale behavior, keyboard selection, automatic advance, restoration/editing, final scores, painted chart, and absence of horizontal overflow.

Accessibility changes: page language follows the browser, zoom is enabled, radios use a fieldset/legend, focus moves to the current question after navigation, results receive focus on completion, and chart values have a text equivalent. Auto-advance is retained, including for keyboard selection. No responses are persisted or sent to a server.
