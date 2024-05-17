let smoothSqueeze = 1
let squeeze = 1;

function paupiere() {
    p.push()

    p.background("black");
    p.curveTightness(-2);
    p.stroke("#00a5cf");
    p.strokeWeight(0);
    p.noFill();

    p.erase();


    smoothSqueeze = lerp(smoothSqueeze, squeeze, amt)

    p.translate(width / 2, height / 2)
    p.scale(1, smoothSqueeze)
    p.translate(-width / 2, -height / 2)

    if (isBlinking) {

        if (blinkProgress < blinkDuration / 2) {
            // Closing animation
            let blinkHeight = easeInOutQuad(blinkProgress, 0, height / 2, blinkDuration / 2);


            p.fill(0);
            p.curve(50, blinkHeight, 50, height / 2, width - 50, height / 2, width - 50, blinkHeight);
            p.curve(50, height - blinkHeight, 50, height / 2, width - 50, height / 2, width - 50, height - blinkHeight);

        } else {
            // Opening animation (reverse)
            let reverseProgress = blinkProgress - blinkDuration / 2;
            let blinkHeight = easeInOutQuad(reverseProgress, height / 2, -height / 2, blinkDuration / 2);
            p.fill(0);
            p.curve(50, blinkHeight, 50, height / 2, width - 50, height / 2, width - 50, blinkHeight);
            p.curve(50, height - blinkHeight, 50, height / 2, width - 50, height / 2, width - 50, height - blinkHeight);
        }

        blinkProgress++;

        // Check if blink animation is complete
        if (blinkProgress >= blinkDuration) {
            isBlinking = false; // Reset blink state
            blinkProgress = 0; // Reset blink progress
        }
    } else {

        p.fill(0);
        p.curve(50, 0, 50, height / 2, width - 50, height / 2, width - 50, 0);
        p.curve(50, height, 50, height / 2, width - 50, height / 2, width - 50, height);
    }

    p.noErase();

    image(p, 0, 0, width, height);

    p.pop()
    // Check if it's time to blink again

}