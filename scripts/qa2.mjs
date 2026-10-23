import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:5173";

const routes = [
  ["game-detail", "/games/bianlidian-yeban", false],
  ["game-play", "/games/bianlidian-yeban/play", true],
  ["drama-detail", "/dramas/ai-tongshi-cizhi", false],
  ["drama-watch", "/dramas/ai-tongshi-cizhi/watch", true],
  ["novel-detail", "/novels/yueliang-weixiuzhan", false],
  ["novel-reader", "/novels/yueliang-weixiuzhan/read/1", true],
  ["tutorial-detail", "/tutorials/3-tishi-dianying-duanpian", false],
  ["tool-detail", "/tools/dreamina", false],
  ["post-detail", "/posts/post-1", false],
  ["topic", "/topics/%E5%8D%81%E4%B8%89%E6%A5%BC%E5%AE%87%E5%AE%99", false],
  ["collection", "/collections/col-1", false],
  ["challenges", "/challenges", false],
  ["challenge-detail", "/challenges/two-buttons", false],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
});

for (const width of [1440, 390]) {
  const page = await browser.newPage();
  await page.setViewport({
    width,
    height: width === 390 ? 844 : 1000,
    deviceScaleFactor: 1,
    isMobile: width === 390,
    hasTouch: width === 390,
  });
  page.on("console", (message) => {
    if (message.type() === "error") console.log("[console]", width, page.url(), message.text());
  });
  page.on("pageerror", (error) => console.log("[pageerror]", width, page.url(), error.message));

  for (const [name, path, immersive] of routes) {
    await page.goto(BASE + path, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.screenshot({
      path: `.shots/${name}-${width}.png`,
      fullPage: !immersive,
    });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim().slice(0, 40),
    }));
    console.log(
      `${name.padEnd(16)} ${width}  overflow=${metrics.overflow}  height=${metrics.height}  ${metrics.title} | ${metrics.h1}`,
    );
  }
  await page.close();
}

// Interaction smoke test
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
page.on("pageerror", (error) => console.log("[interaction pageerror]", error.message));

await page.goto(BASE + "/games/bianlidian-yeban/play", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 1100));
const beforeGame = await page.$eval(".play-scene__text", (node) => node.textContent?.trim().slice(0, 20));
await page.click(".play-choice");
await new Promise((resolve) => setTimeout(resolve, 250));
const afterGame = await page.$eval(".play-scene__text", (node) => node.textContent?.trim().slice(0, 20));
console.log("game choice:", beforeGame, "→", afterGame);

await page.goto(BASE + "/tutorials/3-tishi-dianying-duanpian", { waitUntil: "networkidle0" });
await page.click(".step-check");
await new Promise((resolve) => setTimeout(resolve, 250));
console.log("tutorial step stored:", await page.evaluate(() => localStorage.getItem("lz:tutorial-progress")));

await page.goto(BASE + "/novels/yueliang-weixiuzhan/read/1", { waitUntil: "networkidle0" });
await page.click(".reader-icon-btn:nth-of-type(4)");
await new Promise((resolve) => setTimeout(resolve, 300));
const fontButtons = await page.$$(".reader-setting__options button");
if (fontButtons[2]) await fontButtons[2].click();
await new Promise((resolve) => setTimeout(resolve, 200));
console.log("reader settings open:", await page.$$eval(".reader-panel", (n) => n.length));
console.log("reader prefs:", await page.evaluate(() => localStorage.getItem("lz:reader-prefs")));

await page.goto(BASE + "/tools/dreamina", { waitUntil: "networkidle0" });
const saveBtn = await page.$(".tool-hero__actions .btn--outline");
if (saveBtn) await saveBtn.click();
await new Promise((resolve) => setTimeout(resolve, 200));
console.log("tool saved:", await page.evaluate(() => localStorage.getItem("lz:saved-tools")));

await browser.close();
