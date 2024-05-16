import { setPuppeteer, newWindow, animate, findClosestElement } from "../utils.js";
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

    const { page, browser } = puppeteer;

    await page.goto("https://www.google.com/maps");


    const btnSelector = "#gb_70"
    await page.waitForSelector(btnSelector);
    // await page.click(btnSelector);

    const btn = await page.$(btnSelector)

    const pos = await getScreenPosition(btn);
    robot.moveMouseSmooth(pos.screenX, pos.screenY, 1);
    robot.mouseClick();
    console.log('clicked');
}

init();

async function getScreenPosition(element) {
    return await element.evaluate(elem => {
        const bounds = elem.getBoundingClientRect();
        // get center coordinates
        const x = bounds.x + bounds.width / 2;
        const y = bounds.y + bounds.height / 2;
        // get screen coordinates
        const headHeight = window.outerHeight - window.innerHeight;
        const screenX = window.screenX + x;
        const screenY = window.screenY + y + headHeight;

        return { screenX, screenY }
    });
}