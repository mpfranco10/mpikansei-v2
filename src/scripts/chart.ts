import {
  Chart,
  LinearScale,
  PointElement,
  ScatterController,
  Tooltip,
  type Plugin,
} from "chart.js";

import type { Translation } from "../types/quiz";

Chart.register(ScatterController, PointElement, LinearScale, Tooltip);

// MPI E and N scales both range from 0 to 48.
const SCORE_MIN = 0;
const SCORE_MAX = 48;
const GRID_SECTIONS = 3;

/**
 * Draws the 3 × 3 background used to visually divide
 * the Extraversion / Neuroticism score space.
 */
const backgroundGridPlugin: Plugin<"scatter"> = {
  id: "scoreGridBackground",

  beforeDraw: (chart) => {
    const { ctx, chartArea } = chart;

    const cellWidth = (chartArea.right - chartArea.left) / GRID_SECTIONS;

    const cellHeight = (chartArea.bottom - chartArea.top) / GRID_SECTIONS;

    ctx.save();

    for (let row = 0; row < GRID_SECTIONS; row++) {
      for (let column = 0; column < GRID_SECTIONS; column++) {
        const isAlternateCell = (row + column) % 2 !== 0;

        // Keep the background subtle so the participant's
        // score remains the main visual focus.
        ctx.fillStyle = isAlternateCell ? "#f5f0fa" : "#ffffff";

        ctx.fillRect(
          chartArea.left + column * cellWidth,
          chartArea.top + row * cellHeight,
          cellWidth,
          cellHeight,
        );
      }
    }

    ctx.restore();
  },
};

/**
 * Plots the participant's MPI Extraversion (E)
 * and Neuroticism (N) scores.
 *
 * The Lie scale (L) is displayed numerically
 * and is not part of this two-dimensional plot.
 */
export function plotScores(
  canvas: HTMLCanvasElement,
  eScore: number,
  nScore: number,
  t: Translation,
) {
  const prefersReducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return new Chart(canvas, {
    type: "scatter",

    data: {
      datasets: [
        {
          label: t.chart.point,

          data: [
            {
              x: eScore,
              y: nScore,
            },
          ],

          // Purple keeps the chart consistent with the questionnaire UI.
          backgroundColor: "#6f42a1",
          borderColor: "#ffffff",
          borderWidth: 2,
          pointRadius: 7,
          pointHoverRadius: 8,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: prefersReducedMotion
        ? false
        : {
            duration: 300,
          },

      scales: {
        x: {
          min: SCORE_MIN,
          max: SCORE_MAX,

          title: {
            display: true,
            text: t.chart.x,
          },

          ticks: {
            stepSize: 8,
          },

          grid: {
            drawOnChartArea: true,
            color: "#ddd7e3",
          },
        },

        y: {
          min: SCORE_MIN,
          max: SCORE_MAX,

          title: {
            display: true,
            text: t.chart.y,
          },

          ticks: {
            stepSize: 8,
          },

          grid: {
            drawOnChartArea: true,
            color: "#ddd7e3",
          },
        },
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (context) =>
              `${t.chart.point}: E ${context.parsed.x}, N ${context.parsed.y}`,
          },
        },
      },
    },

    plugins: [backgroundGridPlugin],
  });
}

/** Exports the existing canvas, including its plugin-painted background. */
export function downloadChart(chart: Chart<"scatter">) {
  // Finish the score point's animation before exporting, even on an immediate click.
  chart.stop();
  chart.update("none");

  const link = document.createElement("a");
  link.download = "mpi-score-plot.png";
  link.href = chart.toBase64Image("image/png");
  document.body.append(link);
  link.click();
  link.remove();
}
