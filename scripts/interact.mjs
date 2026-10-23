import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:5173";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const errors = [];
const page = await browser.newPage();
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
await page.setViewport({ width: 1440, height: 1000 });

// Desktop search dropdown
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await page.click("[data-global-search]");
await page.type("[data-global-search]", "即梦", { delay: 40 });
await new Promise((resolve) => setTimeout(resolve, 500));
const desktopSuggestions = await page.$$eval(".searchbox__row", (rows) => rows.length);
await page.screenshot({ path: ".shots/desktop-search-panel.png", clip: { x: 700, y: 0, width: 740, height: 500 } });
await page.keyboard.press("Enter");
await new Promise((resolve) => setTimeout(resolve, 800));
console.log("desktop suggestions:", desktopSuggestions, "→ url:", page.url());

// Search page empty input state
await page.goto(BASE + "/search", { waitUntil: "networkidle0" });
await page.screenshot({ path: ".shots/search-start-1440.png", fullPage: true });
console.log("search start visible:", await page.$$eval(".search-start__cat", (nodes) => nodes.length));

// Interaction: slot roll + recommendation dismiss
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
const before = await page.$eval(".slot__sentence", (node) => node.textContent);
await page.click(".slot__roll-btn");
await new Promise((resolve) => setTimeout(resolve, 700));
const after = await page.$eval(".slot__sentence", (node) => node.textContent);
console.log("slot rolled:", before !== after);
const recCountBefore = await page.$$eval(".rec-grid .work-card", (nodes) => nodes.length);
await page.evaluate(() => {
  const button = document.querySelector(".rec-grid .work-card__dismiss");
  if (button instanceof HTMLElement) button.click();
});
await new Promise((resolve) => setTimeout(resolve, 300));
const toastText = await page.$$eval(".toast", (nodes) => nodes.map((node) => node.textContent?.trim()));
const recCountAfter = await page.$$eval(".rec-grid .work-card", (nodes) => nodes.length);
console.log("dismiss:", recCountBefore, "→", recCountAfter, "toast:", toastText[0]?.slice(0, 40));

// Category follow
await page.goto(BASE + "/games", { waitUntil: "networkidle0" });
const followBefore = await page.$eval(".category-hero__actions .btn", (node) => node.textContent?.trim());
await page.click(".category-hero__actions .btn");
await new Promise((resolve) => setTimeout(resolve, 250));
const followAfter = await page.$eval(".category-hero__actions .btn", (node) => node.textContent?.trim());
const storedFollow = await page.evaluate(() => localStorage.getItem("lz:followed-categories"));
console.log("follow:", followBefore, "→", followAfter, "stored:", storedFollow);

// Mobile overlay
const mobile = await browser.newPage();
mobile.on("pageerror", (error) => errors.push(`mobile pageerror: ${error.message}`));
await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await mobile.goto(BASE + "/", { waitUntil: "networkidle0" });
await mobile.click(".header-search-icon");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("mobile overlay open:", await mobile.$$eval(".search-overlay", (nodes) => nodes.length));
await mobile.screenshot({ path: ".shots/mobile-overlay.png" });
await mobile.type(".search-overlay__form input", "月亮", { delay: 50 });
await new Promise((resolve) => setTimeout(resolve, 450));
await mobile.screenshot({ path: ".shots/mobile-overlay-suggest.png" });
const mobileSuggestions = await mobile.$$eval(".suggest-row", (nodes) => nodes.length);
await mobile.keyboard.press("Enter");
await new Promise((resolve) => setTimeout(resolve, 700));
console.log("mobile suggestions:", mobileSuggestions, "→ url:", mobile.url());

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
