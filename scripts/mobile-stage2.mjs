import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

await page.goto("http://127.0.0.1:5173/games/bianlidian-yeban", { waitUntil: "networkidle0" });
await page.screenshot({ path: ".shots/mobile-game-detail-top.png" });
const bars = await page.evaluate(() => {
  const action = document.querySelector(".action-bar")?.getBoundingClientRect();
  const tab = document.querySelector(".mobile-tabbar")?.getBoundingClientRect();
  return { action, tab };
});
console.log("bars:", JSON.stringify(bars));

await page.goto("http://127.0.0.1:5173/novels/yueliang-weixiuzhan/read/1", { waitUntil: "networkidle0" });
await page.click(".reader-actions .reader-icon-btn:nth-child(4)");
await new Promise((resolve) => setTimeout(resolve, 250));
const themes = await page.$$(".reader-theme");
if (themes[2]) await themes[2].click();
await new Promise((resolve) => setTimeout(resolve, 350));
console.log("theme:", await page.$eval(".reader-page", (node) => node.className));
await page.screenshot({ path: ".shots/reader-dark-mobile.png" });

await browser.close();
