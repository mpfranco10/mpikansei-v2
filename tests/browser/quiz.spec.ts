import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

import { questions } from "../../src/data/questions";
import { translations } from "../../src/i18n/translations";

import type { Answer } from "../../src/types/quiz";

// --------------------------------------------------
// Test configuration
// --------------------------------------------------

const locales = ["en-US", "ja-JP"] as const;

const viewports = {
  desktop: {
    width: 1280,
    height: 900,
  },
  tablet: {
    width: 768,
    height: 1024,
  },
  mobile: {
    width: 375,
    height: 812,
  },
} as const;

// --------------------------------------------------
// Full questionnaire E2E tests
// --------------------------------------------------

for (const locale of locales) {
  for (const [device, viewport] of Object.entries(viewports)) {
    test(`${locale} ${device} full questionnaire`, async ({ browser }) => {
      const language = locale === "ja-JP" ? "ja" : "en";
      const t = translations[language];

      const context = await browser.newContext({
        locale,
        reducedMotion: "reduce",
        viewport,
      });

      const page = await context.newPage();

      // Collect unexpected JavaScript errors.
      const errors: string[] = [];

      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      // --------------------------------------------------
      // Initial page
      // --------------------------------------------------

      await page.goto("http://127.0.0.1:4321/mpikansei/");

      await expect(page.locator("html")).toHaveAttribute("lang", language);

      await expect(page).toHaveTitle(t.page.title);

      await expect(page.locator("#prevBtn")).toBeDisabled();
      await expect(page.locator("#submitBtn")).toBeDisabled();

      await expect(page.locator("#downloadChartBtn")).toBeHidden();

      // The page should never overflow horizontally.
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);

      await page.screenshot({
        path: `test-results/${locale}-${device}-question.png`,
        fullPage: true,
      });

      // --------------------------------------------------
      // Keyboard interaction
      // --------------------------------------------------

      // Select Yes on q1 using the keyboard.
      // The quiz should automatically advance to q2.
      await page.locator('input[value="Yes"]').focus();
      await page.keyboard.press("Space");

      await expect(page.locator("#questionLabel")).toHaveText(t.questions.q2);

      // Go back to q1 and verify that Yes was saved.
      await page.locator("#prevBtn").click();

      await expect(page.locator('input[value="Yes"]')).toBeChecked();

      // Change q1 to DK.
      // It should automatically advance to q2 again.
      await page.locator('input[value="DK"]').click();

      await expect(page.locator("#questionLabel")).toHaveText(t.questions.q2);

      // Go back again and verify that the new answer was saved.
      await page.locator("#prevBtn").click();

      await expect(page.locator('input[value="DK"]')).toBeChecked();

      // Return to q2.
      await page.locator("#nextBtn").click();

      // --------------------------------------------------
      // Complete remaining questions
      // --------------------------------------------------

      for (const question of questions.slice(1)) {
        await expect(page.locator("#questionLabel")).toHaveText(
          t.questions[question.id],
        );

        await expect(page.locator('input[type="radio"]')).toHaveCount(3);

        /*
         * For scored questions, choose the keyed response.
         * This gives 2 points.
         *
         * Buffer questions do not affect the score, so DK is used
         * simply to provide a valid answer and continue the quiz.
         */
        const answer: Answer =
          question.trait === "Buffer" ? "DK" : question.key;

        await page.locator(`input[value="${answer}"]`).click();
      }

      // --------------------------------------------------
      // Submission
      // --------------------------------------------------

      await expect(page.locator("#progress")).toHaveJSProperty("value", 80);

      await expect(page.locator("#submitBtn")).toBeEnabled();

      await page.locator("#submitBtn").click();

      await expect(page.locator("#quizForm")).toBeHidden();

      // --------------------------------------------------
      // Results
      // --------------------------------------------------

      /*
       * q1 was intentionally changed to DK above.
       *
       * Every other scored question uses its keyed answer.
       *
       * Therefore:
       *
       * E = 23 keyed answers × 2 + q1 DK × 1 = 47
       * N = 24 keyed answers × 2 = 48
       * L = 20 keyed answers × 2 = 40
       */
      await expect(page.locator("#results")).toContainText("47 / 48");

      await expect(page.locator("#results")).toContainText("48 / 48");

      await expect(page.locator("#results")).toContainText("40 / 40");

      // --------------------------------------------------
      // Chart
      // --------------------------------------------------

      const chart = page.locator("#scoreChart");

      await expect(chart).toBeVisible();
      const downloadButton = page.getByRole("button", {
        name: t.buttons.downloadChart,
      });
      await expect(downloadButton).toBeVisible();
      const wrapper = await page.locator(".canvas-wrapper").boundingBox();
      const canvasBox = await chart.boundingBox();
      expect(wrapper).not.toBeNull();
      expect(canvasBox).not.toBeNull();
      expect(Math.abs(wrapper!.width - wrapper!.height)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(canvasBox!.width - canvasBox!.height),
      ).toBeLessThanOrEqual(1);
      expect(Math.abs(canvasBox!.width - wrapper!.width)).toBeLessThanOrEqual(
        1,
      );

      // Keyboard activation must export the actual rendered PNG.
      await downloadButton.focus();
      const downloadPromise = page.waitForEvent("download");
      await page.keyboard.press("Enter");
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe("mpi-score-plot.png");
      expect(await download.failure()).toBeNull();
      const downloadPath = await download.path();
      expect(downloadPath).not.toBeNull();
      const png = await readFile(downloadPath!);
      expect([...png.subarray(0, 8)]).toEqual([
        137, 80, 78, 71, 13, 10, 26, 10,
      ]);
      expect(png.readUInt32BE(16)).toBe(png.readUInt32BE(20));
      // Byte equality proves the export contains every canvas pixel, including the grid.
      const displayedImage = await chart.evaluate((canvas: HTMLCanvasElement) =>
        canvas.toDataURL("image/png"),
      );
      expect(png.toString("base64")).toBe(displayedImage.split(",")[1]);

      // Verify that Chart.js actually rendered pixels on the canvas.
      expect(
        await chart.evaluate((canvas: HTMLCanvasElement) => {
          const context = canvas.getContext("2d");

          if (!context) {
            return false;
          }

          const data = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          ).data;

          return data.some((value, index) => index % 4 === 3 && value > 0);
        }),
      ).toBe(true);

      // --------------------------------------------------
      // Responsive layout
      // --------------------------------------------------

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);

      await page.screenshot({
        path: `test-results/${locale}-${device}.png`,
        fullPage: true,
      });

      // No unexpected browser errors should have occurred.
      expect(errors).toEqual([]);

      await context.close();
    });
  }
}
