import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

await page.goto("http://127.0.0.1:5173/novels", { waitUntil: "networkidle0" });
const previewButton = await page.$(".novel-row .text-btn");
console.log("preview button visible:", Boolean(previewButton));
if (previewButton) {
  await previewButton.click();
  await new Promise((resolve) => setTimeout(resolve, 300));
}
console.log("preview opened:", await page.$$eval(".novel-preview", (nodes) => nodes.length));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0" });
await page.click(".header-search-icon");
await new Promise((resolve) => setTimeout(resolve, 300));
console.log("overlay stays open:", await page.$$eval(".search-overlay", (nodes) => nodes.length));
await page.keyboard.press("Escape");
await new Promise((resolve) => setTimeout(resolve, 200));
console.log("overlay closed:", await page.$$eval(".search-overlay", (nodes) => nodes.length));

console.log(
  "overflow:",
  await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
);
await browser.close();
