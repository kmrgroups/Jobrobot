import type { Browser } from "playwright";
import type { RunUser } from "../apiClient.js";
import { computeMatchScore } from "../matchScore.js";
import { reportApplication } from "../apiClient.js";

const MATCH_THRESHOLD = 70;

// LinkedIn detects and can suspend accounts for scripted login/apply
// behavior. This stub adds randomized delays between actions as a baseline
// precaution, but that does not eliminate the risk — see README.
function randomDelay(minMs = 1500, maxMs = 4000) {
  return new Promise((r) => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
}

export async function runLinkedIn(browser: Browser, user: RunUser) {
  const page = await browser.newPage();

  try {
    await page.goto("https://www.linkedin.com/login");
    // TODO: verify these selectors against the live login page — LinkedIn
    // changes field names/ids periodically.
    await page.fill("#username", user.username);
    await page.fill("#password", user.password);
    await randomDelay();
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // TODO: LinkedIn may present a CAPTCHA or 2FA/checkpoint here. Detect it
    // (e.g. by URL containing "checkpoint") and bail out gracefully rather
    // than getting stuck — this needs a human, not a script.
    if (page.url().includes("checkpoint")) {
      console.warn(`LinkedIn checkpoint hit for user ${user.userId}, skipping this run.`);
      return;
    }

    for (const role of user.profile.desiredRoles) {
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}`;
      await page.goto(searchUrl);
      await randomDelay();

      // TODO: replace with the real job-card selector from LinkedIn's jobs
      // search results page.
      const jobCards = await page.$$('[data-job-id]');

      for (const card of jobCards) {
        await card.click();
        await randomDelay();

        // TODO: replace with real selectors for title/company/location/JD text
        const title = (await page.textContent(".job-title-selector")) ?? "";
        const company = (await page.textContent(".company-name-selector")) ?? "";
        const location = (await page.textContent(".location-selector")) ?? "";
        const jobDescription = (await page.textContent(".job-description-selector")) ?? "";
        const jobUrl = page.url();

        const matchScore = computeMatchScore(user.profile, jobDescription, title);

        if (matchScore >= MATCH_THRESHOLD) {
          // TODO: replace with LinkedIn's actual "Easy Apply" button/flow.
          // Multi-step application forms (screening questions) need
          // additional handling beyond a single click.
          const applyButton = await page.$('button:has-text("Easy Apply")');
          if (applyButton) {
            await applyButton.click();
            await randomDelay();
            // TODO: submit the application form here.

            await reportApplication({
              userId: user.userId,
              portal: "LINKEDIN",
              company,
              title,
              location,
              jobUrl,
              matchScore,
              status: "APPLIED",
            });
          }
        } else {
          await reportApplication({
            userId: user.userId,
            portal: "LINKEDIN",
            company,
            title,
            location,
            jobUrl,
            matchScore,
            status: "SKIPPED_LOW_SCORE",
          });
        }

        await randomDelay();
      }
    }
  } catch (err) {
    console.error(`LinkedIn run failed for user ${user.userId}:`, err);
  } finally {
    await page.close();
  }
}
