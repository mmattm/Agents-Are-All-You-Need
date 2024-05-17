export async function clap(page) {
    await page.keyboard.press('1');
}

export async function repeat(times, asyncFunc) {
    for (let i = 0; i < times; i++) {
        await asyncFunc();
    }
}
