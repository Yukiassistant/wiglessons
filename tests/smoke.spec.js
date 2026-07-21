const { test, expect } = require("@playwright/test");

test("wig lesson tracker renders, persists progress, and searches glossary", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Cosplay Wig Styling" })).toBeVisible();
  await expect(page.getByText("No wig, tools, materials, or purchases are required.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("0 of 90 lessons complete")).toBeVisible();
  await expect(page.getByText("5 min max").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "References" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key terms" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learning prompt" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ready when" })).toBeVisible();
  await expect(page.locator("#detail")).not.toContainText(
    /This course is now|micro-lesson|resource note|outside reading|large tutorial|web app|tracker|a few shared words|avoid drowning|shopping spiral|fun step|vague feeling|lesson plan/i,
  );
  await expect(page.locator("#detail .resource-list a")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Epic Cosplay: add wefting to a wig" })).toBeVisible();

  const exportBox = await page.locator("#exportButton").boundingBox();
  const importBox = await page.locator("label[for='importFile']").boundingBox();
  expect(exportBox).not.toBeNull();
  expect(importBox).not.toBeNull();
  expect(Math.abs(exportBox.y - importBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(exportBox.height - importBox.height)).toBeLessThanOrEqual(1);

  await expect(page.locator(".lesson-list")).toBeHidden();
  await page.getByLabel("Read lesson").check();
  await expect(page.locator("#detail").getByText("1/5 core done").first()).toBeVisible();
  await page.getByLabel("Completed learning prompt").check();
  await expect(page.locator("#detail").getByText("2/5 core done").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lesson flags" })).toBeVisible();
  await expect(page.getByLabel("Needs more explanation")).toBeVisible();
  await page.getByLabel("Stuck on this").check();
  await expect(page.locator("#detail").getByText("2/5 core done").first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole("tab", { name: "All lessons" }).click();
  await expect(page.getByRole("tab", { name: "All lessons" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "false");
  await expect(page.locator(".lesson-list")).toBeVisible();
  await expect(page.getByLabel("Jump to lesson")).toBeVisible();
  await expect(page.getByLabel("Jump to lesson").locator("option")).toHaveCount(90);
  await page.getByLabel("Jump to lesson").selectOption("1");
  await expect(page.getByRole("heading", { name: "Wig Anatomy First Look" })).toBeVisible();
  await expect(page.getByText("A wig has two main layers: the cap, which provides fit and structure")).toBeVisible();
  await expect(page.locator("#detail").getByRole("heading", { name: "Safety" })).toHaveCount(0);
  await expect(page.getByText("Epic Cosplay: wig hairline types compared")).toBeVisible();
  const detailTop = await page.locator("#detail").evaluate((node) => node.getBoundingClientRect().top);
  const mapTop = await page.locator(".lesson-list").evaluate((node) => node.getBoundingClientRect().top);
  expect(detailTop).toBeLessThan(mapTop);

  await page.getByRole("tab", { name: "Glossary" }).click();
  await expect(page.locator(".lesson-list")).toBeHidden();
  await page.getByPlaceholder("Search terms").fill("lace");
  await expect(page.locator("#glossaryList").getByText("lace front").first()).toBeVisible();

  const stored = await page.evaluate(() => localStorage.getItem("wiglessons.progress.v1"));
  expect(stored).toContain('"read":true');
  expect(errors).toEqual([]);
});

test("every lesson uses three direct, specific references", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const audit = await page.evaluate(async () => {
    const data = await fetch("./lessons.json").then((response) => response.json());
    const searchHosts = new Set(["bing.com", "duckduckgo.com", "google.com", "www.bing.com", "www.google.com"]);
    const broadPaths = new Set([
      "/blogs/tutorials", "/blogs/tutorials/tagged/iron-wig", "/blogs/tutorials/tutorial-master-list",
      "/pages/cosplay-wig-tutorials", "/pages/tips-and-tricks", "/pages/wigs",
    ]);
    const violations = [];
    for (const lesson of data.lessons) {
      if (lesson.requiredResources.length !== 3) violations.push(`Day ${lesson.day}: wrong reference count`);
      const urls = lesson.requiredResources.map((resource) => resource.url);
      if (new Set(urls).size !== urls.length) violations.push(`Day ${lesson.day}: duplicate reference`);
      for (const resource of lesson.requiredResources) {
        const url = new URL(resource.url);
        if (url.protocol !== "https:") violations.push(`Day ${lesson.day}: non-HTTPS URL`);
        if (searchHosts.has(url.hostname)) violations.push(`Day ${lesson.day}: search-engine URL`);
        if (broadPaths.has(url.pathname.replace(/\/$/, ""))) violations.push(`Day ${lesson.day}: broad hub URL`);
        if (/search results|tutorial hub|website search/i.test(resource.title)) {
          violations.push(`Day ${lesson.day}: generic reference title`);
        }
      }
    }
    return violations;
  });

  expect(audit).toEqual([]);
});

test("all lesson content remains ownership-neutral", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const audit = await page.evaluate(async () => {
    const data = await fetch("./lessons.json").then((response) => response.json());
    const forbidden = [
      /\bbuy(?:ing)?\b/i,
      /\bpurchase(?:s|d)?\b/i,
      /wig you own/i,
      /your wig/i,
      /your work head/i,
      /put on or imagine/i,
      /while wearing the wig/i,
      /buying a closer wig/i,
      /choose buy/i,
      /before using an expensive wig/i,
      /wig practice session/i,
      /for wig practice/i,
    ];
    const violations = [];
    for (const lesson of data.lessons) {
      const text = JSON.stringify(lesson);
      for (const pattern of forbidden) {
        if (pattern.test(text)) violations.push(`Day ${lesson.day}: ${pattern}`);
      }
    }
    return {
      description: data.course.description,
      startDate: data.course.startDate,
      lessonCount: data.lessons.length,
      violations,
    };
  });

  expect(audit.lessonCount).toBe(90);
  expect(audit.startDate).toBe("2026-07-20");
  expect(audit.description).toContain("No wig, tools, materials, or purchases are required.");
  expect(audit.violations).toEqual([]);
});

test("safety guidance appears only for audited hazard lessons", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const audit = await page.evaluate(async () => {
    const data = await fetch("./lessons.json").then((response) => response.json());
    const byDay = Object.fromEntries(data.lessons.map((lesson) => [lesson.day, lesson]));
    return {
      safetyDays: data.lessons.filter((lesson) => lesson.safety).map((lesson) => lesson.day),
      samples: Object.fromEntries([1, 16, 19, 29, 43, 69, 77, 80].map((day) => [day, byDay[day].safety])),
      blanketCount: data.lessons.filter((lesson) => /observation and planning only/i.test(lesson.safety)).length,
    };
  });

  expect(audit.safetyDays).toEqual([
    11, 14, 15, 16, 17, 19, 20, 24, 26, 27, 29, 31, 32, 33, 35, 36, 41, 42, 43, 44, 45, 49, 50, 51,
    56, 57, 58, 61, 63, 65, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 83, 84, 85,
  ]);
  expect(audit.samples[1]).toBe("");
  expect(audit.samples[16]).toMatch(/heat|melt|burn/i);
  expect(audit.samples[19]).toMatch(/steam|burn/i);
  expect(audit.samples[29]).toMatch(/shears|cut/i);
  expect(audit.samples[43]).toMatch(/adhesive|skin/i);
  expect(audit.samples[69]).toMatch(/color|fumes|ventilat/i);
  expect(audit.samples[77]).toMatch(/wire|pokes|pressure/i);
  expect(audit.samples[80]).toMatch(/heat|breathing|vision/i);
  expect(audit.blanketCount).toBe(0);

  await page.getByRole("tab", { name: "All lessons" }).click();
  await page.getByLabel("Jump to lesson").selectOption("16");
  await expect(page.locator("#detail").getByRole("heading", { name: "Safety" })).toBeVisible();
  await expect(page.locator("#detail").getByText(audit.samples[16])).toBeVisible();
});

test("legacy progress migrates to the ownership-neutral checklist", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.addInitScript(() => {
    localStorage.setItem("wiglessons.progress.v1", JSON.stringify({
      1: {
        checks: { read: true, definitions: true, resource: true, practice: true, ready: true },
        notes: "Legacy progress",
        stuck: false,
        needsMaterials: true,
      },
    }));
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "All lessons" }).click();
  await page.getByLabel("Jump to lesson").selectOption("1");

  await expect(page.getByLabel("Completed learning prompt")).toBeChecked();
  await expect(page.getByLabel("Needs more explanation")).not.toBeChecked();
  await expect(page.locator("#detail .status-pill")).toHaveText("Complete");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("wiglessons.progress.v1")));
  expect(stored[1].checks.learningPrompt).toBe(true);
  expect(stored[1].checks.practice).toBeUndefined();
  expect(stored[1].needsExplanation).toBe(false);
  expect(stored[1].needsMaterials).toBe(true);
});

test("legacy imported backups migrate before rendering", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.locator("#importFile").setInputFiles({
    name: "legacy-progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      app: "wiglessons",
      version: 1,
      progress: {
        1: {
          checks: { read: true, definitions: true, resource: true, practice: true, ready: true },
          notes: "Imported legacy progress",
          stuck: false,
          needsMaterials: true,
        },
      },
    })),
  });

  await page.getByRole("tab", { name: "All lessons" }).click();
  await page.getByLabel("Jump to lesson").selectOption("1");
  await expect(page.getByLabel("Completed learning prompt")).toBeChecked();
  await expect(page.getByLabel("Needs more explanation")).not.toBeChecked();
  await expect(page.locator("#detail .status-pill")).toHaveText("Complete");
});

test("loaded progress survives a migration persistence failure", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.addInitScript(() => {
    localStorage.setItem("wiglessons.progress.v1", JSON.stringify({
      1: {
        checks: { read: true, definitions: true, resource: true, practice: true, ready: true },
        notes: "Keep this progress visible",
        stuck: false,
        needsMaterials: false,
      },
    }));
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage is read-only", "QuotaExceededError");
    };
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "All lessons" }).click();
  await page.getByLabel("Jump to lesson").selectOption("1");
  await expect(page.getByLabel("Completed learning prompt")).toBeChecked();
  await expect(page.getByLabel("Lesson notes")).toHaveValue("Keep this progress visible");
});

for (const width of [320, 390, 768, 1440, 1728]) {
  test(`layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1000 });
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    for (const view of ["Today", "All lessons", "Glossary", "Progress"]) {
      await page.getByRole("tab", { name: view, exact: true }).click();
      await expect.poll(async () => page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      )).toBe(true);
    }

    await page.getByRole("tab", { name: "All lessons" }).click();
    const detailBox = await page.locator("#detail").boundingBox();
    const mapBox = await page.locator(".lesson-list").boundingBox();
    expect(detailBox).not.toBeNull();
    expect(mapBox).not.toBeNull();

    if (width <= 940) {
      expect(detailBox.y).toBeLessThan(mapBox.y);
    } else {
      expect(mapBox.x).toBeLessThan(detailBox.x);
      expect(Math.abs(mapBox.y - detailBox.y)).toBeLessThanOrEqual(1);
    }
  });
}

test("mobile controls keep usable targets and reduced motion is honored", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.getByRole("tab", { name: "Today" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "All lessons" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "All lessons" })).toHaveAttribute("aria-selected", "true");

  for (const selector of ["#exportButton", "label[for='importFile']", ".tab", ".check-item"]) {
    const boxes = await page.locator(selector).evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    expect(boxes.every((box) => box.width >= 44 && box.height >= 44)).toBe(true);
  }

  const transitionDuration = await page.locator(".progress-track span").evaluate(
    (node) => getComputedStyle(node).transitionDuration,
  );
  expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.00001);
});

test("interface choice persists without changing lesson progress", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const interfaceStyle = page.getByLabel("Interface style");
  await expect(interfaceStyle).toHaveValue("atelier");
  await expect(page.locator("#atelierStyles")).not.toHaveJSProperty("disabled", true);
  await expect(page.locator("#classicStyles")).toHaveJSProperty("disabled", true);
  await expect(page.getByText("90-day styling atelier")).toBeVisible();

  await page.getByLabel("Read lesson").check();
  await page.getByLabel("Lesson notes").fill("Shared between interface styles.");
  await page.getByRole("button", { name: "Save notes" }).click();
  const progressBeforeSwitch = await page.evaluate(() => localStorage.getItem("wiglessons.progress.v1"));

  await interfaceStyle.selectOption("classic");
  await expect(page.locator("#atelierStyles")).toHaveJSProperty("disabled", true);
  await expect(page.locator("#classicStyles")).not.toHaveJSProperty("disabled", true);
  await expect(page.getByText("90 days - 5 minutes each")).toBeVisible();
  await expect(page.getByText("Current pace")).toBeVisible();
  await expect(page.locator("#detail .status-pill")).toHaveText("1/5 core done");
  await expect(page.locator("#detail .mini-status")).toHaveText("1/5 core done");
  await expect(page.getByLabel("Lesson notes")).toHaveValue("Shared between interface styles.");
  await expect.poll(() => page.evaluate(
    () => localStorage.getItem("wiglessons.interface.v1"),
  )).toBe("classic");
  expect(await page.evaluate(() => localStorage.getItem("wiglessons.progress.v1"))).toBe(progressBeforeSwitch);

  const classicMark = await page.locator(".brand-mark").evaluate((node) => {
    const style = getComputedStyle(node);
    return { width: style.width, borderRadius: style.borderRadius };
  });
  expect(classicMark).toEqual({ width: "58px", borderRadius: "18px" });

  await page.reload({ waitUntil: "networkidle" });
  await expect(interfaceStyle).toHaveValue("classic");
  await expect(page.locator("#classicStyles")).not.toHaveJSProperty("disabled", true);
  await expect(page.getByLabel("Read lesson")).toBeChecked();
  await expect(page.getByLabel("Lesson notes")).toHaveValue("Shared between interface styles.");

  await interfaceStyle.selectOption("atelier");
  await expect(page.getByText("90-day styling atelier")).toBeVisible();
  await expect(page.locator("#detail .status-pill")).toHaveText("1/5 core done");
  await expect(page.locator("#detail .mini-status")).toHaveCount(0);
  const atelierMark = await page.locator(".brand-mark").evaluate((node) => {
    const style = getComputedStyle(node);
    return { width: style.width, borderRadius: style.borderRadius };
  });
  expect(atelierMark).toEqual({ width: "46px", borderRadius: "50%" });
});

for (const width of [320, 1440]) {
  test(`classic interface has no horizontal overflow at ${width}px`, async ({ page }) => {
    const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1000 });
    await page.addInitScript(() => {
      localStorage.setItem("wiglessons.interface.v1", "classic");
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    for (const view of ["Today", "All lessons", "Glossary", "Progress"]) {
      await page.getByRole("tab", { name: view, exact: true }).click();
      await expect.poll(async () => page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      )).toBe(true);
    }
  });
}

test("lesson navigation, notes, backup, import, and reset remain intact", async ({ page }) => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.getByRole("tab", { name: "All lessons" }).click();
  await page.getByLabel("Jump to lesson").selectOption("30");
  await expect(page.getByRole("heading", { name: "Stand View Versus Worn View" })).toBeVisible();
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.getByRole("heading", { name: "Point Cutting Idea" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to next lesson" }).click();
  await expect(page.getByRole("heading", { name: "Stand View Versus Worn View" })).toBeVisible();

  await page.getByLabel("Lesson notes").fill("Check the silhouette before cutting.");
  await page.getByRole("button", { name: "Save notes" }).click();
  await expect.poll(() => page.evaluate(
    () => localStorage.getItem("wiglessons.progress.v1"),
  )).toContain("Check the silhouette before cutting.");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("wiglessons-progress.json");

  const completeChecks = {
    read: true,
    definitions: true,
    resource: true,
    learningPrompt: true,
    ready: true,
  };
  await page.locator("#importFile").setInputFiles({
    name: "progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      app: "wiglessons",
      version: 1,
      progress: {
        1: { checks: completeChecks, notes: "Imported note", stuck: true, needsExplanation: false },
      },
    })),
  });
  await page.getByRole("tab", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "1% complete" })).toBeVisible();
  await expect(page.getByText("5/5 core complete - stuck")).toBeVisible();

  await page.getByRole("button", { name: "Reset all" }).click();
  await expect(page.getByRole("heading", { name: "0% complete" })).toBeVisible();
  await expect.poll(() => page.evaluate(
    () => localStorage.getItem("wiglessons.progress.v1"),
  )).toBe("{}");
});
