import { setPuppeteer } from "../utils.js";

(async () => {
  const { page } = await setPuppeteer({
    puppeteerOptions: {
      devtools: false,
    },
    args: [`--force-device-scale-factor=5`],
  });

  await page.goto(
    "https://www.google.com/search?q=js+trigger+zoom+chrome&rlz=1C5GCCM_en&oq=js+trigger+zoom+chrome&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIICAEQABgWGB4yCggCEAAYgAQYogQyCggDEAAYgAQYogQyCggEEAAYgAQYogQyCggFEAAYgAQYogQyBggGEEUYQNIBCDM0MjFqMGoxqAIAsAIA&sourceid=chrome&ie=UTF-8"
  ); // Replace with your target URL
  // const client = await page.target().createCDPSession();

  // await client.send("Emulation.setPageScaleFactor", {
  //   pageScaleFactor: 1.5,
  // });

  // document zoom style
  // await page.addStyleTag({
  //   content: `
  //     body {
  //       zoom: 1.5;
  //     }
  //   `,
  // });
})();
