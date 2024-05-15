import { setPuppeteer, newWindow } from "../utils.js";

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
    page.close();

    const win2 = await newWindow(browser);

    await win2.page.goto("https://google.com");

    let width = 100;
    await animate(async ({ time, frameCount }) => {

        await win2.setBounds({ top: 0, left: 0, width: width += 10, height: 500 });
        return time < 3 * 1000; // stop after 3 seconds (true to continue, false to stop)
    });

    await browser.close();

}

init();

function animate(fn, { fps = 60, customData = {} } = {}) {
    return new Promise((resolve) => {
        const start = Date.now();
        let frame;
        let frameCount = 0;
        let interval = 1000 / fps;

        const update = async () => {
            const time = Date.now() - start;
            const playing = await fn({ time, frameCount, customData });
            frameCount++;
            if (playing) return setTimeout(update, interval);
            resolve();
        }

        update();
    })
}