import puppeteer from "puppeteer"; // Import puppeteer
import {
  setPuppeteer,
  sleep,
  image_to_base64,
  openai,
  newWindow,
  playAudio,
} from "../../utils.js";
import { getVideoDescription } from "./screenWatcher.js";

const timeout = 300000;
const timeBetweenScreenshots = 3000;

(async () => {
  const systemMessage = {
    role: "system",
    content: `You are an assistant tasked with analyzing screenshots from Instagram videos to extract specific information about food, ingredients, dishes, clothes, object and accessories presented in the videos. Your responses should be concise and include only the ingredients and objects detected in each screenshot. Do not include any extraneous details or descriptions.

    When analyzing a screenshot, if no food, ingredients, or objects are detected, do not write anything at all. When ingredients, objects, clothes, accessories, food are detected, list them in a way that makes them easy to find on a shopping website. If you are sure about a specific item, list it precisely. If uncertain about a specific item, provide a more general term or a similar item.
    
    Only list each item once. If an item has already been listed, do not list it again.

    Do not write the same item multiple times, once you have listed it, do not list it again, even if the item appears multiple times in the screenshot.
    
    The terminal response should contain only the items and nothing else.

    Your response should be structured as a JSON object following this schema, shopURL should appear in every item, and must be a generic search:

    {
      "itemsFound": [
        {name: "cheddar", description: "authentic cheddar cheese", shopURL: "https://www.galaxus.ch/en/search?q=cheddar"},
        {name: "milk chocolate", description: "big chunk of swiss milk chocolate", shopURL: "https://www.galaxus.ch/en/search?q=milk+chocolate"}
        {name: "spoon", description: "metal spoon", shopURL: "https://www.galaxus.ch/en/search?q=spoon"},
        {name: "glass", description: "drinking glass", shopURL: "https://www.galaxus.ch/en/search?q=glass"}
        {name: "shirt", description: "blue shirt", shopURL: "https://www.galaxus.ch/en/search?q=shirt"}
        {name: "jeans", description: "blue jeans", shopURL: "https://www.galaxus.ch/en/search?q=jeans+blue"}
        {name: "glasses", description: "glasses", shopURL: "https://www.galaxus.ch/en/search?q=glasses"}
        {name: "earrings", description: "hoop earrings", shopURL: "https://www.galaxus.ch/en/search?q=earrings"}
      ],
    }
    `,
  };

  let { browser, page } = await setPuppeteer({
    args: ["--incognito"],
  }); // Get browser instance
  page.close();

  const BASKET = await newWindow(browser);
  BASKET.setBounds({
    top: 0,
    left: 960,
    width: 960,
    height: 1080,
  });

  const HIDDEN = await newWindow(browser);
  HIDDEN.setBounds({
    top: 0,
    left: 0,
    width: 960,
    height: 1080,
  });

  const INSTAGRAM = await newWindow(browser);
  INSTAGRAM.setBounds({
    // top: 0,
    // left: 0,
    width: 1920,
    height: 1080,
  });

  await INSTAGRAM.page.goto("https://www.instagram.com/reels/", {
    waitUntil: "domcontentloaded",
  });
  // Set bounds fullscreen

  // add html item on page

  await INSTAGRAM.page.evaluate(() => {
    const div = document.createElement("div");

    // get element by class
    const toolbar = document.querySelector("div.x1iyjqo2");

    div.innerHTML = `<div style="cursor:pointer" class="x9f619 x3nfvp2 xr9ek0c xjpr12u xo237n4 x6pnmvc x7nr27j x12dmmrz xz9dl7a xn6708d xsag5q8 x1ye3gou x80pfx3 x159b3zp x1dn74xm xif99yt x172qv1o x10djquj x1lhsz42 xzauu7c xdoji71 x1dejxi8 x9k3k5o xs3sg5q x11hdxyr x12ldp4w x1wj20lx x1lq5wgf xgqcy7u x30kzoy x9jhf4c"><div><div class="x9f619 xjbqb8w x78zum5 x168nmei x13lgxp2 x5pf9jr xo71vjh x1n2onr6 x1plvlek xryxfnj x1c4vz4f x2lah0s xdt5ytf xqjyukv x1qjc9v5 x1oa3qoh x1nhvcw1"><div class="x9f619 xxk0z11 xii2z7h x11xpdln x19c4wfv xvy4d1p">
    
    <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 173.9 146.2" class="x1lliihq x1n2onr6 x5n08af" fill="currentColor" height="24" role="img" width="24">
      <defs>
        <style>
          .cls-1 {
            fill: #000;
            stroke-width: 0px;
          }
        </style>
      </defs>
      <path class="cls-1" d="M87.1,59.7c25.7,0,51.4,0,77.1,0,5.9,0,10,4,9.6,9.3-.2,3.3-1.7,6-4.9,7.2-2.8,1.1-3.7,2.8-4.1,5.7-1,6.9-2.5,13.7-3.8,20.6-1.2,6.4-2.3,12.7-3.5,19.1-1,5.6-2,11.1-3.2,16.6-.8,4-5.4,7.4-9.9,7.9-.9,0-1.8,0-2.7,0-36.4,0-72.9,0-109.3,0-5.2,0-9.5-1.7-12-6.5-1-1.9-1.3-4.1-1.7-6.2-1.2-6.6-2.3-13.2-3.6-19.9-1.3-6.9-2.6-13.9-3.9-20.8-.7-3.8-1.6-7.5-2-11.3-.2-2.8-1.3-4.4-3.9-5.3-3.5-1.3-5.1-4.2-5.2-7.8-.1-4.5,3.6-8.5,8.2-8.8,1.2,0,2.5,0,3.7,0,25,0,49.9,0,74.9,0ZM40.6,125.9c-.3-1.6-.8-3.7-1.3-5.9-1.5-7.9-2.9-15.8-4.4-23.8-.6-2.9-2.3-4.2-4.6-3.6-2.1.5-3.2,2.6-2.7,5.2,1.8,9.9,3.7,19.7,5.5,29.6.4,2,2.2,3.7,3.9,3.6,2-.1,3.6-2.1,3.6-5ZM133.7,126.4c0,2.3,1.4,4.3,3.4,4.5,1.7.2,3.6-1.5,4-3.6.8-4.1,1.6-8.1,2.3-12.2,1.1-6,2.2-11.9,3.2-17.9.4-2.3-1-4.2-2.9-4.6-2.2-.4-3.9.7-4.4,3.2-1.4,7.2-2.8,14.3-4.2,21.5-.6,3-1.1,6-1.6,9.1ZM100.6,117.9c0,0-.1,0-.2,0,0,3.2,0,6.3,0,9.5,0,2,1.2,3.4,2.9,3.4,1.3,0,2.9-1,3.7-2.1.7-.9.8-2.5.9-3.8.5-7,.9-13.9,1.3-20.9.1-2.5.3-5,.3-7.5,0-2.4-1.5-3.9-3.6-4-2.1,0-3.6,1.3-3.8,3.7-.5,7.2-1,14.4-1.5,21.6ZM74,117.5c0,0-.2,0-.3,0-.5-7-1-14.1-1.5-21.1-.2-2.4-1.6-3.8-3.7-3.8-2.2,0-3.7,1.6-3.7,4.1,0,1.5,0,3,.1,4.5.5,8,1,15.9,1.5,23.9,0,.7,0,1.3.2,2,.4,2.4,2.2,4.1,4.1,4,2.1-.2,3.3-1.8,3.3-4.5,0-3,0-6,0-9ZM57.6,125.7c-.1,0-.2,0-.3,0-1.1-9.6-2.2-19.1-3.4-28.7-.1-1-.7-2.1-1.2-2.9-1.2-1.8-2.9-1.9-4.6-.9-1.8,1-1.8,2.9-1.6,4.7.7,6.7,1.4,13.4,2.2,20.1.4,3.1.6,6.3,1.3,9.4.3,1.4,1.7,2.9,3,3.5.8.4,2.7-.3,3.4-1.1.8-.9.9-2.5,1.2-3.8ZM117.2,124.9c-.1,0-.3,0-.4.1.4,1.5.5,3.3,1.4,4.5.6.8,2.4,1.3,3.5,1,1.9-.4,2.8-2.1,3-4.1.8-6.9,1.8-13.8,2.6-20.8.4-3.1.6-6.3.8-9.4,0-1.8-.7-3.3-2.6-3.7-2-.4-3.4.4-4.2,2.3-.3.7-.6,1.4-.7,2.1-1.1,9.3-2.2,18.6-3.3,27.9ZM83.5,111.6c0,4.5,0,9,0,13.4,0,3.9,1.2,5.8,3.6,5.9,2.5.1,4-2,4-5.8,0-9,0-18.1,0-27.1,0-1.3-.3-2.7-.9-3.8-1.3-2.4-4.7-2.3-5.8.1-.5,1.1-.7,2.4-.7,3.6,0,4.6,0,9.1,0,13.7Z"/>
      <path class="cls-1" d="M40.4,27.5c.8.7,1.3,1.3,2,1.5,6,2.1,8.3,7.3,10.2,12.7.9,2.6,1.3,5.5,2,8.2.4,1.6-.3,2.2-1.7,2.2-2.6,0-5.2,0-7.7,0-8.5,0-17,0-25.4,0-2.1,0-3-.6-3-2.8,0-4.1-.7-8.4,1.5-12.2,1.2-2,2.7-3.6,4-5.3-2.9-2.1-6-4.1-8.8-6.5-3.8-3.2-6-7.6-8.1-12.1-.8-1.7,0-2.9,2.2-2.7,3.8.3,7.6.7,11.3,1.7,2,.5,2.5.1,2.9-1.6.7-2.6,1.6-5.2,2.5-7.8.7-1.9,1.8-2.2,3.2-.7,2.3,2.4,4.4,5,6.7,7.7,1.5-1.1,3.1-2.4,4.8-3.5,1.9-1.3,3.9-2.5,6-3.5,2.7-1.3,3.9-.5,3.8,2.5-.2,8.2-2,15.8-8.5,22.1Z"/>
      <path class="cls-1" d="M86.9,52.1c-6.7,0-13.3,0-20,0-3,0-3.1-.2-2.9-3.1.3-3.3.5-6.6.7-9.9.5-7.9,5.1-11.9,12.9-11.3,7.9.6,15.7,1.3,23.6,1.9,5.4.4,9.8,4.9,9.8,10.4,0,3.1-.4,6.1-.6,9.2-.1,2.2-1.1,3-3.3,3-6.7-.1-13.5,0-20.2,0Z"/>
      <path class="cls-1" d="M120.1,51.2c6.4-3.3,8.4-9.1,9-15.7.2-2.4.6-4.8.9-7.2.2-1.7,1.2-2.4,3-2.1,4.1.6,8.2,1.1,12.3,1.6,1.6.2,2.2.9,1.9,2.5-.4,2.5-.5,5-1,7.4-.9,4.7-1,9.2,1.5,14h-27.5c0-.2-.1-.4-.2-.6Z"/>
      <path class="cls-1" d="M148.3,20.6c-5.6-.7-10.7-1.2-15.6-2.1-4.2-.7-5.2-2.4-4.4-6.7.4-2.4.6-4.9.9-7.4.4-3.1,2.4-4.8,5.5-4.3,5.3.7,10.5,1.5,15.7,2.3,2.8.4,4,2.1,3.6,4.9-.3,3-.7,6.1-1.2,9.1-.4,3-2.1,4.2-4.6,4.1Z"/>
      <path class="cls-1" d="M78.1,14.2c.5-9.8,1.2-10.6,10.9-9.8,3.5.3,6.9.7,10.4,1.2,2.8.4,4.2,1.9,4.2,4.7,0,3.2-.3,6.5-.5,9.7,0,1.6-.9,2.3-2.4,2.1-7-.6-13.9-1.1-20.8-1.8-.7,0-1.6-1.3-1.8-2.1-.3-1.3,0-2.6.1-4Z"/>
    </svg>
    
    </div></div></div><div class="x6s0dn4 x9f619 xxk0z11 x6ikm8r xeq5yr9 x1swvt13 x1s85apg xzzcqpx" style="opacity: 1;"><div style="width: 100%;"><div class="" style="width: 100%;"><span class="x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye xl565be xo1l8bm x5n08af x1tu3fi x3x7a5m x10wh9bi x1wdrske x8viiok x18hxmgj" dir="auto" style="line-height: var(--base-line-clamp-line-height); --base-line-clamp-line-height: 20px;"><span class="x1lliihq x193iq5w x6ikm8r x10wlt62 xlyipyv xuxw1ft">BasketBuddy</span></span></div></div></div></div>`;

    toolbar.appendChild(div);

    div.addEventListener("click", () => {
      // Call the exposed function
      console.log("BasketBuddy activated!");
      window.handleCartClick();
    });
  });

  await INSTAGRAM.page.exposeFunction("handleCartClick", async () => {
    INSTAGRAM.setBounds({
      top: 0,
      left: 0,
      width: 960,
      height: 1080,
    });

    console.log("BasketBuddy activated!");

    await BASKET.page.goto("https://www.galaxus.ch/en/cart", {
      waitUntil: "domcontentloaded",
    });

    await HIDDEN.page.goto("https://www.galaxus.ch/", {
      waitUntil: "domcontentloaded",
    });

    await BASKET.page.evaluate(() => {
      document.body.style.zoom = "140%";
      // remove html item
      // const cart =
      //   document.getElementById("cart-items-list").nextElementSibling;

      // console.log("cart", cart);
      // cart.style.display = "none";
    });

    const PAGES = {
      insta: INSTAGRAM.page,
      basket: BASKET.page,
      hidden: HIDDEN.page,
    };

    const FOUND_PRODUCTS = {};

    // Wait for 1 second before taking screenshots
    await sleep(1000);

    let numberOfScreenshots = 10;

    while (numberOfScreenshots > 0) {
      // Capture a screenshot

      await PAGES.insta.screenshot({
        path: `images/screenshot${numberOfScreenshots}.jpg`,
      });

      // Get the list items
      const response = await getVideoDescription({
        systemMessage,
        path: `images/screenshot${numberOfScreenshots}.jpg`,
        page: PAGES.insta,
      });

      const newItems = filterAddItems(response, FOUND_PRODUCTS);

      //add items to basket
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];

        const addItem = await addItemToBasket(item, PAGES.hidden);

        console.log(addItem);

        if (!addItem) continue;

        const scrollPosition = await PAGES.basket.evaluate(() => {
          return {
            x: window.scrollX,
            y: window.scrollY,
          };
        });

        await PAGES.basket.reload({ waitUntil: "domcontentloaded" });

        await PAGES.basket.evaluate((scrollPosition) => {
          document.body.style.zoom = "140%";
          console.log("reload basket");

          try {
            const cart =
              document.getElementById("cart-items-list").nextElementSibling;

            console.log("cart", cart);
            cart.style.display = "none";
          } catch (error) {
            console.log("error");
          }

          window.scrollTo({
            left: scrollPosition.x,
            top: scrollPosition.y,
            behavior: "instant",
          });
        }, scrollPosition);

        playAudio("./projects/brikeld_steve/bip.mp3");
        console.log("BIP 🛒");

        await sleep(1000);

        await PAGES.basket.evaluate(() => {
          try {
            const cart = document.querySelector("div.cart-item:last-child");
            console.log(cart);

            const rect = cart.getBoundingClientRect();

            if (cart) {
              window.scrollTo({
                top: window.scrollY + rect.top - 200,
                behavior: "smooth",
              });
            }
          } catch (error) {
            console.log("error");
          }
        });
      }

      await sleep(timeBetweenScreenshots);
      numberOfScreenshots--;
    }
  });
})();

async function addItemToBasket(item, page) {
  const { name, description, shopURL } = item;

  try {
    const selector = "button[title='Add to cart']";

    await page.goto(shopURL);
    await page.waitForSelector(selector);
    await page.click(selector);

    const result = true;
    console.log(`🛍️ Item ${name} added to basket `);
    return true;

    return true;
  } catch (error) {
    console.log("Pas de bouton d'ajout au panier");
    return false;
  }
}

function filterAddItems(response, FOUND_PRODUCTS) {
  const { itemsFound } = response;

  let newProducts = [];

  if (!itemsFound) return newProducts;

  itemsFound.forEach((item) => {
    if (!item.shopURL) {
      console.log(`Item ${item.name} has no shopURL`);
      return;
    }

    if (!FOUND_PRODUCTS[item.name]) {
      FOUND_PRODUCTS[item.name] = item;
      newProducts.push(item);
    } else {
      console.log(`🛍️ Item ${item.name} already exists `);
    }
  });

  return newProducts;
}
