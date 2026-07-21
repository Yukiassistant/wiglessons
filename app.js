const STORAGE_KEY = "wiglessons.progress.v1";
const INTERFACE_STORAGE_KEY = "wiglessons.interface.v1";
const CHECKS = [
  ["read", "Read lesson"],
  ["definitions", "Reviewed definitions"],
  ["resource", "Opened one reference"],
  ["learningPrompt", "Completed learning prompt"],
  ["ready", "Ready to move on"],
];

const state = {
  data: null,
  progress: {},
  selectedDay: 1,
  view: "today",
  search: "",
  interface: loadInterfacePreference(),
};

const els = {
  detail: document.querySelector("#detail"),
  atelierStyles: document.querySelector("#atelierStyles"),
  brandEyebrow: document.querySelector("#brandEyebrow"),
  classicStyles: document.querySelector("#classicStyles"),
  courseDescription: document.querySelector("#courseDescription"),
  exportButton: document.querySelector("#exportButton"),
  importFile: document.querySelector("#importFile"),
  interfaceStyle: document.querySelector("#interfaceStyle"),
  lessonList: document.querySelector("#lessonList"),
  lessonSearch: document.querySelector("#lessonSearch"),
  progressFill: document.querySelector("#progressFill"),
  progressNumber: document.querySelector("#progressNumber"),
  progressText: document.querySelector("#progressText"),
  overviewEyebrow: document.querySelector("#overviewEyebrow"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  todaySummary: document.querySelector("#todaySummary"),
  themeColor: document.querySelector("#themeColor"),
  workspace: document.querySelector("#workspace"),
};

init();

async function init() {
  applyInterface();
  state.progress = loadProgress();
  const response = await fetch("lessons.json");
  state.data = await response.json();
  els.courseDescription.textContent = state.data.course.description;
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
    button.addEventListener("keydown", (event) => {
      const currentIndex = els.tabs.indexOf(button);
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % els.tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + els.tabs.length) % els.tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = els.tabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      els.tabs[nextIndex].focus();
      els.tabs[nextIndex].click();
    });
  });

  els.lessonSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderLessonList();
  });

  els.interfaceStyle.addEventListener("change", (event) => {
    state.interface = event.target.value === "classic" ? "classic" : "atelier";
    localStorage.setItem(INTERFACE_STORAGE_KEY, state.interface);
    applyInterface();
    renderDetail();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateThemeColor);

  els.exportButton.addEventListener("click", exportProgress);
  els.importFile.addEventListener("change", importProgress);
}

function loadInterfacePreference() {
  try {
    return localStorage.getItem(INTERFACE_STORAGE_KEY) === "classic" ? "classic" : "atelier";
  } catch {
    return "atelier";
  }
}

function applyInterface() {
  const isClassic = state.interface === "classic";
  document.documentElement.dataset.interface = state.interface;
  document.body.dataset.interface = state.interface;
  els.atelierStyles.disabled = isClassic;
  els.classicStyles.disabled = !isClassic;
  els.interfaceStyle.value = state.interface;
  els.brandEyebrow.textContent = isClassic ? "90 days - 5 minutes each" : "90-day styling atelier";
  els.overviewEyebrow.textContent = isClassic ? "Current pace" : "Your course notebook";
  updateThemeColor();
}

function updateThemeColor() {
  if (state.interface === "classic") {
    els.themeColor.content = "#f47b38";
    return;
  }
  els.themeColor.content = window.matchMedia("(prefers-color-scheme: dark)").matches ? "#19151a" : "#f7f1e8";
}

function loadProgress() {
  let progress;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    progress = migrateProgress(JSON.parse(stored));
  } catch {
    return {};
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Keep using valid loaded progress if storage is temporarily read-only or full.
  }
  return progress;
}

function migrateProgress(rawProgress) {
  if (!rawProgress || typeof rawProgress !== "object" || Array.isArray(rawProgress)) return {};

  return Object.fromEntries(Object.entries(rawProgress).map(([day, rawLesson]) => {
    if (!rawLesson || typeof rawLesson !== "object" || Array.isArray(rawLesson)) {
      return [day, rawLesson];
    }

    const lesson = { ...rawLesson };
    const checks = lesson.checks && typeof lesson.checks === "object" && !Array.isArray(lesson.checks)
      ? { ...lesson.checks }
      : {};
    if (!("learningPrompt" in checks) && "practice" in checks) {
      checks.learningPrompt = Boolean(checks.practice);
    }
    delete checks.practice;
    lesson.checks = checks;

    if (!("needsExplanation" in lesson)) lesson.needsExplanation = false;
    return [day, lesson];
  }));
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  renderOverview();
  renderLessonList();
}

function lessonProgress(day) {
  if (!state.progress[day]) {
    state.progress[day] = { checks: {}, notes: "", stuck: false, needsExplanation: false };
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
  document.body.dataset.view = state.view;
  els.workspace.classList.toggle("has-lesson-map", state.view === "lessons");
  els.tabs.forEach((button) => {
    const isActive = button.dataset.view === state.view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
  const selectedTab = els.tabs.find((button) => button.dataset.view === state.view);
  els.detail.setAttribute("aria-labelledby", selectedTab.id);
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
      if (window.matchMedia("(max-width: 940px)").matches) {
        els.detail.scrollIntoView({ block: "start" });
      }
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
  const lessonModeLabel = state.view === "today" ? "Today" : "Selected lesson";
  const estimatedMinutes = lesson.estimatedMinutes || state.data.course.estimatedMinutes || 5;
  const requiredResourceSection = lesson.requiredResources?.length
    ? `
      <section class="section">
        <h3>References</h3>
        ${resourceList(lesson.requiredResources)}
      </section>
    `
    : "";
  const optionalResourceSection = lesson.optionalResources?.length
    ? `
      <section class="section">
        <h3>Extra references</h3>
        ${resourceList(lesson.optionalResources)}
      </section>
    `
    : "";
  const safetySection = lesson.safety
    ? `
      <section class="section">
        <h3>Safety</h3>
        <p>${escapeHtml(lesson.safety)}</p>
      </section>
    `
    : "";
  const lessonPicker = state.view === "lessons"
    ? `
        <label class="lesson-picker" for="lessonPicker">
          <span>Jump to lesson</span>
          <select id="lessonPicker">
            ${state.data.lessons.map((item) => `
              <option value="${item.day}" ${item.day === lesson.day ? "selected" : ""}>
                Day ${item.day}: ${escapeHtml(item.title)}
              </option>
            `).join("")}
          </select>
        </label>
      `
    : "";

  els.detail.innerHTML = `
    <header class="detail-header">
      <div>
        <p class="eyebrow">${lessonModeLabel} - Day ${lesson.day}</p>
        <h2 id="lessonTitle">${escapeHtml(lesson.title)}</h2>
        <p class="muted">${escapeHtml(lesson.objective)}</p>
        <p class="time-pill">${estimatedMinutes} min max</p>
        ${lessonPicker}
        <div class="lesson-actions" aria-label="Lesson navigation">
          <button class="ghost-button" type="button" id="previousLesson" ${lesson.day === 1 ? "disabled" : ""}>Previous</button>
          <button class="primary-button" type="button" id="nextLesson" ${lesson.day === state.data.lessons.length ? "disabled" : ""}>${state.interface === "classic" ? "Next lesson" : "Continue to next lesson"}</button>
        </div>
      </div>
      <span class="status-pill">${completion.complete ? "Complete" : `${completion.done}/${completion.total} core done`}</span>
    </header>
    <div class="section-grid">
      <section class="section is-wide">
        <div class="checklist-header">
          <div>
            <h3>Completion checklist</h3>
            <p class="muted">These core items count toward lesson progress.</p>
          </div>
          ${state.interface === "classic" ? `<span class="mini-status">${completion.done}/${completion.total} core done</span>` : ""}
        </div>
        <div class="checklist" aria-label="Completion checklist">
          ${CHECKS.map(([key, label]) => checkRow(lesson.day, key, label, progress.checks?.[key])).join("")}
        </div>
        <div class="flag-group" aria-label="Lesson flags">
          <div>
            <h3>Lesson flags</h3>
            <p class="muted">Use these reminders without changing core progress.</p>
          </div>
          <div class="flag-list">
            ${checkRow(lesson.day, "stuck", "Stuck on this", progress.stuck, "flag")}
            ${checkRow(lesson.day, "needsExplanation", "Needs more explanation", progress.needsExplanation, "flag")}
          </div>
        </div>
      </section>
      <section class="section is-wide">
        <h3>Concept</h3>
        <p>${escapeHtml(lesson.concept)}</p>
      </section>
      <section class="section is-wide">
        <h3>Key terms</h3>
        <ul class="definition-list">
          ${lesson.glossary.map((item) => definitionItem(item)).join("")}
        </ul>
      </section>
      ${requiredResourceSection}
      ${optionalResourceSection}
      <section class="section">
        <h3>Learning prompt</h3>
        <p>${escapeHtml(lesson.practice)}</p>
      </section>
      ${safetySection}
      <section class="section">
        <h3>Reflection</h3>
        <p>${escapeHtml(lesson.reflection)}</p>
      </section>
      <section class="section">
        <h3>Ready when</h3>
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

  els.detail.querySelector("#lessonPicker")?.addEventListener("change", (event) => {
    state.selectedDay = Number(event.target.value);
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
  if (!resources.length) {
    return "";
  }

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
    <header class="detail-header">
      <div>
        <p class="eyebrow">Reference</p>
        <h2>Glossary</h2>
        <p class="muted">${terms.size} terms across the course.</p>
      </div>
    </header>
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
    <header class="detail-header">
      <div>
        <p class="eyebrow">${state.interface === "classic" ? "Progress" : "Course record"}</p>
        <h2>${stats.percent}% complete</h2>
        <p class="muted">${stats.completed} of ${stats.total} lessons fully checked off.</p>
      </div>
      <button class="danger-button" type="button" id="resetAll">Reset all</button>
    </header>
    <div class="section-grid">
      <section class="section is-wide">
        <h3>Lesson status</h3>
        <ul class="progress-list">
          ${state.data.lessons.map((lesson) => {
            const progress = lessonProgress(lesson.day);
            const completion = completionFor(lesson.day);
            const flags = [progress.stuck ? "stuck" : "", progress.needsExplanation ? "needs more explanation" : ""].filter(Boolean);
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
    state.progress = migrateProgress(payload.progress || payload);
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
