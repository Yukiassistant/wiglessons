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

  await page.getByRole("button", { name: "All lessons" }).click();
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

  await page.getByRole("button", { name: "Glossary" }).click();
  await expect(page.locator(".lesson-list")).toBeHidden();
  await page.getByPlaceholder("Search terms").fill("lace");
  await expect(page.locator("#glossaryList").getByText("lace front").first()).toBeVisible();

  const stored = await page.evaluate(() => localStorage.getItem("wiglessons.progress.v1"));
  expect(stored).toContain('"read":true');
  expect(errors).toEqual([]);
});
