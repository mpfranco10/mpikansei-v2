import { translations } from "./translations.js";

const browserLang = navigator.language.startsWith("ja") ? "ja" : "en";
console.log(browserLang);
const t = translations[browserLang] || translations.en;

const questions = [
  { id: "q1", trait: "E", key: "Yes" },
  { id: "q2", trait: "E", key: "Yes" },
  { id: "q3", trait: "E", key: "Yes" },
  { id: "q4", trait: "N", key: "Yes" },
  { id: "q5", trait: "L", key: "Yes" },
  { id: "q6", trait: "E", key: "Yes" },
  { id: "q7", trait: "E", key: "Yes" },
  { id: "q8", trait: "N", key: "Yes" },
  { id: "q9", trait: "E", key: "Yes" },
  { id: "q10", trait: "N", key: "Yes" },
  { id: "q11", trait: "N", key: "Yes" },
  { id: "q12", trait: "L", key: "Yes" },
  { id: "q13", trait: "E", key: "Yes" },
  { id: "q14", trait: "E", key: "Yes" },
  { id: "q15", trait: "N", key: "Yes" },
  { id: "q16", trait: "N", key: "Yes" },
  { id: "q17", trait: "N", key: "Yes" },
  { id: "q18", trait: "N", key: "Yes" },
  { id: "q19", trait: "L", key: "Yes" },
  { id: "q20", trait: "N", key: "Yes" },
  { id: "q21", trait: "E", key: "Yes" },
  { id: "q22", trait: "N", key: "Yes" },
  { id: "q23", trait: "E", key: "Yes" },
  { id: "q24", trait: "E", key: "Yes" },
  { id: "q25", trait: "N", key: "Yes" },
  { id: "q26", trait: "N", key: "Yes" },
  { id: "q27", trait: "N", key: "Yes" },
  { id: "q28", trait: "E", key: "Yes" },
  { id: "q29", trait: "E", key: "Yes" },
  { id: "q30", trait: "N", key: "Yes" },
  { id: "q31", trait: "N", key: "Yes" },
  { id: "q32", trait: "N", key: "Yes" },
  { id: "q33", trait: "L", key: "Yes" },
  { id: "q34", trait: "E", key: "Yes" },
  { id: "q35", trait: "N", key: "Yes" },
  { id: "q36", trait: "L", key: "Yes" },
  { id: "q37", trait: "E", key: "Yes" },
  { id: "q38", trait: "N", key: "Yes" },
  { id: "q39", trait: "N", key: "Yes" },
  { id: "q40", trait: "L", key: "Yes" },
  { id: "q41", trait: "E", key: "Yes" },
  { id: "q42", trait: "N", key: "Yes" },
  { id: "q43", trait: "L", key: "Yes" },
  { id: "q44", trait: "E", key: "Yes" },
  { id: "q45", trait: "N", key: "Yes" },
  { id: "q46", trait: "E", key: "Yes" },
  { id: "q47", trait: "E", key: "Yes" },
  { id: "q48", trait: "N", key: "Yes" },
  { id: "q49", trait: "N", key: "Yes" },
  { id: "q50", trait: "N", key: "Yes" },
  { id: "q51", trait: "E", key: "Yes" },
  { id: "q52", trait: "L", key: "Yes" },
  { id: "q53", trait: "N", key: "No" },
  { id: "q54", trait: "N", key: "Yes" },
  { id: "q55", trait: "L", key: "Yes" },
  { id: "q56", trait: "E", key: "Yes" },
  { id: "q57", trait: "E", key: "Yes" },
  { id: "q58", trait: "N", key: "Yes" },
  { id: "q59", trait: "N", key: "Yes" },
  { id: "q60", trait: "E", key: "Yes" },
  { id: "q61", trait: "E", key: "Yes" },
  { id: "q62", trait: "L", key: "Yes" },
  { id: "q63", trait: "N", key: "Yes" },
  { id: "q64", trait: "N", key: "Yes" },
  { id: "q65", trait: "N", key: "Yes" },
  { id: "q66", trait: "E", key: "Yes" },
  { id: "q67", trait: "N", key: "Yes" },
  { id: "q68", trait: "N", key: "Yes" },
  { id: "q69", trait: "E", key: "No" },
  { id: "q70", trait: "E", key: "Yes" },
  { id: "q71", trait: "N", key: "Yes" },
  { id: "q72", trait: "L", key: "Yes" },
  { id: "q73", trait: "E", key: "Yes" },
  { id: "q74", trait: "N", key: "Yes" },
  { id: "q75", trait: "E", key: "Yes" },
  { id: "q76", trait: "N", key: "Yes" },
  { id: "q77", trait: "L", key: "Yes" },
  { id: "q78", trait: "N", key: "Yes" },
  { id: "q79", trait: "E", key: "Yes" },
  { id: "q80", trait: "E", key: "Yes" },
];

document.title = t.page.title;
document.getElementById("pageTitle").textContent = t.page.title;
document.getElementById("mainTitle").textContent = t.page.heading;
document.getElementById("plotTitle").textContent = t.page.plot;
document.getElementById("description").innerHTML = t.description;
document.getElementById("note").innerHTML = t.note;

const quizDiv = document.getElementById("quiz");
const form = document.getElementById("quizForm");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");

prevBtn.textContent = t.buttons.prev;
nextBtn.textContent = t.buttons.next;
submitBtn.textContent = t.buttons.submit;

let currentIndex = 0;

const answers = {};
let isFinished = false;

function renderQuestion(index) {
  if (isFinished) return;

  const q = questions[index];

  quizDiv.innerHTML = `
    <div class="question-card">
      <div class="question-top">
        <div class="question-count">${index + 1} / ${questions.length}</div>
        <h3 class="question-label">${t.questions[q.id]}</h3>
      </div>

      <div class="pane">
        ${renderOption(index, "Yes", t.yes)}
        ${renderOption(index, "DK", t.dk)}
        ${renderOption(index, "No", t.no)}
      </div>
    </div>
  `;

  prevBtn.disabled = index === 0;

  const isLast = index === questions.length - 1;
  nextBtn.style.display = isLast ? "none" : "inline-block";
  submitBtn.style.display = isLast ? "inline-block" : "none";

  const saved = answers[`q${index}`];
  if (saved) {
    const input = quizDiv.querySelector(
      `input[name="q${index}"][value="${saved}"]`,
    );
    if (input) input.checked = true;
  }

  updateSubmitState();
}

function renderOption(index, value, label) {
  const name = `q${index}`;
  return `
    <label class="option">
      <input type="radio" name="${name}" value="${value}" />
      <span>${label}</span>
    </label>
  `;
}

function allAnswered() {
  for (let i = 0; i < questions.length; i++) {
    if (!answers[`q${i}`]) return false;
  }
  return true;
}

function updateSubmitState() {
  submitBtn.disabled = !allAnswered();
}

function saveCurrentAnswer() {
  const checked = document.querySelector(
    `input[name="q${currentIndex}"]:checked`,
  );
  if (checked) {
    answers[`q${currentIndex}`] = checked.value;
    return true;
  }
  return false;
}

nextBtn.addEventListener("click", () => {
  if (isFinished) return;

  if (!saveCurrentAnswer()) {
    alert(t.alerts.selectAnswer);
    return;
  }

  currentIndex++;
  renderQuestion(currentIndex);
});

prevBtn.addEventListener("click", () => {
  if (isFinished) return;
  if (currentIndex === 0) return;

  currentIndex--;
  renderQuestion(currentIndex);
});

quizDiv.addEventListener("change", (e) => {
  if (isFinished) return;

  const target = e.target;
  if (!target.matches('input[type="radio"]')) return;

  answers[`q${currentIndex}`] = target.value;

  updateSubmitState();

  const isLast = currentIndex === questions.length - 1;

  if (isLast) {
    nextBtn.style.display = "none";
    submitBtn.style.display = "inline-block";
    return;
  }

  currentIndex++;
  renderQuestion(currentIndex);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isFinished) return;

  if (!allAnswered()) {
    alert(t.alerts.completeAll);
    updateSubmitState();
    return;
  }

  let eScore = 0;
  let nScore = 0;
  let lScore = 0;

  questions.forEach((q, index) => {
    const val = answers[`q${index}`];

    if (val === q.key) {
      if (q.trait === "E") eScore++;
      else if (q.trait === "N") nScore++;
      else if (q.trait === "L") lScore++;
    }
  });

  isFinished = true;

  quizDiv.style.display = "none";
  prevBtn.style.display = "none";
  nextBtn.style.display = "none";
  submitBtn.style.display = "none";

  document.getElementById("results").innerHTML =
    `<p><strong>${t.results.e}:</strong> ${eScore} / 48</p>` +
    `<p><strong>${t.results.n}:</strong> ${nScore} / 48</p>` +
    `<p><strong>${t.results.l}:</strong> ${lScore} / 24</p>`;

  plotScores(eScore, nScore);
});

renderQuestion(currentIndex);
updateSubmitState();

let chartInstance = null;

function plotScores(e, n) {
  const ctx = document.getElementById("scoreChart").getContext("2d");
  document.getElementById("plotContainer").style.display = "block";

  if (chartInstance) {
    chartInstance.destroy();
  }

  const bgPlugin = {
    id: "customGridBackground",
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const xStep = (chartArea.right - chartArea.left) / 3;
      const yStep = (chartArea.bottom - chartArea.top) / 3;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#ffe6e6";
          ctx.fillRect(
            chartArea.left + col * xStep,
            chartArea.top + row * yStep,
            xStep,
            yStep,
          );
        }
      }
    },
  };

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: t.chart.point,
          data: [{ x: e, y: n }],
          backgroundColor: "red",
          pointRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 48,
          title: {
            display: true,
            text: t.chart.x,
          },
          ticks: {
            stepSize: 8,
          },
          grid: {
            drawOnChartArea: true,
            color: "#ccc",
          },
        },
        y: {
          min: 0,
          max: 48,
          title: {
            display: true,
            text: t.chart.y,
          },
          ticks: {
            stepSize: 8,
          },
          grid: {
            drawOnChartArea: true,
            color: "#ccc",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
    plugins: [bgPlugin],
  });
}
