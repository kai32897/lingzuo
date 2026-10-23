import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
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
const upload = async (index, path) => {
  const inputs = await page.$$("input[type=file]");
  if (!inputs[index]) throw new Error(`file input ${index} missing (${inputs.length})`);
  await inputs[index].uploadFile(path);
  await new Promise((resolve) => setTimeout(resolve, 900));
};

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(async () => {
  localStorage.clear();
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase("lingzuo-media");
    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });
});

await page.goto("http://127.0.0.1:5173/create/drama", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 300));
await setField(".form-field input", 0, "测试视频短剧");
await setField(".form-field textarea", 0, "一段真正上传了视频的短剧，用来测试封面、播放和连刷。");
await setField(".form-field input", 2, "1");
await new Promise((resolve) => setTimeout(resolve, 250));
console.log("file inputs:", (await page.$$("input[type=file]")).length);
await upload(0, "F:\\网站项目\\灵作\\.shots\\test-cover.png");
await upload(1, "F:\\网站项目\\灵作\\.shots\\test-drama.webm");
console.log("cover preview:", await page.$$eval(".editor-preview .cover__image", (nodes) => nodes.length));
await setField(".form-field textarea", 1, "旁白：雨夜，屏幕亮了。\n客人：还有房间吗？\n店员：只剩一间。");
await clickButton("下一步");
await setField(".form-field textarea", 0, "请写一个雨夜便利店的双人场景，结尾停在动作上。");
await clickButton("下一步");
await page.click(".rights-check input");
await clickButton("发布作品");
await new Promise((resolve) => setTimeout(resolve, 700));
console.log("success:", await page.$eval(".create-success h1", (node) => node.textContent));
const works = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]"));
console.log("work:", works[0]?.title, works[0]?.meta?.episodes?.[0]?.videoId, works[0]?.cover?.imageId);
await page.goto(`http://127.0.0.1:5173/dramas/${works[0].slug}`, { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 700));
console.log("detail cover image:", await page.$$eval(".drama-detail .cover__image", (nodes) => nodes.length));
console.log("detail video:", await page.$$eval("video.drama-video", (nodes) => nodes.length));
await page.screenshot({ path: ".shots/media-drama-detail.png", fullPage: false });
await page.goto(`http://127.0.0.1:5173/dramas/${works[0].slug}/watch`, { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 700));
console.log("watch video:", await page.$$eval("video.watch-phone__video", (nodes) => nodes.length));
await page.screenshot({ path: ".shots/media-drama-watch.png" });
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
