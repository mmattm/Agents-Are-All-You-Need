import { generate_speech } from "../../utils.js";
import { modify_image } from "./imageTransforms.js";
import * as keyboardAction from "./keyboardFunctions.js";
import { trashDir, downloadDir } from "./fileReading.js";
import path from "path";

export async function parseAnswerForJoe(json_answer) {
  const gptResponse = {
    purpose: json_answer["purpose"],
    description: json_answer["description"],
    fileName: json_answer["fileName"],
    title: json_answer["title"],
    content: json_answer["content"],
    imagePrompt: json_answer["imagePrompt"],
    codePoetry: json_answer["codePoetry"],
    songName: json_answer["songName"],
    points: json_answer["points"],
  };

  const gptPresentation = {
    title: json_answer["title"],
    subtitle: json_answer["subtitle"],
    author: json_answer["author"],
    slide1_title: json_answer["slide1_title"],
    slide1_subtitle: json_answer["slide1_subtitle"],
    slide1_bullets: json_answer["slide1_bullets"],
    slide2_title: json_answer["slide2_title"],
    slide2_subtitle: json_answer["slide2_subtitle"],
    slide2_bullets: json_answer["slide2_bullets"],
    songName: json_answer["songName"],
  };

  return { gptResponse, gptPresentation };
}

export async function switchCase(parsedAnswerForJoe) {
  const gptResponse = parsedAnswerForJoe.gptResponse;
  const gptPresentation = parsedAnswerForJoe.gptPresentation;
  let filePath = "";

  switch (gptResponse.purpose) {
    case "wallpaper":
      generate_speech(gptResponse.description, "onyx").then(() => {
        generate_speech(
          "Yo brooooo do you like this new desktop wallpaper ? I tried to keep some of the original elements, let me know what you think...",
          "onyx"
        );
      });
      await modify_image(
        gptResponse.imagePrompt,
        gptResponse.fileName,
        "landscape"
      );
      filePath = path.join(downloadDir, gptResponse.fileName);
      await keyboardAction.imageToDesktopWallpaper(filePath);
      break;
    case "reminder":
      generate_speech(gptResponse.description, "onyx");
      await keyboardAction.makeReminder(gptResponse.title, gptResponse.points);
      break;
    case "movie":
      generate_speech(gptResponse.description, "onyx");
      await modify_image(
        gptResponse.imagePrompt,
        gptResponse.fileName,
        "portrait"
      );
      filePath = path.join(downloadDir, gptResponse.fileName);
      await keyboardAction.goToMovie(filePath, gptResponse.songName);
      break;
    case "keynote":
      generate_speech(gptResponse.description, "onyx");
      await keyboardAction.makePresentation(gptPresentation);
      break;
    case "horoscope":
      generate_speech(gptResponse.description, "onyx");
      await keyboardAction.writeNote({
        title: gptResponse.title,
        content: gptResponse.content,
      });
      break;
    case "recipe":
      generate_speech(gptResponse.description, "onyx");
      await modify_image(
        gptResponse.imagePrompt,
        gptResponse.fileName,
        "landscape"
      );
      filePath = path.join(downloadDir, gptResponse.fileName);
      await keyboardAction.writeRecipe(gptResponse.title, gptResponse.content);
      await keyboardAction.pasteRecipeImageInNotes(filePath);
      await generate_speech(
        "Yo brooooo do you fancy what I just cooked up ???? This could be delicious, but maybe it's just cause I'm hungry... hehehehehehehehe",
        "onyx"
      );
      break;
    case "poem":
      // generate_speech(gptResponse.description, "onyx");
      await keyboardAction.writeNote({
        title: gptResponse.title,
        content: gptResponse.content,
      });
      break;
  }
}
