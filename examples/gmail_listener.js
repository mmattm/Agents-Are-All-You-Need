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

    await page.goto('https://gmail.com');
    await page.evaluate(async (cdnURL) => {
        // add cdn script
        const script = document.createElement('script');
        script.src = cdnURL;

        const loaded = new Promise((resolve, reject) => {
            window.addEventListener('DOMContentLoaded', () => {
                script.onload = () => {
                    window.gmail = new Gmail();
                    resolve();
                }
                document.head.appendChild(script);
            }, { once: true });
        });
        // wait load
        await loaded
    }, "https://unpkg.com/gmail-js@1.0.15/src/gmail.js");

    await page.evaluate(async () => {
        window.gmail.observe.on("load", () => {
            console.log("test");
        });
        window.gmail.observe.on("new_email", (id, url, body, xhr) => {
            console.log("id:", id, "url:", url, 'body', body, 'xhr', xhr);
        })
    });
}

init();

