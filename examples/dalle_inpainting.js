import { image_to_base64, sleep, setPuppeteer, openai } from "../utils.js";
import fs from "fs";
import jimp from "jimp";

(async () => {
  console.clear();

  console.log("generating image...");

  const tile = await jimp.read("images/tile.png");
  const mask = await jimp.read("images/mask.png");

  tile.mask(mask, 0, 0);

  // save image
  await tile.writeAsync("images/tile_masked.png");

  const response = await openai.images.edit({
    model: "dall-e-2",
    image: fs.createReadStream("images/tile.png"),
    mask: fs.createReadStream("images/tile_masked.png"),
    prompt: `A detailed futuristic building complex on the Martian surface in a black and white satellite image. The building complex is in 3D isometric view, integrated into the Martian landscape with several impact craters around it. The architecture is advanced and imaginative, showcasing advanced technology. The building complex and surroundings are colored to enhance the visual appeal, but key features of the craters are not obscured. No text in the image. Large Building complex with crazy aaarchitecture on Mars.`,
    // prompt: `A google maps satellite view of a huge futuristic lunar like New `,
    n: 1,
    size: "512x512",
  });

  const image_url = response.data[0].url;
  console.log("Image URL:", image_url);
})();
