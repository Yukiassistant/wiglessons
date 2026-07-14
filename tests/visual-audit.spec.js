const path = require("path");
const { test, expect } = require("@playwright/test");

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  ".codex-ui-audit/screenshots/gpt56-remodel-agent",
);

const viewports = {
  mobile: { width: 390, height: 900 },
  desktop: { width: 1440, height: 1000 },
};

const views = [
  ["today", "Today"],
  ["all-lessons-dense", "All lessons"],
  ["glossary", "Glossary"],
  ["progress", "Progress"],
];

function denseProgress() {
  const progress = {};
  for (let day = 1; day <= 90; day += 1) {
    const completed = day <= 18;
    const partial = day > 18 && day <= 32;
    progress[day] = {
      checks: {
        read: completed || partial,
        definitions: completed || (partial && day % 2 === 0),
        resource: completed,
        practice: completed,
        ready: completed,
      },
      notes: day === 20 ? "Compare edge control and silhouette before the next practice session." : "",
      stuck: day === 23,
      needsMaterials: day === 27,
    };
  }
  return progress;
}

for (const [viewportName, viewport] of Object.entries(viewports)) {
  for (const colorScheme of ["light", "dark"]) {
    for (const [slug, tabName] of views) {
      test(`${viewportName} ${colorScheme} ${slug}`, async ({ page }) => {
        const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4177";
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme });
        await page.addInitScript((progress) => {
          localStorage.setItem("wiglessons.progress.v1", JSON.stringify(progress));
        }, denseProgress());
        await page.goto(baseUrl, { waitUntil: "networkidle" });
        await page.getByRole("tab", { name: tabName, exact: true }).click();

        if (slug === "all-lessons-dense") {
          await page.getByLabel("Jump to lesson").selectOption("30");
        }

        await expect(page.locator("#detail")).toBeVisible();
        await expect.poll(async () => page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        )).toBe(true);

        await page.screenshot({
          path: path.join(OUTPUT_DIR, `${viewportName}__${colorScheme}__${slug}.png`),
          fullPage: true,
        });
      });
    }
  }
}
