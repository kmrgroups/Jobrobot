import type { Browser } from "playwright";
import type { RunUser } from "../apiClient.js";
import { computeMatchScore } from "../matchScore.js";
import { reportApplication } from "../apiClient.js";

const MATCH_THRESHOLD = 70;

function randomDelay(minMs = 1500, maxMs = 4000) {
  return new Promise((r) => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
}

export async function runNaukri(browser: Browser, user: RunUser) {
  const page = await browser.newPage();

  try {
    await page.goto("https://www.naukri.com/nlogin/login");
    // TODO: verify against the live login form.
    await page.fill("#usernameField", user.username);
    await page.fill("#passwordField", user.password);
    await randomDelay();
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    for (const role of user.profile.desiredRoles) {
      const searchUrl = `https://www.naukri.com/${encodeURIComponent(role.replace(/\s+/g, "-"))}-jobs`;
      await page.goto(searchUrl);
      await randomDelay();

      // TODO: replace with the real job-card selector on Naukri's search results.
      const jobCards = await page.$$(".jobTuple");

      for (const card of jobCards) {
        const title = (await card.$eval(".title", (el) => el.textContent)) ?? "";
        const company = (await card.$eval(".comp-name", (el) => el.textContent)) ?? "";
        const location = (await card.$eval(".locWdth", (el) => el.textContent)) ?? "";
        const jobUrl = (await card.$eval("a.title", (el) => el.getAttribute("href"))) ?? page.url();
        // TODO: open the card to get the full JD text; list view usually only
        // has a short snippet.
        const jobDescriptionSnippet = (await card.$eval(".job-description", (el) => el.textContent)) ?? "";

        const matchScore = computeMatchScore(user.profile, jobDescriptionSnippet, title || "");

        if (matchScore >= MATCH_THRESHOLD) {
          // TODO: Naukri's one-click "Apply" button selector + handling for
          // any follow-up screening questions it presents.
          const applyButton = await card.$('button:has-text("Apply")');
          if (applyButton) {
            await applyButton.click();
            await randomDelay();

            await reportApplication({
              userId: user.userId,
              portal: "NAUKRI",
              company: company || "",
              title: title || "",
              location: location || "",
              jobUrl,
              matchScore,
              status: "APPLIED",
            });
          }
        } else {
          await reportApplication({
            userId: user.userId,
            portal: "NAUKRI",
            company: company || "",
            title: title || "",
            location: location || "",
            jobUrl,
            matchScore,
            status: "SKIPPED_LOW_SCORE",
          });
        }

        await randomDelay();
      }
    }
  } catch (err) {
    console.error(`Naukri run failed for user ${user.userId}:`, err);
  } finally {
    await page.close();
  }
}
