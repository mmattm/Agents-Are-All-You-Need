import {
  image_to_base64,
  input,
  sleep,
  highlight_links,
  waitForEvent,
  setPuppeteer,
  openai,
  generate_speech,
  newWindow,
} from "../../utils.js";

import pkg from "terminal-kit";
const { terminal: term } = pkg;

const timeout = 1000;

const number_of_querys = 10;

const speechSpeed = 1.2;

(async () => {
  console.clear();

  generate_speech({
    text: "what topic do you want to explore today?",
    speed: 1.3,
  });

  await term.slowTyping(
    `GPT: what topic do you want to explore today?
`,
    {
      style: term.brightWhite,
      flashStyle: term.brightWhite,
      textAttr: { bgColor: "white" },
      delay: 20,
    }
  );

  const prompt = await input("You: ");
  console.clear();

  const query_messages = [
    {
      role: "system",
      content: ` You are tasked with creating a list of ${number_of_querys} diffrent search querys based on this prompt: ${prompt}.You need to agknowledge the thematics of the
        prompt and create useful search querys based on that, by searching each of those querys the goal would be to have the most information possible about the prompt.
        Your are also an hyperactif, overzealous and expressive assistant that will introduce the topic by enumerating the querys with a lot of enthusiasm.

You have to answer in the following JSON format:
              {
                "querys": "<query1> , <query2> , <query3> , ..."
                "introduction": "<introduction very natural, you know what you are going to talk about and you are way too enthousiastic>"
              }`,
    },
  ];

  const query_response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: query_messages,
    response_format: { type: "json_object" },
  });

  const query = query_response.choices[0].message;
  const query_content = query.content;
  const query_json = await JSON.parse(query_content);
  const querys = await query_json["querys"];
  const introduction = await query_json["introduction"];

  query_messages.push({
    role: "assistant",
    content: querys,
  });

  let generateArray = querys.split(",");

  let ChangingQuery = generateArray[0].trim();

  const messages = [
    {
      role: "system",
      content: `You are a website crawler. You will be given instructions on what to do by browsing. You are connected to a web browser and you will be given the screenshot of the website you are on. The links on the website will be highlighted in red in the screenshot. Always read what is in the screenshot. Don't guess link names.
  
              You need to click on the links to find the information asked by the user query.

Do not use emojis in the answers.
  
              You can click links on the website by referencing the text inside of the link/button. If it's not highlighted in the square do not click on it. Pick another one. If there is a doubt of clicking on a link, just go ahead and take the lead. You have to answer in the following JSON format:
              {"click": "Text in link"}
              `,
    },
  ];

  const chat_messages = [
    {
      role: "system",
      content: `You are an hyperactif, overzealous and expressive assistant your task is to analyze webpages and summerize with a few details though. First when you are loading you have to do long sentences to fill the gaps naturally and about the ${ChangingQuery}. Secondly, I want when you click on a link, to explain that you found something interesting in your way. Eureka. Then, when the webpage is load act as if you are thinking or searching for the informations to make the interaction feel more realistic, you can very briefly describe this page and telling what type of page your in (multiple links in google, wikipedia article, blog, etc...), but tell us way more about the info in the page. But you can't base what you are going to say on your natural knowledge. You can only base your informations on the informations given on what you see on the webpage. I would like you to say an intro, like for examples "Hummm... wait a minute I find something interesting" or "Ah! maybe it’s there!" or "I'm going to introduce you... or "lets talk about...". You know what you are talking about remember you are overenthusiastic and you love to give statistics but please less than 2 sentences max. Please don't use the same intro for all webpages and don't use my examples just be inspired. Then I want the informations. Your responses should teach me something and be like an engeneer's answer. Maintain context to avoid repeating yourself. After, I need a transition to the next page, for example "I'm sure I can find something more interesting " or " Wait I'm not finished !" without using my examples as well.
  
  Always keep a reference of what you said in every message.
  
  Your response should be structured as a JSON object following this schema:
  
  {
  "loading": "<loading gap-filler>",
  "screenshots": "<another sentence to fill the silence, about the query's topic. Never say the word "screenshot">",
  "click": "<act like you found something really interesting>",
  "introduction ": "<introduction very natural, you know what you are going to talk about. At the end of the sentence say something that tell that you are going to search for info on the webpage>",
  "informations": "<the webpage's information summerized and explained by an overenthusiastic engineer, 2 sentences max>"
  "transition": "<transition between two webpages like a teacher presentation and not like an exploration. Everything must be thought out.>"
  }
  `,
    },
  ];

  messages.push({
    role: "user",
    content: querys,
  });

  let screenshot_taken = false;

  let goodLoopCount = 0;

  let parts;

  console.clear();

  console.log("🤔 ");

  await Promise.all([
    term.slowTyping(introduction, {
      style: term.brightWhite,
      flashStyle: term.brightWhite,
      textAttr: { bgColor: "white" },
      delay: 20,
    }),
    await generate_speech({ text: introduction, speed: 1.3 }),
  ]);
  console.clear();

  const puppeteer = await setPuppeteer({
    puppeteerOptions: {
      devtools: false,
    },
    args: [`--use-fake-ui-for-media-stream`, `--no-sandbox`],
  });

  const { browser, page: chrome_page } = puppeteer;
  chrome_page.close();

  const { page: page, setBounds } = await newWindow(browser);
  await setBounds({ left: 0, top: 0, width: 960, height: 1080 });

  restartLoop: while (true) {
    const chat_response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: chat_messages,
    });

    const chat_message = chat_response.choices[0].message;
    const chat_message_text = chat_message.content;
    const chat_message_json = await JSON.parse(chat_message_text);

    if (ChangingQuery) {
      console.log("Crawling " + ChangingQuery);
      await page.goto("https://google.com/search?q=" + ChangingQuery);

      chat_messages.push({
        role: "assistant",
        content: [
          {
            type: "text",
            text: `the new query is : ${ChangingQuery} do not take into account the previous query. You have to completly forget the previous query. It is very important !!!!!`,
          },
        ],
      });

      console.log(ChangingQuery);

      const chat_loading = chat_message_json["loading"];
      console.clear();

      console.log("🔋 ");
      term.slowTyping(chat_loading, {
        style: term.brightWhite,
        flashStyle: term.brightWhite,
        textAttr: { bgColor: "white" },
        delay: 20,
      });
      await generate_speech({ text: chat_loading, speed: 1.3 });
      console.clear();

      await Promise.race([waitForEvent(page, "load"), sleep(timeout)]);

      await highlight_links(page);

      await page.screenshot({
        path: "images/screenshot.jpg",
        fullPage: true,
      });

      screenshot_taken = true;
      ChangingQuery = null;
    }

    if (screenshot_taken) {
      const base64_image = await image_to_base64("images/screenshot.jpg");

      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: base64_image,
            },
          },
          {
            type: "text",
            text: 'Here\'s the screenshot of the website you are on right now. You can click on links with {"click": "Link text"} or you can crawl to another URL if this one is incorrect.',
          },
        ],
      });

      chat_messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: base64_image,
            },
          },
          {
            type: "text",
            text: `Here is a what you see. Please find the informations about ${ChangingQuery} and give me a summary of the informations given on this webpage's article. You have to summerize the informations like an engineer with statistics and detailed informations because you are overzealous. Keep a reference of what you said in the previous messages. But you can't base what you are going to say on your natural knowledge. You can only base your informations on the informations given on what you see on the webpage.`,
          },
        ],
      });
      const chat_screenshots = chat_message_json["screenshots"];

      console.clear();

      console.log("📸 ");
      term.slowTyping(chat_screenshots, {
        style: term.brightWhite,
        flashStyle: term.brightWhite,
        textAttr: { bgColor: "white" },
        delay: 20,
      });
      await generate_speech({ text: chat_screenshots, speed: 1.3 });
      console.clear();

      screenshot_taken = false;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: messages,
    });

    const message = response.choices[0].message;
    const message_text = message.content;

    const message_json = await JSON.parse(message_text);

    messages.push({
      role: "assistant",
      content: message_text,
    });

    if (message_text.indexOf('{"click": "') !== -1) {
      // First get the link text from gpt message
      parts = message_text.split('{"click": "');
      parts = parts[1].split('"}');
      const link_text = parts[0].replace(/[^a-zA-Z0-9 \u00C0-\u00FF]/g, "");

      console.log("Clicking on " + link_text);

      messages.push({
        role: "user",
        content: "Clicking on " + link_text,
      }); // Then get all elements with gpt-link-text attribute and find the one that matches the link text

      try {
        const elements = await page.$$("[gpt-link-text]");

        let partial;
        let exact;

        for (const element of elements) {
          const attributeValue = await element.evaluate((el) =>
            el.getAttribute("gpt-link-text")
          );

          if (attributeValue.toLowerCase().includes(link_text.toLowerCase())) {
            partial = element;
          }

          if (attributeValue === link_text) {
            exact = element;
          }
        }

        if (exact) console.log("Exact match found: " + link_text);
        if (partial) console.log("Partial match found: " + link_text);

        if (exact || partial) {
          try {
            const [response] = await Promise.all([
              page
                .waitForNavigation({ waitUntil: "domcontentloaded" })
                .catch((e) =>
                  console.log("Navigation timeout/error:", e.message)
                ),
              (exact || partial).click(),
            ]);
          } catch (error) {
            console.log("ERROR: Clicking failed", error);

            continue restartLoop;
          }

          const chat_click = chat_message_json["click"];

          console.clear();
          console.log("🖱️ ");

          term.slowTyping(chat_click, {
            style: term.brightWhite,
            flashStyle: term.brightWhite,
            textAttr: { bgColor: "white" },
            delay: 20,
          });
          await generate_speech({ text: chat_click, speed: 1.3 });
          console.clear();

          await Promise.race([waitForEvent(page, "load"), sleep(timeout)]);

          await highlight_links(page);

          await page.screenshot({
            path: "images/screenshot.jpg", // quality: 100,
            fullpage: true,
          });

          const base64_image = await image_to_base64("images/screenshot.jpg");

          chat_messages.push({
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: base64_image,
                },
              },
              {
                type: "text",
                text: `Here is a what you see.`,
              },
            ],
          });

          screenshot_taken = true;
        } else {
          continue restartLoop;

          throw new Error("Can't find link");
        }

        goodLoopCount++;

        if (goodLoopCount >= 1) {
          chat_messages.push({
            role: "assistant",
            content: chat_message_text,
          });

          const chat_intro = chat_message_json["introduction"];
          const chat_informations = chat_message_json["informations"];
          const chat_transition = chat_message_json["transition"];

          // console.log(chat_informations);
          // console.log(chat_transition);

          console.clear();
          console.log("🔍 ");

          term.slowTyping(chat_intro, {
            style: term.brightWhite,
            flashStyle: term.brightWhite,
            textAttr: { bgColor: "white" },
            delay: 20,
          });

          await generate_speech({ text: chat_intro, speed: 1.3 });

          const elements = await page.$$("[gpt-link-text]");
          const randomElements = elements
            .sort(() => Math.random() - Math.random())
            .slice(0, 5);
          for (const element of randomElements) {
            await page.evaluate(async (el) => {
              el.scrollIntoView({ behavior: "smooth" });
            }, element);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } // Smooth scroll to the bottom of the page

          await page.evaluate(() => {
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
          });

          await page.evaluate(() => {
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            const middle = (scrollHeight - clientHeight) / 2;
            window.scrollTo({ top: 0, behavior: "smooth" });
          });

          console.clear();
          console.log("📚 ");

          term.slowTyping(chat_informations + chat_transition, {
            style: term.brightWhite,
            flashStyle: term.brightWhite,
            textAttr: { bgColor: "white" },
            delay: 20,
          });

          await generate_speech({
            text: chat_informations + chat_transition,
            speed: 1.3,
          });
          console.clear();

          goodLoopCount = 0;

          generateArray.shift();
          ChangingQuery = generateArray[0].trim();

          console.log("Switching to " + ChangingQuery);

          exact = null;
          partial = null;

          messages.push({
            role: "system",
            content: "Switching to " + ChangingQuery,
          });

          chat_messages.push({
            role: "system",
            content:
              "Switching to query to " +
              ChangingQuery +
              " you need to completly forget the previous query. It is very important !!!!!",
          });

          chat_messages.push({
            role: "assistant",
            content: chat_message_text,
          });

          continue restartLoop;
        }
      } catch (error) {
        console.log("ERROR: Clicking failed", error);

        messages.push({
          role: "user",
          content:
            "ERROR: I was unable to click that element. Please try again with another link.",
        });

        continue restartLoop;
      }
    }
  }
})();
