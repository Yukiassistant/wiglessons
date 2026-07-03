const STORAGE_KEY = "wiglessons.progress.v1";
const CHECKS = [
  ["read", "Read lesson"],
  ["definitions", "Reviewed definitions"],
  ["resource", "Opened required resource"],
  ["practice", "Finished practice"],
  ["ready", "Readiness criteria met"],
];

const state = {
  data: null,
  progress: {},
  selectedDay: 1,
  view: "today",
  search: "",
};

const els = {
  detail: document.querySelector("#detail"),
  exportButton: document.querySelector("#exportButton"),
  importFile: document.querySelector("#importFile"),
  lessonList: document.querySelector("#lessonList"),
  lessonSearch: document.querySelector("#lessonSearch"),
  progressFill: document.querySelector("#progressFill"),
  progressNumber: document.querySelector("#progressNumber"),
  progressText: document.querySelector("#progressText"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  todaySummary: document.querySelector("#todaySummary"),
};

init();

async function init() {
  state.progress = loadProgress();
  const response = await fetch("lessons.json");
  state.data = await response.json();
  state.selectedDay = todayDay();
  bindEvents();
  render();
}

function bindEvents() {
  els.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      if (state.view === "today") state.selectedDay = todayDay();
      render();
    });
  });

  els.lessonSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderLessonList();
  });

  els.exportButton.addEventListener("click", exportProgress);
  els.importFile.addEventListener("change", importProgress);
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  renderOverview();
  renderLessonList();
}

function lessonProgress(day) {
  if (!state.progress[day]) {
    state.progress[day] = { checks: {}, notes: "", stuck: false, needsMaterials: false };
  }
  return state.progress[day];
}

function getLesson(day) {
  return state.data.lessons.find((lesson) => lesson.day === day) || state.data.lessons[0];
}

function todayDay() {
  if (!state.data) return 1;
  const start = new Date(`${state.data.course.startDate}T00:00:00-07:00`);
  const now = new Date();
  const diff = Math.floor((startOfDay(now) - startOfDay(start)) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), state.data.lessons.length);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function completionFor(day) {
  const checks = lessonProgress(day).checks || {};
  const done = CHECKS.filter(([key]) => checks[key]).length;
  return { done, total: CHECKS.length, complete: done === CHECKS.length };
}

function courseStats() {
  const completed = state.data.lessons.filter((lesson) => completionFor(lesson.day).complete).length;
  const total = state.data.lessons.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

function render() {
  els.tabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
  renderOverview();
  renderLessonList();
  renderDetail();
}

function renderOverview() {
  if (!state.data) return;
  const today = getLesson(todayDay());
  const stats = courseStats();
  els.todaySummary.textContent = `Day ${today.day}: ${today.title}`;
  els.progressNumber.textContent = `${stats.percent}%`;
  els.progressFill.style.width = `${stats.percent}%`;
  els.progressText.textContent = `${stats.completed} of ${stats.total} lessons complete`;
}

function renderLessonList() {
  const template = document.querySelector("#lessonButtonTemplate");
  els.lessonList.replaceChildren();

  const lessons = state.data.lessons.filter((lesson) => {
    if (!state.search) return true;
    const terms = lesson.glossary.map((item) => item.term).join(" ");
    return `${lesson.title} ${lesson.objective} ${terms}`.toLowerCase().includes(state.search);
  });

  for (const lesson of lessons) {
    const node = template.content.firstElementChild.cloneNode(true);
    const completion = completionFor(lesson.day);
    node.classList.toggle("is-active", lesson.day === state.selectedDay && state.view !== "glossary");
    node.classList.toggle("is-complete", completion.complete);
    node.classList.toggle("has-progress", completion.done > 0);
    node.setAttribute("aria-label", `Day ${lesson.day}: ${lesson.title}, ${completion.done} of ${completion.total} core items complete`);
    node.querySelector(".lesson-day").textContent = lesson.day;
    node.querySelector(".lesson-title").textContent = lesson.title;
    node.querySelector(".lesson-state").textContent = completion.complete
      ? "Complete"
      : `${completion.done}/${completion.total} core done`;
    node.addEventListener("click", () => {
      state.selectedDay = lesson.day;
      state.view = "lessons";
      render();
    });
    els.lessonList.append(node);
  }

  if (!lessons.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No lessons match that search.";
    els.lessonList.append(empty);
  }
}

function renderDetail() {
  if (state.view === "glossary") {
    renderGlossary();
    return;
  }
  if (state.view === "progress") {
    renderProgress();
    return;
  }
  renderLesson(getLesson(state.selectedDay));
}

function renderLesson(lesson) {
  const progress = lessonProgress(lesson.day);
  const completion = completionFor(lesson.day);
  const previousDay = Math.max(1, lesson.day - 1);
  const nextDay = Math.min(state.data.lessons.length, lesson.day + 1);

  els.detail.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">Day ${lesson.day}</p>
        <h2>${escapeHtml(lesson.title)}</h2>
        <p class="muted">${escapeHtml(lesson.objective)}</p>
        <div class="lesson-actions" aria-label="Lesson navigation">
          <button class="ghost-button" type="button" id="previousLesson" ${lesson.day === 1 ? "disabled" : ""}>Previous</button>
          <button class="primary-button" type="button" id="nextLesson" ${lesson.day === state.data.lessons.length ? "disabled" : ""}>Next lesson</button>
        </div>
      </div>
      <span class="status-pill">${completion.complete ? "Complete" : `${completion.done}/${completion.total} core done`}</span>
    </div>
    <div class="section-grid">
      <section class="section is-wide">
        <div class="checklist-header">
          <div>
            <h3>Completion checklist</h3>
            <p class="muted">These five items count toward lesson progress.</p>
          </div>
          <span class="mini-status">${completion.done}/${completion.total} core done</span>
        </div>
        <div class="checklist" aria-label="Completion checklist">
          ${CHECKS.map(([key, label]) => checkRow(lesson.day, key, label, progress.checks?.[key])).join("")}
        </div>
        <div class="flag-group" aria-label="Lesson flags">
          <div>
            <h3>Lesson flags</h3>
            <p class="muted">These are notes for planning and do not change completion.</p>
          </div>
          <div class="flag-list">
            ${checkRow(lesson.day, "stuck", "Stuck on this", progress.stuck, "flag")}
            ${checkRow(lesson.day, "needsMaterials", "Needs materials", progress.needsMaterials, "flag")}
          </div>
        </div>
      </section>
      <section class="section is-wide">
        <h3>Concept</h3>
        <p>${escapeHtml(lesson.concept)}</p>
      </section>
      <section class="section is-wide">
        <h3>Mini glossary</h3>
        <ul class="definition-list">
          ${lesson.glossary.map((item) => definitionItem(item)).join("")}
        </ul>
      </section>
      <section class="section">
        <h3>Required resources</h3>
        ${resourceList(lesson.requiredResources)}
      </section>
      <section class="section">
        <h3>Optional resources</h3>
        ${resourceList(lesson.optionalResources)}
      </section>
      <section class="section">
        <h3>Practice</h3>
        <p>${escapeHtml(lesson.practice)}</p>
      </section>
      <section class="section">
        <h3>Safety</h3>
        <p>${escapeHtml(lesson.safety)}</p>
      </section>
      <section class="section">
        <h3>Reflection</h3>
        <p>${escapeHtml(lesson.reflection)}</p>
      </section>
      <section class="section">
        <h3>Readiness</h3>
        <p>${escapeHtml(lesson.readiness)}</p>
      </section>
      <section class="section is-wide">
        <h3>Notes</h3>
        <textarea id="lessonNotes" aria-label="Lesson notes">${escapeHtml(progress.notes || "")}</textarea>
        <div class="notes-actions">
          <button class="primary-button" type="button" id="saveNotes">Save notes</button>
          <button class="danger-button" type="button" id="clearLesson">Clear lesson progress</button>
        </div>
      </section>
    </div>
  `;

  els.detail.querySelector("#previousLesson").addEventListener("click", () => {
    state.selectedDay = previousDay;
    state.view = "lessons";
    render();
  });

  els.detail.querySelector("#nextLesson").addEventListener("click", () => {
    state.selectedDay = nextDay;
    state.view = "lessons";
    render();
  });

  els.detail.querySelectorAll("[data-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const target = lessonProgress(lesson.day);
      const key = checkbox.dataset.check;
      if (checkbox.dataset.kind === "flag") {
        target[key] = checkbox.checked;
      } else {
        target.checks[key] = checkbox.checked;
      }
      saveProgress();
      renderLesson(lesson);
    });
  });

  els.detail.querySelector("#saveNotes").addEventListener("click", () => {
    lessonProgress(lesson.day).notes = els.detail.querySelector("#lessonNotes").value;
    saveProgress();
  });

  els.detail.querySelector("#clearLesson").addEventListener("click", () => {
    delete state.progress[lesson.day];
    saveProgress();
    renderLesson(lesson);
  });
}

function checkRow(day, key, label, checked, kind = "check") {
  const id = `lesson-${day}-${key}`;
  return `
    <label class="check-item ${kind === "flag" ? "is-flag" : ""}" for="${id}">
      <input id="${id}" data-check="${key}" data-kind="${kind}" type="checkbox" ${checked ? "checked" : ""}>
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function definitionItem(item) {
  return `
    <li>
      <span class="definition-term">${escapeHtml(item.term)}</span>
      <span>${escapeHtml(item.definition)}</span>
    </li>
  `;
}

function resourceList(resources) {
  return `
    <ul class="resource-list">
      ${resources.map((resource) => `
        <li><a href="${escapeAttribute(resource.url)}" target="_blank" rel="noreferrer">${escapeHtml(resource.title)}</a></li>
      `).join("")}
    </ul>
  `;
}

function renderGlossary() {
  const terms = new Map();
  state.data.lessons.forEach((lesson) => {
    lesson.glossary.forEach((item) => {
      if (!terms.has(item.term)) {
        terms.set(item.term, { ...item, lessons: [] });
      }
      terms.get(item.term).lessons.push(lesson.day);
    });
  });

  els.detail.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">Reference</p>
        <h2>Glossary</h2>
        <p class="muted">${terms.size} terms across the course.</p>
      </div>
    </div>
    <div class="section-grid">
      <section class="section is-wide">
        <div class="glossary-toolbar">
          <label for="glossarySearch">Search glossary</label>
          <input id="glossarySearch" type="search" placeholder="Search terms">
        </div>
        <ul class="definition-list" id="glossaryList"></ul>
      </section>
    </div>
  `;

  const input = els.detail.querySelector("#glossarySearch");
  const list = els.detail.querySelector("#glossaryList");

  const draw = () => {
    const query = input.value.trim().toLowerCase();
    const items = Array.from(terms.values())
      .sort((a, b) => a.term.localeCompare(b.term))
      .filter((item) => !query || `${item.term} ${item.definition}`.toLowerCase().includes(query));
    list.innerHTML = items.map((item) => `
      <li>
        <span class="definition-term">${escapeHtml(item.term)}</span>
        <span>${escapeHtml(item.definition)}</span>
        <div class="muted">Lessons ${item.lessons.join(", ")}</div>
      </li>
    `).join("");
  };

  input.addEventListener("input", draw);
  draw();
}

function renderProgress() {
  const stats = courseStats();
  els.detail.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">Progress</p>
        <h2>${stats.percent}% complete</h2>
        <p class="muted">${stats.completed} of ${stats.total} lessons fully checked off.</p>
      </div>
      <button class="danger-button" type="button" id="resetAll">Reset all</button>
    </div>
    <div class="section-grid">
      <section class="section is-wide">
        <h3>Lesson status</h3>
        <ul class="progress-list">
          ${state.data.lessons.map((lesson) => {
            const progress = lessonProgress(lesson.day);
            const completion = completionFor(lesson.day);
            const flags = [progress.stuck ? "stuck" : "", progress.needsMaterials ? "needs materials" : ""].filter(Boolean);
            return `
              <li>
                <strong>Day ${lesson.day}: ${escapeHtml(lesson.title)}</strong>
                <div class="muted">${completion.done}/${completion.total} core complete${flags.length ? ` - ${flags.join(", ")}` : ""}</div>
              </li>
            `;
          }).join("")}
        </ul>
      </section>
    </div>
  `;

  els.detail.querySelector("#resetAll").addEventListener("click", () => {
    state.progress = {};
    saveProgress();
    render();
  });
}

function exportProgress() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "wiglessons",
    version: 1,
    progress: state.progress,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wiglessons-progress.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importProgress(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    state.progress = payload.progress || payload;
    saveProgress();
    render();
  } finally {
    event.target.value = "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
