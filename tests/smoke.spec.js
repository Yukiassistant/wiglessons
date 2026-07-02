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
  await page.getByLabel("Read lesson").check();
  await expect(page.getByText("1/5 core done").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lesson flags" })).toBeVisible();
  await page.getByLabel("Stuck on this").check();
  await expect(page.getByText("1/5 core done").first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole("button", { name: "Glossary" }).click();
  await page.getByPlaceholder("Search terms").fill("lace");
  await expect(page.getByText("lace front").first()).toBeVisible();

  const stored = await page.evaluate(() => localStorage.getItem("wiglessons.progress.v1"));
  expect(stored).toContain('"read":true');
  expect(errors).toEqual([]);
});
