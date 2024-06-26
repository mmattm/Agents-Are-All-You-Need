import { sleep, image_to_base64, setPuppeteer, openai } from "../utils.js";
import pkg from "terminal-kit";
const { terminal: term } = pkg;

const timeout = 3000;
const steps = 3;

(async () => {
  term.reset();
  const spinner = await term.spinner();
  term(" Processing... ");

  const { page, browser } = await setPuppeteer();

  await page.goto("https://www.instagram.com/", {
    waitUntil: "domcontentloaded",
  });

  await sleep(timeout);
  await page.click("._aauk");
  await sleep(timeout);

  for (let i = 0; i < steps; i++) {
    await page.screenshot({
      path: "images/story_" + i + ".jpg",
      fullPage: false,
    });

    await page.keyboard.press("ArrowDown");
    await sleep(1000);
  }

  await browser.close();

  const messages = [
    {
      role: "system",
      content: `You are an instagram recapper. 
      I'll send you multiples screenshots of stories. Please send by a very brief description of everything i missed. Just one sentence. Use a sarcastic tone. Start withh something like "What you did not missed today:"
       just recap all items in one small sentence. not as a list. skip the ads in this recap.
       You can add emoji before each item to make it more fun.
       
       In a second time estimate the time saved by not watching the stories and suggest a real life activity. "
       `,
    },
  ];

  const content = [];

  for (let i = 0; i < steps; i++) {
    const base64Image = await image_to_base64(`images/story_${i}.jpg`);
    content.push({
      type: "image_url",
      image_url: base64Image,
    });
  }

  content.push({
    type: "text",
    text: "Here are the screenshots",
  });

  messages.push({
    role: "user",
    content: content,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    max_tokens: 1024,
    messages: messages,
  });

  const message = response.choices[0].message;
  const message_text = message.content;

  spinner.animate(false);
  term.reset();

  console.log(message_text);
})();
