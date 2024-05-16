import { setPuppeteer, sleep, zoomTo } from "../utils.js";
import robot from "robotjs";

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

    await page.goto('https://www.ecal.ch');


    await zoomTo(page, 200)
    await sleep(200);
    await zoomTo(page, 100, { duration: 0.5 }) // zoom out to 100% in 0.5 seconds

}

init();

