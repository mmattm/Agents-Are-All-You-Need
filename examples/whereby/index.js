import { setPuppeteer, sleep, newWindow } from "../../utils.js";
import { useScreenshare } from "./screenshare.js";

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

    const { browser, page: whereby } = puppeteer;

    const { page: recordPage, setBounds } = await newWindow(browser)
    await setBounds({ left: 1000, top: 0, width: 500, height: 500 })

    const recorder = await useScreenshare({ streamTo: whereby, recordFrom: recordPage });

    await whereby.goto("https://whereby.com/sebastienmatos");
    await recordPage.goto("https://ecal.ch");

    await recorder.start({ mirrored: false });
}

init();