import { openai, generate_speech } from "../../utils.js";
import { readFiles, trashDir } from "./fileReading.js";
import { greetings } from "./greetings.js";
import { switchCase, parseAnswerForJoe } from "./joeCases.js";
import * as prompt from "./prompts.js";
import { startTerminal, logNewFileInTrash } from "./terminalStyles.js";
import chokidar from "chokidar";

// generate_speech("Yoooo welcome everybody, I'm Recycler Joe, I was created this week to make sure nothing goes to waste... hahahahaha", "onyx");

// -------- TRASH WATCHER --------
const watcher = chokidar.watch(trashDir, {
  persistent: true,
  ignoreInitial: true,
  ignored: ".DS_Store",
});

// Event listeners
watcher.on("add", (filePath) => {
  logNewFileInTrash(filePath);
  main_loop(filePath);
});

startTerminal();

generate_speech(
  "Yoooo broooo, I'm Recycler Joe, I'm here to help you recycle your trash. Just drag and drop your files into the trash and I'll take care of the rest. hahahahaha",
  "onyx"
);

async function main_loop(filePath) {
  // -------- FILE READING --------
  let { fileContent, fileName } = await readFiles(filePath);

  const gptChatHistory = [];
  gptChatHistory.push(prompt.getRandomBasePrompt(fileName));

  greetings(gptChatHistory[0].content);

  gptChatHistory.push({
    role: "user",
    content: fileContent,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    response_format: { type: "json_object" },
    messages: gptChatHistory,
  });

  const message = response.choices[0].message;
  const message_text = message.content;
  const json_answer = JSON.parse(message_text);

  switchCase(await parseAnswerForJoe(json_answer));
}
