import { setPuppeteer, newWindow, animate } from "../utils.js";

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

        await win2.setBounds({ top: width, left: width, width: width, height: 500 });
        width += 5;

        return time < 3 * 1000; // stop after 3 seconds (true to continue, false to stop)
    });


    // await win2.setBounds({ windowState: 'fullscreen' });
    // await browser.close();

}

init();