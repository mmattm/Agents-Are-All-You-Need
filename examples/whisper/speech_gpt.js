import fs from "fs";
import mic from "mic";
import ffmpeg from "fluent-ffmpeg";
import { openai } from "../../utils.js";
import { generate_speech } from "../../utils.js";

(async () => {
  //  prompt
  const messages = [
    {
      role: "system",
      content: `You are an assistant that will receive a message.
      Please just anwser to my question if just few words. Max 20 words.
      always answer in English or French. Possibly in the language of the question.
      `,
    },
  ];

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

  recordingMicInputStream.on("pauseComplete", async function () {
    console.log("Audio recording paused. Conversion to MP3 completed");
    await convertRawToWAV();

    const transcription = await transcribeAudio("output.wav");
    console.log("Transcription: " + transcription);

    // delete the raw file
    fs.unlinkSync("output.raw");
    // Create a new write stream for the next recording
    outputFileStream = fs.createWriteStream("output.raw");
    recordingMicInputStream.pipe(outputFileStream);

    messages.push({
      role: "user",
      content: [
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
    });

    const message = response.choices[0].message;
    const message_text = message.content;

    messages.push({
      role: "assistant",
      content: message_text,
    });

    console.log("🤖 " + message_text + "\n");

    // play audio
    await generate_speech(message_text);

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
    var threshold = 1600; // Set your desired threshold
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

  monitoringMicInstance.start();
})();

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
