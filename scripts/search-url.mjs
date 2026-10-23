import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

await page.goto("http://127.0.0.1:5173/search?q=AI%20%E4%BF%AE%E4%BB%99%E6%B8%B8%E6%88%8F&sort=hot", {
  waitUntil: "networkidle0",
});
await new Promise((resolve) => setTimeout(resolve, 400));
const tabs = await page.$$(".search-tab");
await tabs[1].click();
await new Promise((resolve) => setTimeout(resolve, 500));
console.log("after tab:", page.url());
console.log(
  "result types:",
  await page.$$eval(".result-card .type-sticker", (nodes) => nodes.map((node) => node.textContent?.trim())),
);
await page.reload({ waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("after reload:", page.url());
console.log(
  "active tab:",
  await page.$eval(".search-tab.is-active", (node) => node.textContent?.trim()),
);
console.log(
  "active sort:",
  await page.$eval(".sort-btn.is-active", (node) => node.textContent?.trim()),
);

const sortButtons = await page.$$(".sort-btn");
await sortButtons[0].click();
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("after sort:", page.url());
console.log(
  "results count:",
  await page.$$eval(".result-card", (nodes) => nodes.length),
);
await browser.close();
