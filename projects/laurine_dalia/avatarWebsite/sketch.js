//LOADING-SCREEN

let states = {
  idle: "idle",
  thinking: "thinking",

  listening: "listening",
  speaking: "speaking",
};

let amt = 0.04; // lerp smoothness, 0.001 = super smooth, 1= instant

let isBlinking = false;

let STATE;

let blinkProgress = 0;
let blinkDuration = 60;
let p; // Graphics object for the eyelashes
let lastBlinkTime = 0;
let blinkInterval = 2500;

let angle = 0; // Angle for automatic eye movement
let radius = 50;

let eyePos;

let imgSize = 1080;

let easing = 1;

function setup() {
  createCanvas(imgSize, imgSize);
  p = createGraphics(imgSize, imgSize);
  rs = random(1000);
  changeState(states.idle);
  eyePos = createVector(width / 2, height / 2);
  positionEye(eyePos.x, eyePos.y);

  useRandomTimer(
    (delay) => {
      if (isState(states.idle)) {
        const dir = random([-1, 1, 0, 0]);
        const amp = random(50, 200);

        setEyeOffset(dir * amp, 0);
      } else if (isState(states.speaking)) {
        const eyeCenter = [0, 0];
        const dir = random([
          [-1, -1],
          [1, 0],
          [-1, 0],
          [0, -1],
          eyeCenter,
          eyeCenter,
          eyeCenter,
        ]);

        const ampX = random(50, 200);
        const ampY = random(50, 200);

        setEyeOffset(dir[0] * ampX, dir[1] * ampY);
      }
    },
    2,
    3
  );

  useRandomTimer(
    () => {
      isBlinking = true;
      blinkDuration = random(30, 60);

      if (isState(states.thinking)) {
        isBlinking = false;
      } else if (isState(states.speaking)) {
        squeeze = random([1.2, 1, 0.6]);
      }
      // isBlinking = false;
    },
    2,
    3
  );
}

function draw() {
  // randomSeed(rs);
  stroke("#FEFEFE");

  console.log(STATE);
  let amt = STATE == "listening" ? 1 : 0;

  easing = lerp(easing, amt, 0.66);
  let easedColor = lerpColor(color("#B4D7E8"), color("#3BEDB7"), easing);

  background(easedColor);

  drawEye(eyePos.x, eyePos.y);
  paupiere();

  // console.log(offX, offY)

  if (isState(states.thinking)) {
    squeeze = map(sin(millis() * 0.02), -1, 1, 0.8, 1.1);
  }
}

function keyPressed() {
  if (key === "t") {
    changeState(states.thinking);
  } else if (key === "l") {
    changeState(states.listening);
  } else if (key === "i") {
    changeState(states.idle);
  } else if (key === "s") {
    changeState(states.speaking);
  }
}
