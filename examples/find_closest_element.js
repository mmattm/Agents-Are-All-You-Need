import { setPuppeteer, sleep, newWindow, findClosestElement } from "../utils.js";

async function init() {

    const puppeteer = await setPuppeteer({
        puppeteerOptions: {
            devtools: false
        },
        args: [
            `--use-fake-ui-for-media-stream`,
            `--no-sandbox`,
        ],
    });

    const { browser, page } = puppeteer;

    await page.goto("https://www.google.com");

    const btn = await findClosestElement(page, {
        cssSelector: 'body input',
        containText: 'Google suche' // or html
    });

    await btn.click();
}

init();