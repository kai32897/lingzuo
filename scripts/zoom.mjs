import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0" });
await page.evaluate(() => {
  const main = document.querySelector(".challenge-main");
  main?.scrollIntoView({ block: "center" });
});
await new Promise((resolve) => setTimeout(resolve, 300));
const box = await page.$eval(".challenge-top-works", (el) => el.getBoundingClientRect().toJSON());
console.log(box);
await page.screenshot({
  path: ".shots/challenge-zoom.png",
  clip: { x: box.x, y: box.y, width: box.width, height: box.height },
});
await browser.close();
