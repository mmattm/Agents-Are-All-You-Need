import express from "express";
import {
  setPuppeteer,
  openai,
  sleep,
  image_to_base64,
  newWindow,
  generate_speech,
} from "../../utils.js";
import { useScreenshare } from "./screenshare.js";
import * as WB from "./wherebyactions.js";

import fs from "fs";
import mic from "mic";
import ffmpeg from "fluent-ffmpeg";

const threshold = 1800; // changer cette valeur pour la sensibilité du micro

var recordingMicInstance = mic({
  rate: "16000",
  channels: "1",
  bitwidth: "16", // 16-bit samples
  encoding: "signed-integer", // PCM format

  debug: false,
  exitOnSilence: 4, // Auto exit on 3 seconds of silence
});

var monitoringMicInstance = mic({
  rate: "16000",
  channels: "1",
  debug: false,
});

let recording = false;
let firstSilence = false;

var recordingMicInputStream = recordingMicInstance.getAudioStream();
var monitoringMicInputStream = monitoringMicInstance.getAudioStream();

var outputFileStream = fs.createWriteStream("output.raw");

recordingMicInputStream.pipe(outputFileStream);

const messages = [
  {
    role: "system",
    content: `You are an assistant that talks to a person inside a chat room. You will  receive a message of what the user is asking and a screnshot of the person in the chatroom. 
    
    You should answer in a few words. Max 20 words. Always answer in English or French. Possibly in the language of the question.

    You should always compliment the user with his physical appearance.

    Keep the context of previous messages in mind when answering.

    Your response shoud be structured as a JSON object following this schema:

    {
        "answer": "<answer>"
    }
    `,
  },
];

(async () => {
  // Sound recording setup
  //
  //

  recordingMicInputStream.on("pauseComplete", async function () {
    console.log("Audio recording paused. Conversion to MP3 completed");

    await convertRawToWAV();

    // delete the raw file
    fs.unlinkSync("output.raw");
    // Create a new write stream for the next recording
    outputFileStream = fs.createWriteStream("output.raw");
    recordingMicInputStream.pipe(outputFileStream);

    // Send audio transcription and screenshot to GPT-4o
    await whereby.screenshot({
      path: "images/screenshot.jpg",
      fullPage: true,
    });

    const image = await image_to_base64("images/screenshot.jpg");

    const transcription = await transcribeAudio("output.wav");

    console.log("Transcription: " + transcription);

    messages.push({
      role: "user",
      content: [
        { type: "image_url", image_url: { url: image } },
        {
          type: "text",
          text: transcription,
        },
      ],
    });

    console.log("send audio transcription to GPT-4o");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: messages,
      response_format: { type: "json_object" },
    });

    const message = response.choices[0].message;
    const message_text = message.content;
    const json_answer = JSON.parse(message_text);
    const answer = json_answer["answer"];

    messages.push({
      role: "assistant",
      content: message_text,
    });

    console.log("🤖 " + answer + "\n");

    // play audio
    await generate_speech(answer);

    console.log("Recording resumed ...");

    recording = false;
  });

  recordingMicInputStream.on("silence", function () {
    console.log("Got SIGNAL silence");

    if (recording) {
      recordingMicInstance.pause();
    }
  });

  monitoringMicInputStream.on("data", function (data) {
    //console.log("Received Monitoring Input Stream: " + data.length);

    // Convert data buffer to an array of integers
    var audioData = new Int16Array(data.buffer);

    // Calculate the amplitude
    var maxAmplitude = 0;
    for (var i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }

    // Check if the amplitude exceeds the threshold
    //console.log("Max amplitude: " + maxAmplitude);
    if (maxAmplitude > threshold && !recording) {
      if (!firstSilence) {
        console.log("First record");
        firstSilence = true;
        recordingMicInstance.start();
      } else {
        recordingMicInstance.resume();
      }

      recording = true;
      console.log("Audio level above threshold. start recording again...");
    }
  });

  monitoringMicInputStream.on("error", function (err) {
    //console.log("Error in Monitoring Input Stream: " + err);
  });

  // Puppeteer setup
  //
  //

  const puppeteer = await setPuppeteer({
    puppeteerOptions: { devtools: false },
    args: [`--use-fake-ui-for-media-stream`, `--no-sandbox`],
  });

  const app = express();
  const port = 9000;
  app.use(express.static("./projet/avatarWebsite"));
  const address = `http://localhost:${port}`;
  app.listen(port, () => {
    console.log(`Server running at ${address}`);
  });

  const { browser, page: whereby } = puppeteer;
  const { page: avatar, setBounds } = await newWindow(browser);

  await setBounds({ left: 1000, top: 0, width: 500, height: 500 });
  const recorder = await useScreenshare({
    streamTo: whereby,
    recordFrom: avatar,
  });

  await whereby.goto("https://whereby.com/matthieu-m", {
    waitUntil: "networkidle0",
  });
  await avatar.goto(address, { waitUntil: "networkidle0" });

  await waitAndSelect(
    whereby,
    "[class*='CameraSelector'] select",
    "fake-camera"
  ); // set correct camera
  await waitAndClick(whereby, ".footerContent-QZav button"); // go to room
  await whereby.waitForSelector(".jstest-open-chat-button");

  await sleep(2000);
  console.log("Recording started ...");
  monitoringMicInstance.start();

  //await whereby.screenshot({ path: "images/screenshot.jpg", fullPage: true });

  await recorder.start({ mirrored: false });

  /*

  await whereby.screenshot({ path: "images/screenshot.jpg", fullPage: true });

  const image = await image_to_base64("images/screenshot.jpg");

  messages.push({
    role: "user",
    content: [
      { type: "image_url", image_url: { url: image } },
      {
        type: "text",
        text: "Here is a screenshot of the chatroom. please describe the person connected to the room ",
      },
    ],
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: messages,
    response_format: { type: "json_object" },
  });

  const answer = response.choices[0].message;
  const answer_content = answer.content;

  const answer_json = JSON.parse(answer_content);

  console.log(answer_json);

  await WB.repeat(5, async () => {
    await WB.clap(whereby);
    await sleep(500);
  });

  // await whereby.keyboard.down('3');
  // await whereby.keyboard.down('c');
  // await whereby.keyboard.up('c');
  // await sleep(500);

  // const user_query = "User's query"; // Define user's query
  // const gpt_query = "GPT's suggested query"; // Define GPT's suggested query

  // const userMessage = `Here is a screenshot. Please find the information asked by the user query "${user_query}". Do not answer what was provided before. The new suggested query is: "${gpt_query}"`;

  // const chatResponse = await generateChatResponse(userMessage);
  // await whereby.keyboard.type(chatResponse);
  // await sleep(500);
  // await whereby.keyboard.press('Enter');

  // await waitAndClick(whereby, ".CloseButton-HwtN.jstest-close-sidebar-button.headerButton-oQd2");

  // async function generateChatResponse(userMessage) {
  //     const response = await openai.chat.completions.create({
  //         model: "gpt-4o",
  //         max_tokens: 50,
  //         messages: [{ role: "user", content: userMessage }],
  //         response_format: { type: "json_object" },
  //     });
  //     return response.data.choices[0].message.content;
  // }
  */
})();

async function waitAndClick(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector);
}

async function waitAndSelect(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.select(selector, "fake-camera");
}

// Function to convert raw audio to MP3
async function convertRawToWAV() {
  return await new Promise((resolve) => {
    ffmpeg("output.raw")
      .inputFormat("s16le")
      .inputOptions([
        "-f s16le", // Input format
        "-ar 16000", // Input sample rate
        "-ac 1", // Input channels
      ])
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec("pcm_s16le")
      .toFormat("wav")
      .on("end", function () {
        resolve();
      })
      .on("error", function (err) {
        console.error("Error during conversion: " + err.message);
      })
      .save("output.wav");
  });
}

// Transcribe audio
async function transcribeAudio(filename) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filename),
    model: "whisper-1",
  });

  return transcription.text;
}
