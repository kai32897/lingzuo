import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto("http://127.0.0.1:5173/games/bianlidian-yeban", { waitUntil: "networkidle0" });
await page.click(".action-btn--report");
await new Promise((resolve) => setTimeout(resolve, 250));
console.log("report modal:", await page.$$eval(".report-modal", (nodes) => nodes.length));
const reasons = await page.$$(".report-reason");
if (reasons[0]) await reasons[0].click();
await page.click(".modal__actions .btn--primary");
await new Promise((resolve) => setTimeout(resolve, 250));
console.log("report toast:", await page.$$eval(".toast", (nodes) => nodes.map((node) => node.textContent?.trim())));

await page.goto("http://127.0.0.1:5173/games/dianti-13", { waitUntil: "networkidle0" });
console.log("spoiler buttons:", await page.$$eval(".comment__spoiler", (nodes) => nodes.length));
const spoiler = await page.$(".comment__spoiler");
if (spoiler) await spoiler.click();
await new Promise((resolve) => setTimeout(resolve, 200));
console.log("spoiler revealed:", await page.$$eval(".comment__spoiler", (nodes) => nodes.length));

await page.goto("http://127.0.0.1:5173/challenges/no-dialogue", { waitUntil: "networkidle0" });
console.log(
  "challenge rules:",
  await page.$$eval(".challenge-brief-grid strong", (nodes) => nodes.map((node) => node.textContent)),
);
console.log(
  "challenge extra types:",
  await page.$$eval(".challenge-extra .type-sticker", (nodes) => nodes.map((node) => node.textContent?.trim())),
);

await page.goto("http://127.0.0.1:5173/novels/yueliang-weixiuzhan/read/1", { waitUntil: "networkidle0" });
await page.click(".reader-actions .reader-icon-btn:nth-child(4)");
await new Promise((resolve) => setTimeout(resolve, 200));
const themes = await page.$$(".reader-theme");
if (themes[2]) await themes[2].click();
await new Promise((resolve) => setTimeout(resolve, 300));
await page.keyboard.press("Escape");
await new Promise((resolve) => setTimeout(resolve, 200));
console.log("reader theme:", await page.$eval(".reader-page", (node) => node.className));
await page.screenshot({ path: ".shots/reader-dark-final.png" });

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0" });
await page.screenshot({ path: ".shots/home-final-1440.png", fullPage: true });
console.log("home height:", await page.evaluate(() => document.documentElement.scrollHeight));

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
