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
  await new Promise((r) => setTimeout(r, 350));
};
await p.goto("http://127.0.0.1:5173/create/drama", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "全屏按钮测试");
await setField(".form-field textarea", 0, "验证视频播放器的全屏按钮直接进入沉浸连刷。");
const files = await p.$$("input[type=file]");
await files[1].uploadFile("F:\\网站项目\\灵作\\.shots\\test-drama.webm");
await new Promise((r) => setTimeout(r, 800));
await click("下一步");
await click("下一步");
await p.click(".rights-check input");
await click("发布作品");
await new Promise((r) => setTimeout(r, 600));
const work = await p.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
await p.goto(`http://127.0.0.1:5173/dramas/${work.slug}`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 700));
console.log("overlay buttons", await p.$$eval(".drama-video-fullscreen", (n) => n.length));
console.log("side fullscreen links", await p.$$eval(".drama-player__side-actions a", (n) => n.map((x) => x.textContent?.trim())));
console.log("bottom text", await p.evaluate(() => document.body.textContent.includes("进入沉浸观看")));
await p.click(".drama-video-fullscreen");
await new Promise((r) => setTimeout(r, 500));
console.log("url", p.url());
await p.screenshot({ path: ".shots/fullscreen-button-watch.png" });
console.log("errors", errs);
await b.close();
