import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

const setField = async (selector, index, value) => {
  await page.evaluate(
    ({ selector, index, value }) => {
      const el = document.querySelectorAll(selector)[index];
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { selector, index, value },
  );
};
const clickButton = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("button")].find((item) => item.textContent?.includes(needle) && !item.disabled)?.click();
  }, text);
  await new Promise((resolve) => setTimeout(resolve, 400));
};
const clickLink = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("a")].find((item) => item.textContent?.replace(/\s+/g, "").includes(needle.replace(/\s+/g, "")))?.click();
  }, text);
  await new Promise((resolve) => setTimeout(resolve, 500));
};

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.goto("http://127.0.0.1:5173/create/novel", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 300));
await setField(".form-field input", 0, "雨停之前");
await setField(".form-field textarea", 0, "一个只在雨天营业的修伞铺，老板修不好自己的伞。");
const fileInputs = await page.$$("input[type=file]");
await fileInputs[0].uploadFile("F:\\网站项目\\灵作\\.shots\\test-cover.png");
await new Promise((resolve) => setTimeout(resolve, 800));
console.log("cover preview:", await page.$$eval(".editor-preview .cover__image", (nodes) => nodes.length));
await page.click(".writing-title");
await page.keyboard.down("Control");
await page.keyboard.press("a");
await page.keyboard.up("Control");
await page.keyboard.type("第一章 雨");
await page.click(".writing-textarea");
await page.keyboard.type("雨从傍晚开始下。修伞铺的老板把最后一把伞撑开，又合上。\n\n他没有伞。他只是想让路过的人以为，这里还开着。");
await clickButton("加一章");
console.log("chapters:", await page.$$eval(".chapter-row", (nodes) => nodes.length));
await page.click(".writing-title");
await page.keyboard.down("Control");
await page.keyboard.press("a");
await page.keyboard.up("Control");
await page.keyboard.type("第二章 伞");
await page.click(".writing-textarea");
await page.keyboard.type("第二天，雨停了。门口多了一把没有主人的伞。\n\n老板把伞收进来，第一次给自己留了一把。");
await page.screenshot({ path: ".shots/media-novel-workspace.png", fullPage: false });
await clickButton("下一步");
await setField(".form-field textarea", 0, "请写一个雨天修伞铺的短篇，结尾停在动作上。");
await clickButton("下一步");
await page.click(".rights-check input");
await clickButton("发布作品");
await new Promise((resolve) => setTimeout(resolve, 700));
const works = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]"));
console.log("work chapters:", works[0]?.meta?.chapters);
await page.goto(`http://127.0.0.1:5173/novels/${works[0].slug}`, { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 500));
console.log("detail cover image:", await page.$$eval(".novel-detail .cover__image", (nodes) => nodes.length));
await page.screenshot({ path: ".shots/media-novel-detail.png", fullPage: false });
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("分享"))?.click();
});
await new Promise((resolve) => setTimeout(resolve, 800));
await page.screenshot({ path: ".shots/media-novel-poster.png" });
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("下载 3:4 海报"))?.click();
});
await new Promise((resolve) => setTimeout(resolve, 1200));
console.log("poster toast:", await page.$$eval(".toast", (nodes) => nodes.map((node) => node.textContent?.trim())));
await page.evaluate(() => document.querySelector(".share-backdrop")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
await clickLink("开始阅读");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("reader url:", page.url());
await page.screenshot({ path: ".shots/media-novel-reader.png" });
await clickButton("下一章");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("reader next:", page.url(), await page.evaluate(() => document.body.textContent.includes("第二天，雨停了")));
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
