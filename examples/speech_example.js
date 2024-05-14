import { generate_speech } from "../utils.js";
import pkg from "terminal-kit";
const { terminal: term } = pkg;

(async () => {
  console.clear();

  const text = "This is a test of the speech generation.";

  await Promise.all([
    term.slowTyping(text + "\n", {
      flashStyle: term.brightWhite,
      delay: 40,
    }),
    generate_speech(text, "onyx"),
  ]);

  console.log("Speech generation complete");
})();
