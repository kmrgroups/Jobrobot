import { chromium } from "playwright";
import { fetchRunsForPortal } from "./apiClient.js";
import { runLinkedIn } from "./portals/linkedin.js";
import { runNaukri } from "./portals/naukri.js";

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const [linkedinRuns, naukriRuns] = await Promise.all([
      fetchRunsForPortal("LINKEDIN"),
      fetchRunsForPortal("NAUKRI"),
    ]);

    console.log(`Found ${linkedinRuns.length} LinkedIn users, ${naukriRuns.length} Naukri users to process.`);

    // Run sequentially, not in parallel — parallel logins from one GitHub
    // Actions IP look far more automated and increase suspension risk.
    for (const user of linkedinRuns) {
      await runLinkedIn(browser, user);
    }
    for (const user of naukriRuns) {
      await runNaukri(browser, user);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Worker run failed:", err);
  process.exit(1);
});
