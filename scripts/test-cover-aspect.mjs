import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
const setField = async (selector, index, value) => {
  await p.evaluate(({ selector, index, value }) => {
    const el = document.querySelectorAll(selector)[index];
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, { selector, index, value });
};
const click = async (text) => {
  await p.evaluate((needle) => {
    [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(needle) && !b.disabled)?.click();
  }, text);
  await new Promise((r) => setTimeout(r, 300));
};
await p.goto("http://127.0.0.1:5173/create/novel", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "比例封面测试");
await setField(".form-field textarea", 0, "测试上传九比十六封面后，卡片和详情是否按竖版显示。");
await click("9:16 · 1080×1920");
const inputs = await p.$$("input[type=file]");
await inputs[0].uploadFile("F:\\网站项目\\灵作\\.shots\\test-cover.png");
await new Promise((r) => setTimeout(r, 900));
const previewAspect = await p.$eval(".editor-preview__cover", (n) => getComputedStyle(n).aspectRatio);
console.log("preview aspect", previewAspect);
await click("下一步");
await click("下一步");
await p.click(".rights-check input");
await click("发布作品");
await new Promise((r) => setTimeout(r, 600));
const work = await p.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
console.log("cover", work?.cover);
await p.goto("http://127.0.0.1:5173/novels/" + work.slug, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 500));
console.log("hero aspect", await p.$eval(".novel-hero__cover", (n) => getComputedStyle(n).aspectRatio));
console.log("hero image", await p.$$eval(".novel-hero__cover .cover__image", (n) => n.length));
await p.goto("http://127.0.0.1:5173/u/linyi", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 400));
console.log("card aspect", await p.$eval(".work-card__media", (n) => getComputedStyle(n).aspectRatio));
console.log("errors", errs);
await b.close();
