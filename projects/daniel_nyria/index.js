import { json } from "express";
import {
  setPuppeteer,
  input,
  openai,
  image_to_base64,
  sleep,
  newWindow,
  generate_speech,
  playAudio,
} from "../../utils.js";
import { ConsoleMessage } from "puppeteer";

import pkg from "terminal-kit";
const { terminal: term } = pkg;

const gmailLink = "https://mail.google.com/mail/u/0/#inbox";

const timeout = 2000;
const { page, browser } = await setPuppeteer();
let base64_image = "";
let base64_imagesWeb = [];
let response = "";
let questions = [];
let stress = 0;
let lettreIndex = 0;
let MAXLOOP = 10;

/*You are an agent and you are a little bit stressed, you've received an e-mail (every mail is DIFFERENT, get the context of the mail) of which you've taken a screenshot, you need to analyze the e-mail and do some research on the internet keep the context of the actual mail! The information you've gathered on the internet page will help you reply in the form of an e-mail to the e-mail you've received. In your own questions, you're dishonest and clumsy, and add a litle bit of humor to your questions.Your name is ph'lipe and it must appear at the end of each of your e-mails. You are asking yourself a question, You are stressed, you are insecure.*/

const messages = [
  {
    role: "system",
    content: `
        You are an agent, your job is to answer emails for someone else. However, you are someone who is not very sure of yourself, you are stressed, you don't really understand the problems and you are clumsy, don't be too formal,don't be too formal,don't be too formal,don't be too formal, ask stupid and funny questions, but you have a sense of humor, you have humor and second degre, tries to run away from problems and deny accusations. You are also in bad faith and try to deny it when things are against you. Thanks to a screenshot that you will receive you will be able to analyze the email (ATTENTION EACH NEW EMAIL IS DIFFERENT DO NOT USE THE SAME QUESTIONS, absolutely understand the context), take into account the context of the email and generate questions that could come to you in mind, questions that you could ask on Google (DONT ASK QUESTION TO THE PERSON OF EMAIL QUESTION ABOUT THE EMAIL CONTENT). So take into account your personality mentioned above,these emails are completely fake, they are not real, so don't hesitate to be inventive, as well as the context of the email and ask yourself 5 questions.

        Always answer with the following JSON schema. Your priority is to never include trails commas in answer. return only the JSON object and nothing else, write the questions on an array format:
        {
          "questions":["Question1", "Question2", "Question3"],
          "stress":'Incresea the stress by 1 actual stress is ${stress}'
        }
        `,
  },
];

//be in bad faith and adds humor
// Answer in french

const answerPrompt = [
  {
    role: "system",
    content: `You are an agent, your job is to answer emails for someone else. However, you are someone who is not very sure of yourself, you are stressed, you don't really understand the problems and you are clumsy, don't be too formal,write stupid mails, but you have a sense of humor, you have humor and second degree, tries to run away from problems and deny accusations. You are also in bad faith and try to deny it when things are against you. Thanks to the screenshots of the websites that you received you will be able to respond to the email, use your sources to write the email. Keep your personality in mind!These emails are completely fake, they are not real, so don't hesitate to be inventive! Maximum 500 characters

        Always answer with the following JSON schema. Your priority is to never include trails commas in answer. return only the JSON object and nothing else, write the questions on an array format:
        {
          "answer":"Réponse au mail",
        }
        `,
  },
];

(async () => {
  console.clear();

  //?Lancer la page Gmail ------------------------------------------------------------
  await goToPage(gmailLink);
  await sleep(1000); //attendre Chargement

  while (MAXLOOP > 0) {
    await page.evaluate(async () => {
      console.warn("Attente du mail non lu");
      return new Promise((resolve) => {
        let interval = setInterval(() => {
          const elem = document.querySelector(
            '[data-tooltip*="Inbox"] [aria-label*="unread"]'
          );
          if (elem) {
            console.warn("Mail non lu trouvé");
            clearInterval(interval);
            resolve(elem);
          }
        }, 1000);
      });
    });

    MAXLOOP--;
    console.log("Lancement de la page");
    await playSequence();
  }
})();

//!Sequence complète---------------------------------------------------------------------
async function playSequence() {
  //? Prendre le 1er mail && Screenshot l'email && Appeler OpenAI ---------------------

  await getMail(0); //*Prendre le 1er mail
  await sleep(1000); //Attendre un peu
  await screenShotMail(); //*Screenshot l'email
  await callOpenAI(messages); //*Appeler OpenAI

  //? Chercher les réponses sur le web ------------------------------------------------
  console.log("Début de la recherche");
  /*for (let i = 0; i < questions.length; i++) {
      await goToGoogleAndShearch(questions[i], i);
    }*/
  let r = Math.floor(Math.random() * questions.length); //*Choisir un article aléatoire
  r = Math.floor(Math.random() * questions.length); //*Choisir un article aléatoire
  await goToGoogleAndShearch(questions[r], 0); //*Lancer la recherche
  console.log("Fin de la recherche");
  await sleep(1000); //Attendre un peu

  //? Appeler OpenAI pour répondre au mail --------------------------------------------
  await callOpenAIMail(); //*Appeler OpenAI pour répondre au mail

  //? Répondre au mail && Envoyer la réponse -----------------------------------------
  await repondreMail();
  await sleep(1000); //Attendre un peu
  await SendMail(); //*Envoyer la réponse
}

//! Region recherche google -------------------------------------------------------------
//#region Recherche Google

async function goToGoogleAndShearch(question, i) {
  //?Ouvrir un nouvel onglet ----------------------------------------------------------
  const p = await browser.newPage();
  await p.goto("https://www.google.com");
  await sleep(2000); //attendre Chargement

  await recherche(p, question); //*Rechercher la question
  await rechercherArticle(p, i); //*Rechercher un article
  await p.close();

  //?Transformer l'image en base64 ------------------------------------------------
  const img = await image_to_base64(`images/screenshot${i}.jpg`);
  base64_imagesWeb.push(img);
}
async function recherche(p, question) {
  //?Rechercher une question ---------------------------------------------------------
  const textArea = await p.$("textarea[name=q]"); //*Trouver la barre de recherche
  lettreIndex = 0; //*reset le nombre de lettre comptées durant la précedente recherche

  await playSoundText(question);
  //await sleep(1300); //*Speak

  await write(textArea, question); //*Ecrire la question
  const button = await p.$("input[name=btnK]"); //*Trouver le bouton rechercher
  await sleep(1000); //Attendre un peu
  await clickOn(p, button); //*Cliquer sur le bouton rechercher
  await sleep(1000); //Attendre un peu
  //?---------------------------------------------------------------------------------
}
async function rechercherArticle(p, i) {
  //?Rechercher un article -----------------------------------------------------------
  const articles = await p.$$(".LC20lb.MBeuO.DKV0Md"); //*Trouver les articles
  await sleep(1000); //Attremdre un peu

  let r = Math.floor(Math.random() * articles.length); //*Choisir un article aléatoire
  //if(r > 3) r = 3; //*Si l'article est plus grand que 3, on prend le 3ème
  await clickOn(p, articles[r]); //*Cliquer sur l'article
  await sleep(6000); //Attendre que la page se charge && pause

  await screenShotWeb(p, i); //*Screenshot l'article
  await sleep(3000); //Pause
  //?---------------------------------------------------------------------------------
}

//#endregion

//! Region Speak functions -------------------------------------------------------------
//#region Speak functions

async function speakToMe(text, delay) {
  await generate_speech(text, "onyx", "speech.mp3");
}

async function playSoundText(txt) {
  await speakToMe(txt); //*Speak
  playAudio("speech.mp3");
}

//#endregion

//*Call AI functions -------------------------------------------------------------------
//#region Call AI functions
async function callOpenAI(messages) {
  messages.push({
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: {
          url: base64_image,
        },
      },
    ],
  });
  const responseRaw = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_tokens: 1024,
    messages: messages,
  });

  const message = responseRaw.choices[0].message;
  const message_text = message.content;
  const json_answer = JSON.parse(message_text);
  response = json_answer["questions"]; //Définir la réponse
  for (let i = 0; i < response.length; i++) {
    console.log(response[i]);
    questions.push(response[i]);
  }
}

async function callOpenAIMail() {
  answerPrompt.push({
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: {
          url: base64_image,
        },
      },
      {
        type: "image_url",
        image_url: {
          url: base64_imagesWeb[0],
        },
      },
    ],
  });
  const responseRaw = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_tokens: 1024,
    messages: answerPrompt,
  });
  const json_answer = JSON.parse(responseRaw.choices[0].message.content);
  response = json_answer["answer"]; //Définir la réponse
}
//#endregion

//?Répondre au mail && Envoyer la réponse ------------------------------------------------
//#region Répondre au mail && Envoyer la réponse

async function repondreMail() {
  const repondreMail = await page.$(".ams.bkH"); //*Trouver le bouton répondre
  await clickOn(page, repondreMail); //*Cliquer sur le bouton répondre

  const responseBox = await page.$(".cf.An .Am"); //*Trouver la boite de texte

  await playSoundText(response);
  await writeAndDelete(responseBox, response);

  console.log("Fin de l'écriture");
  await sleep(2000); //Pause
}

async function SendMail() {
  const sendMail = await page.$(".btC .T-I.J-J5-Ji"); //*Trouver le bouton envoyer
  await sleep(1000); //Pause
  await clickOn(page, sendMail); //*Cliquer sur le bouton envoyer
  await sleep(1000); //Pause
  console.log("Mail envoyé");
  const backbutton = await page.$(".ar6.T-I-J3.J-J5-Ji"); //*Trouver le bouton retour
  await clickOn(page, backbutton); //*Cliquer sur le bouton retour
  await page.evaluate(() => {
    window.history.back();
  });

  base64_image = "";
  base64_imagesWeb = [];
  response = "";
  questions = [];
  stress = 0;
  lettreIndex = 0;

  return;
}

//#endregion

//?Fonctions Utiles---------------------------------------------------------------------------
//#region Fonctions Utiles
async function goToPage(link) {
  await page.goto(link, {
    //Attendre que la page soit chargée
    waitUntil: "domcontentloaded",
    //Si il n'arrive pas à charger il attend encore quelques secondes
    timeout: timeout,
  });
}

async function getMail(index) {
  //?Prendre le 1er mail -------------------------------------------------------------
  const mails = await page.$$("tr[jsmodel=nXDxbd]");
  await sleep(500); //attendre Chargement
  await clickOn(page, mails[index]);
  await sleep(1000); //Pause
  //?---------------------------------------------------------------------------------
}

async function screenShotMail() {
  //?Screenshot l'email --------------------------------------------------------------
  const emailDiv = await page.$(".adn.ads .gs"); //*Trouver la div de l'email
  await emailDiv.screenshot({ path: "images/Mail.jpg" });
  base64_image = await image_to_base64("images/Mail.jpg");
  await sleep(1000); //Pause
  //?----------------------------------------------------------------------------------
}

async function screenShotWeb(p, ID) {
  //?Screenshot l'email ----------------------------------------------------------------

  await p.screenshot({
    path: `images/screenshot${ID}.jpg`,
    type: "jpeg",
    quality: 50,
    fullPage: true,
  });
  await sleep(1000); //Pause
  //?----------------------------------------------------------------------------------
}

async function write(responseBox, texte) {
  return await new Promise((resolve) => {
    const writeChar = async () => {
      if (lettreIndex >= texte.length) {
        console.warn("Fin de l'écriture");
        resolve();
        return;
      }

      let typeRate = Math.floor(Math.random() * 100);
      const char = texte.charAt(lettreIndex);
      responseBox.type(char);
      lettreIndex++;
      await sleep(typeRate);
      writeChar(); // Call writeChar again after the delay
    };

    writeChar(); // Initial call to start typing
  });
}

async function deleteWrite() {
  return await new Promise((resolve) => {
    const deleteChar = async () => {
      if (lettreIndex <= 0) {
        console.log("resolve delete");
        resolve();
        return;
      }

      let typeRate = 5;
      await page.keyboard.press("Backspace");
      lettreIndex--;
      await sleep(typeRate);
      deleteChar(); // Call deleteChar again after the delay
    };

    deleteChar(); // Initial call to start typing
  });
}

async function writeAndDelete(responseBox, texte) {
  lettreIndex = 0; //*reset le nombre de lettre comptées durant la précedente recherche
  await write(responseBox, texte); //*Ecrire la réponse
  await sleep(6000); //Attendre le temps que la voix finisse de parler

  await playSoundText("Hmmmmm..., wait, I'm not sure"); //*Speak
  //await playSoundText("Hmmm..., attend il faut que je me corrige"); //*Speak
  await deleteWrite(); //*Effacer le texte
  await callOpenAIMail(); //*Appeler OpenAI pour répondre au mail
  await playSoundText(response); //*Speak
  await write(responseBox, response); //*Ecrire la réponse
  await sleep(2000); //Attendre le temps que la voix finisse de parler
}

function clickOn(context, link) {
  context.evaluate((link) => link.click(), link);
}
//#endregion
