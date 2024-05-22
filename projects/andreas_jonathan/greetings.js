import { openai, generate_speech } from "../../utils.js";

export function greetings(basePromptContent) {
  let key = "";

  basePromptContent.includes("poem") ? (key = "poem") : null;
  basePromptContent.includes("recipe") ? (key = "recipe") : null;
  basePromptContent.includes("keynote") ? (key = "keynote") : null;
  basePromptContent.includes("wallpaper") ? (key = "wallpaper") : null;
  basePromptContent.includes("movie") ? (key = "movie") : null;

  switch (key) {
    case "poem":
      generate_speech(
        "Mannnnnn, how could you throw this away !!! This is golden... matter a fact, I just wrote this sweet poem with it. Let me write this out, and my good friend John here will sing it for you",
        "onyx"
      );
      break;
    case "recipe":
      generate_speech(
        "Ohhhhh, I'm so hungry right now, what you just threw away is looks like it has the perfect ingredients for this recipe I have in mind...",
        "onyx"
      );
      break;
    case "keynote":
      generate_speech(
        "Wow, this is some deep stuff you just put into the trash, let me give it some value, and even add some sweet jamzzzzz",
        "onyx"
      );
      break;
    case "wallpaper":
      generate_speech(
        "Brooooo, this is some art you just threw away, I'm going to turn this into a sweet desktop wallpaper for you, just give me minute or two.. hahahahahahah",
        "onyx"
      );
      break;
    case "movie":
      generate_speech(
        "WoooooooaaaaaaaaaaOhhhh !!!!!!!!??????, this image is so cinematic, I'm going to turn this into a movie poster for you mannnnnnnn, never throw away a masterpiece like this again...",
        "onyx"
      );
      break;
    default:
      break;
  }
}
