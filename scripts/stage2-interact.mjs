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

// Reader notes + dark theme
await page.goto("http://127.0.0.1:5173/novels/yueliang-weixiuzhan/read/1", {
  waitUntil: "networkidle0",
});
await page.click(".reader-actions .reader-icon-btn:nth-child(2)");
await new Promise((resolve) => setTimeout(resolve, 300));
await page.type(".reader-field input", "不用修得太好，能亮就行。");
await page.type(".reader-field textarea", "这句话像是对所有坏掉的东西说的。");
await page.click(".reader-panel > .btn");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log(
  "notes:",
  await page.$$eval(".reader-note-item", (nodes) => nodes.length),
  await page.evaluate(() => localStorage.getItem("lz:reader-notes")?.slice(0, 80)),
);
await page.screenshot({ path: ".shots/reader-notes.png" });
await page.click(".reader-actions .reader-icon-btn:nth-child(4)");
await new Promise((resolve) => setTimeout(resolve, 250));
const themes = await page.$$(".reader-theme");
if (themes[2]) await themes[2].click();
await new Promise((resolve) => setTimeout(resolve, 250));
console.log("theme:", await page.$eval(".reader-page", (node) => node.className));
await page.screenshot({ path: ".shots/reader-dark.png" });
await page.keyboard.press("Escape");

// Watch time-point comment
await page.goto("http://127.0.0.1:5173/dramas/ai-tongshi-cizhi/watch", {
  waitUntil: "networkidle0",
});
await page.click(".watch-controls .watch-ctrl:last-child");
await new Promise((resolve) => setTimeout(resolve, 300));
await page.type(".watch-comment", "这个晚霞的比喻太好了。");
await page.click(".watch-sheet__actions .btn--primary");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log(
  "watch comment:",
  await page.evaluate(() => localStorage.getItem("lz:comments")?.slice(-120)),
);

// Post comment
await page.goto("http://127.0.0.1:5173/posts/post-1", { waitUntil: "networkidle0" });
await page.type(".comment-form textarea", "我也选了结账，但后来后悔了。");
await page.click(".comment-form .btn--primary");
await new Promise((resolve) => setTimeout(resolve, 300));
console.log(
  "post comment count:",
  await page.$$eval(".comment", (nodes) => nodes.length),
);

// Detail action bar
await page.goto("http://127.0.0.1:5173/tutorials/3-tishi-dianying-duanpian", {
  waitUntil: "networkidle0",
});
await page.click(".action-bar .action-btn");
await new Promise((resolve) => setTimeout(resolve, 250));
console.log("liked:", await page.evaluate(() => localStorage.getItem("lz:liked")));

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
