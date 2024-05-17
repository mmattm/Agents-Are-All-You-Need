let smoothOffX
let smoothOffY
let smoothScale = 1
let smoothPupille = 1
let strokeThick = 4

function positionEye(x, y) {
    smoothOffY = y
    smoothOffX = x
}

let offY = 0
let offX = 0

function setEyeOffset(oX, oY) {
    offY = oY;
    offX = oX;
}


function drawEye(x, y) {


    push()
    fill("#3074AE");
    fill(150, 150, 250, 150);
    strokeWeight(strokeThick);


    let scaleTarget = 1
    let scalePupille = 1

    if (isState(states.thinking)) {
        let t = millis() * 0.01
        let amp = 40
        offY = sin(t) * amp * 0.5

        offY -= 150;

        offX = cos(t) * amp

        scaleTarget = 1.1
        scalePupille = 2;
    }
    if (isState(states.idle)) {

    } else if (isState(states.listening)) {
        scalePupille = 2;
    }

    smoothOffX = lerp(smoothOffX, offX + x, amt)
    smoothOffY = lerp(smoothOffY, offY + y, amt)
    smoothScale = lerp(smoothScale, scaleTarget, amt)
    smoothPupille = lerp(smoothPupille, scalePupille, amt)

    translate(smoothOffX, smoothOffY);

    scale(1.6 * smoothScale)
    ellipse(0, 0, 230);
    // let eyeX, eyeY; // Declare eyeX and eyeY variables

    // if (keyIsDown(69)) { // Check if "E" key is pressed
    //     // eyeX = centerX + cos(angle) * radius;
    //     eyeX = centerX;
    //     eyeY = centerY + sin(angle) * radius;
    // } else { // If "E" key is not pressed, keep the pupil in the center
    //     eyeX = centerX;
    //     eyeY = centerY;
    // }
    fill(0);
    ellipse(0, 0, 80 * smoothPupille);

    pop()
}