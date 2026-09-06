import type { Page } from "playwright";
import { mkdir, writeFile } from "fs/promises";

const DEBUG_DIR = "debug-output";
let dirReady = false;

async function ensureDir() {
  if (!dirReady) {
    await mkdir(DEBUG_DIR, { recursive: true });
    dirReady = true;
  }
}

// Saves a screenshot + the page's real HTML so a human can see exactly what
// the automation saw. This is how we get REAL selectors instead of guessing —
// download these from the GitHub Actions run's "Artifacts" section and share
// them, and the actual element names/IDs can be read straight out of the HTML.
export async function captureDebugSnapshot(page: Page, label: string) {
  try {
    await ensureDir();
    await page.screenshot({ path: `${DEBUG_DIR}/${label}.png`, fullPage: true });
    const html = await page.content();
    await writeFile(`${DEBUG_DIR}/${label}.html`, html, "utf8");
  } catch (err) {
    // A failed debug capture should never take down the actual run.
    console.warn(`Could not capture debug snapshot "${label}":`, err);
  }
}
