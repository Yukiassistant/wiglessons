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
  await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("0 of 90 lessons complete")).toBeVisible();
  await expect(page.getByText("5 min max").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "References" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key terms" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ready when" })).toBeVisible();
  await expect(page.locator("#detail")).not.toContainText(
    /This course is now|micro-lesson|resource note|outside reading|large tutorial|web app|tracker|a few shared words|avoid drowning|shopping spiral|fun step|vague feeling|lesson plan/i,
  );
  await expect(page.locator("#detail .resource-list a")).toHaveCount(3);
  await expect(page.getByRole("link", { name: /^Reference images:/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /guide|hub/i })).toBeVisible();

  const exportBox = await page.locator("#exportButton").boundingBox();
  const importBox = await page.locator("label[for='importFile']").boundingBox();
  expect(exportBox).not.toBeNull();
  expect(importBox).not.toBeNull();
  expect(Math.abs(exportBox.y - importBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(exportBox.height - importBox.height)).toBeLessThanOrEqual(1);

  await expect(page.locator(".lesson-list")).toBeHidden();
  await page.getByLabel("Read lesson").check();
  await expect(page.locator("#detail").getByText("1/5 core done").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lesson flags" })).toBeVisible();
  await page.getByLabel("Stuck on this").check();
  await expect(page.locator("#detail").getByText("1/5 core done").first()).toBeVisible();

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
  await expect(page.getByText("Before styling, separate the base wig from the hair surface.")).toBeVisible();
  await expect(page.getByText("Reference images: Wig Anatomy First Look")).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Check On The Head" })).toBeVisible();
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.getByRole("heading", { name: "Point Cutting Idea" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to next lesson" }).click();
  await expect(page.getByRole("heading", { name: "Check On The Head" })).toBeVisible();

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
    practice: true,
    ready: true,
  };
  await page.locator("#importFile").setInputFiles({
    name: "progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      app: "wiglessons",
      version: 1,
      progress: {
        1: { checks: completeChecks, notes: "Imported note", stuck: true, needsMaterials: false },
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
