import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const setField = async (selector, index, value) => {
  await page.evaluate(({ selector, index, value }) => {
    const el = document.querySelectorAll(selector)[index];
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, { selector, index, value });
};
const click = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(needle) && !b.disabled)?.click();
  }, text);
  await new Promise((r) => setTimeout(r, 400));
};
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.goto("http://127.0.0.1:5173/create/game", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "真实 HTML 小游戏");
await setField(".form-field textarea", 0, "作者上传了一个真正的 HTML 文件，可以按按钮。");
await click("上传 HTML");
await new Promise((r) => setTimeout(r, 300));
const inputs = await page.$$("input[type=file]");
console.log("file inputs:", inputs.length);
await inputs[0].uploadFile("F:\\网站项目\\灵作\\.shots\\test-cover.png");
await new Promise((r) => setTimeout(r, 700));
const inputs2 = await page.$$("input[type=file]");
await inputs2[1].uploadFile("F:\\网站项目\\灵作\\.shots\\test-game.html");
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: ".shots/media-game-editor.png", fullPage: false });
await click("下一步");
await setField(".form-field textarea", 0, "作者上传 HTML 小游戏，使用两个按钮。");
await click("下一步");
await page.click(".rights-check input");
await click("发布作品");
await new Promise((r) => setTimeout(r, 700));
const work = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
console.log("work:", work?.title, work?.meta?.engine);
await page.goto(`http://127.0.0.1:5173/games/${work.slug}/play`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1000));
console.log("iframe:", await page.$$eval("iframe", (nodes) => nodes.length));
const frames = page.frames();
console.log("frames:", frames.length);
for (const frame of frames) {
  const text = await frame.evaluate(() => document.body?.innerText?.slice(0, 120)).catch(() => "");
  if (text) console.log("frame text:", text);
}
await page.screenshot({ path: ".shots/media-game-play.png" });
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
