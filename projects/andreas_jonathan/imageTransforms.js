import OpenAI from "openai";
import {
  image_to_base64,
  sleep,
  generate_speech,
  setPuppeteer,
  openai,
} from "../../utils.js";
import fs from "fs";
import { downloadDir } from "./fileReading.js";
import path from "path";

// DALL-E modify image API - Works with absolute path.

export async function modify_image(imageDescription, title, aspectRatio) {
  let imageResolution = "";

  if (aspectRatio === "landscape") {
    imageResolution = "1792x1024";
  } else if (aspectRatio === "portrait") {
    imageResolution = "1024x1792";
  }

  const openai = new OpenAI(process.env.OPENAI_API_KEY);

  const response = await openai.images.generate({
    prompt: imageDescription,
    model: "dall-e-3",
    n: 1,
    size: imageResolution,
  });

  downloadImageFromURL(
    response.data[0].url,
    path.join(downloadDir, title + ".png")
  );
}

export async function downloadImageFromURL(url, path) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(path, buffer);
  // console.log("Image downloaded");
}
