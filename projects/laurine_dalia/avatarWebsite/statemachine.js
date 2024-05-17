// GLOBAL PUPPETEER loading(true), loading(false)


function isState(newState) {
    return STATE === newState
}


function changeState(newState) {

    if (newState === STATE) return;

    STATE = newState;
    setEyeOffset(0, 0)
    console.log('State changed: ', STATE)

}

function useRandomTimer(callbackFunc, minDelay, maxDelay) {
    // Define a function that generates a random time interval and calls the callback function after that interval
    function randomTimeout() {
        const randomInterval = random(minDelay, maxDelay)
        setTimeout(() => {
            callbackFunc(randomInterval);
            randomTimeout(); // Call randomTimeout again to create a loop
        }, randomInterval * 1000);
    }

    // Start the loop
    randomTimeout();
}