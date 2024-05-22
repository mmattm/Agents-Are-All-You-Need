import {
  mouse,
  left,
  right,
  up,
  down,
  keyboard,
  Key,
  Window,
  getActiveWindow,
  clipboard,
  textLine,
} from "@nut-tree-fork/nut-js";
import {
  image_to_base64,
  sleep,
  generate_speech,
  setPuppeteer,
  openai,
} from "../../utils.js";
import path from "path";
import fs from "fs";
import { homeDir, trashDir } from "./fileReading.js";

keyboard.config.autoDelayMs = 100;

export async function openFinder() {
  await keyboard.type(Key.LeftSuper, Key.Space);
  await keyboard.type("finder");
  await sleep(100);
  await keyboard.type(Key.Enter);
  await sleep(100);
}

export async function searchTrashInFinder() {
  await keyboard.type(Key.LeftSuper, Key.LeftShift, Key.G);
  await keyboard.type(trashDir);
  await sleep(100);
  await keyboard.type(Key.Enter);
}

export async function imageToDesktopWallpaper(filePath) {
  await openFinder();
  await keyboard.type(Key.LeftSuper, Key.LeftShift, Key.G);
  await sleep(400);
  await clipboard.setContent(filePath);
  while (!fs.existsSync(filePath + ".png")) {
    await sleep(100);
    // console.log("waiting for file to be copied");
  }
  await keyboard.type(Key.LeftSuper, Key.V);
  await sleep(1000);
  await keyboard.type(Key.Enter);
  await sleep(500);
  await keyboard.type(Key.LeftControl, Key.LeftAlt, Key.LeftSuper, Key.T);
  await sleep(500);
  await keyboard.type(Key.Fn, Key.F11);
}

export async function openApp(appName) {
  await keyboard.type(Key.LeftSuper, Key.Space);
  await keyboard.type(appName);
  await sleep(100);
  await keyboard.type(Key.Enter);
  await sleep(100);
}

export async function writeNote(note) {
  await keyboard.type(Key.Fn, Key.Q);
  await sleep(1000);
  await keyboard.type(Key.LeftSuper, Key.A);
  await sleep(200);
  await keyboard.type(Key.LeftSuper, Key.X);
  await sleep(200);

  await keyboard.type(note.title);
  await sleep(300);
  await keyboard.type(Key.Enter);
  await sleep(100);

  keyboard.config.autoDelayMs = 45;
  await keyboard.type(note.content);
  await sleep(100);
  keyboard.config.autoDelayMs = 100;

  // select all
  await keyboard.type(Key.LeftSuper, Key.A);
  await sleep(400);
  // start speaking
  await keyboard.type(Key.LeftControl, Key.LeftAlt, Key.LeftSuper, Key.S);
  // bigger text
  for (let i = 0; i < 5; i++) {
    await keyboard.type(Key.LeftControl, Key.LeftAlt, Key.LeftSuper, Key.B);
  }
}

export async function writeRecipe(title, content) {
  await keyboard.type(Key.Fn, Key.Q);
  await sleep(1000);

  await keyboard.type(title);
  await sleep(300);
  await keyboard.type(Key.Enter);
  await sleep(100);

  clipboard.setContent(content);
  await sleep(500);
  await keyboard.type(Key.LeftSuper, Key.V);

  // select all
  await keyboard.type(Key.LeftSuper, Key.A);
  await sleep(400);
}

export async function makePresentation(presentation) {
  await playSongOnSpotify(presentation.songName);
  await sleep(500);
  await keyboard.type(Key.LeftSuper, Key.Space);
  await keyboard.type("keynote");
  await sleep(100);
  await keyboard.type(Key.Enter);
  while (!(await checkIfKeynoteIsOpen())) {
    // await sleep(100);
  }
  await sleep(500);

  await keyboard.type(Key.LeftSuper, Key.N);
  await sleep(1000);
  await keyboard.type(Key.Enter);
  await sleep(400);

  keyboard.config.autoDelayMs = 30;

  // first slide
  await keyboard.type(Key.Tab);
  await keyboard.type(presentation.title);
  await sleep(100);

  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  await keyboard.type(presentation.subtitle);
  await sleep(100);

  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  await keyboard.type(presentation.author);
  await sleep(100);

  // second slide
  await keyboard.type(Key.LeftSuper, Key.LeftShift, Key.N);

  await keyboard.type(Key.Tab);
  await keyboard.type(presentation.slide1_title);
  await sleep(100);

  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  await keyboard.type(presentation.slide1_subtitle);
  await sleep(100);

  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  for (const point of presentation.slide1_bullets) {
    await keyboard.type(Key.Enter);
    await keyboard.type(point);
  }
  await sleep(100);

  // third slide
  await keyboard.type(Key.LeftSuper, Key.LeftShift, Key.N);

  await keyboard.type(Key.Tab);
  await keyboard.type(presentation.slide2_title);
  await sleep(100);

  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  await keyboard.type(presentation.slide2_subtitle);
  await sleep(100);

  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  await keyboard.type(Key.Tab);
  for (const point of presentation.slide2_bullets) {
    await keyboard.type(Key.Enter);
    await keyboard.type(point);
  }
  keyboard.config.autoDelayMs = 100;
  await sleep(100);

  // present
  await keyboard.type(Key.LeftAlt, Key.LeftSuper, Key.P);
  await keyboard.type(Key.Left);
  await keyboard.type(Key.Left);
  await keyboard.type(Key.Left);
}

export async function pasteRecipeImageInNotes(filePath) {
  await openFinder();
  await sleep(200);
  await keyboard.type(Key.LeftSuper, Key.LeftShift, Key.G);
  await clipboard.setContent(filePath);
  while (!fs.existsSync(filePath + ".png")) {
    await sleep(100);
    // console.log("waiting for file to be copied");
  }
  await sleep(1000);
  await keyboard.type(Key.LeftSuper, Key.V);
  await sleep(400);
  await keyboard.type(Key.Enter);
  await sleep(500);

  // copy image
  await keyboard.type(Key.LeftSuper, Key.C);
  await sleep(700);

  // back to notes
  await keyboard.type(Key.LeftSuper, Key.Tab);
  await sleep(700);

  // click left
  await keyboard.type(Key.Left);
  await sleep(300);
  // paste image
  await keyboard.type(Key.LeftSuper, Key.V);
}

export async function goToMovie(filePath, songName) {
  await openFinder();
  await sleep(200);
  await keyboard.type(Key.LeftSuper, Key.LeftShift, Key.G);
  await clipboard.setContent(filePath);
  while (!fs.existsSync(filePath + ".png")) {
    await sleep(100);
    // console.log("waiting for file to be copied");
  }
  await keyboard.type(Key.LeftSuper, Key.V);
  await sleep(1000);
  await keyboard.type(Key.Enter);
  await sleep(500);
  await keyboard.type(Key.LeftSuper, Key.O);
  await sleep(500);
  await playSongOnSpotify(songName);
  await sleep(500);
  await keyboard.type(Key.LeftSuper, Key.Tab);
  await sleep(500);
  await keyboard.type(Key.Fn, Key.F);
}

export async function playSongOnSpotify(songName) {
  await openApp("spotify");
  while (!(await checkifWindowIsOpen("Spotify"))) {}
  await sleep(2000);
  await keyboard.type(Key.LeftSuper, Key.L);
  await sleep(100);
  await keyboard.type(songName);
  await sleep(2000);
  // for loop 6 times
  for (let i = 0; i < 6; i++) {
    await keyboard.type(Key.Tab);
  }
  await sleep(500);
  await keyboard.type(Key.Enter);
  await sleep(800);
  await keyboard.type(Key.Enter);
}

export async function checkIfKeynoteIsOpen() {
  const activeWindow = await getActiveWindow();
  const windowTitle = await activeWindow.getTitle();
  if (windowTitle === "Open") {
    await sleep(100);
    return true;
  } else {
    await sleep(100);
    return false;
  }
}

export async function checkifWindowIsOpen(windowName) {
  const activeWindow = await getActiveWindow();
  const windowTitle = await activeWindow.getTitle();
  if (windowTitle.includes(windowName)) {
    await sleep(100);
    return true;
  } else {
    await sleep(100);
    return false;
  }
}

// async function windowName () {
//     const activeWindow = await getActiveWindow();
//     const windowTitle =  await activeWindow.getTitle();
//     return windowTitle;
// }

// setInterval((async () => {
//     console.log(await windowName());
// }), 100);
