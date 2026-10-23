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
await setField(".form-field input", 0, "分集视频测试");
await setField(".form-field textarea", 0, "测试可增删剧集后，第一集视频仍然可以正常播放。");
const files = await p.$$("input[type=file]");
console.log("files", files.length);
await files[1].uploadFile("F:\\网站项目\\灵作\\.shots\\test-drama.webm");
await new Promise((r) => setTimeout(r, 800));
await click("下一步");
await click("下一步");
await p.click(".rights-check input");
await click("发布作品");
await new Promise((r) => setTimeout(r, 600));
const work = await p.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
console.log("episodes", work?.meta?.episodes?.length, "video", Boolean(work?.meta?.episodes?.[0]?.videoId));
await p.goto(`http://127.0.0.1:5173/dramas/${work.slug}`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 700));
console.log("detail video", await p.$$eval("video.drama-video", (n) => n.length));
await p.goto(`http://127.0.0.1:5173/dramas/${work.slug}/watch`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 700));
console.log("watch video", await p.$$eval("video.watch-phone__video", (n) => n.length));
await p.screenshot({ path: ".shots/watch-fullscreen-video.png" });
console.log("errors", errs);
await b.close();
