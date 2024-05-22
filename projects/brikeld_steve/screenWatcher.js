import { setPuppeteer, sleep, image_to_base64, openai } from "../../utils.js";
import fs from "fs";

export async function getVideoDescription({ systemMessage, path, page }) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }

  await page.screenshot({
    path,
    fullPage: false,
  });

  const image = await image_to_base64(path);

  const messages = [
    systemMessage,
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: image,
          },
        },
        {
          type: "text",
          text: "Here the screenshot",
        },
      ],
    },
  ];

  let answer;
  try {
    console.log("Processing...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: messages,
      response_format: { type: "json_object" },
    });

    answer = response.choices[0].message.content.trim();
    answer = JSON.parse(answer);
  } catch (error) {
    answer = "Error:" + error;
  }

  return answer;
}
