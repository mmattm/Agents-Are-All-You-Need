import { setPuppeteer } from "../utils.js";

(async () => {
  const { page } = await setPuppeteer();
  await page.goto("https://google.com");
})();
