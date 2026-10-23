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
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); else if (m.text().includes("LZ_TUTORIAL")) console.log("BROWSER:", m.text()); });
const setField = async (selector, index, value) => {
  await page.evaluate(({ selector, index, value }) => {
    const el = document.querySelectorAll(selector)[index];
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, { selector, index, value });
};
const click = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("button")].find((b) => b.textContent?.trim().includes(needle) && !b.disabled)?.click();
  }, text);
  await new Promise((r) => setTimeout(r, 400));
};
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.goto("http://127.0.0.1:5173/create/tutorial", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "图文视频教程测试");
await setField(".form-field textarea", 0, "一个同时包含文字、图片和视频的真实教程。");
await setField(".form-field input", 3, "一条可以发布的过程记录");
await setField(".form-field textarea", 1, "先定光：只留一盏灯。\n再写三句话：让人物先动起来。");
await click("文字");
await setField(".block-editor textarea", 0, "这是一段真实写入的教程正文，不是占位。");
await click("图片");
const inputs1 = await page.$$("input[type=file]");
console.log("after image inputs:", inputs1.length);
await inputs1[1].uploadFile("F:\\网站项目\\灵作\\.shots\\test-cover.png");
await new Promise((r) => setTimeout(r, 800));
await click("视频");
const inputs2 = await page.$$("input[type=file]");
console.log("after video inputs:", inputs2.length);
await inputs2[2].uploadFile("F:\\网站项目\\灵作\\.shots\\test-drama.webm");
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: ".shots/media-tutorial-editor.png", fullPage: false });
await click("下一步");
await setField(".form-field textarea", 0, "用三句话写一个雨夜场景。");
await click("下一步");
await page.click(".rights-check input");
await click("发布作品");
await new Promise((r) => setTimeout(r, 700));
const work = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
console.log("contents:", await page.evaluate(() => localStorage.getItem("lz:user-contents")));
await page.goto(`http://127.0.0.1:5173/tutorials/${work.slug}`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900));
console.log("blocks text:", await page.evaluate(() => document.body.textContent.includes("这是一段真实写入的教程正文")));
console.log("debug content:", await page.evaluate(async () => {
  const works = JSON.parse(localStorage.getItem("lz:published-works") || "[]");
  const mod = await import("/src/lib/userContent.ts");
  const content = mod.getUserContent(works[0]?.id);
  const raw = JSON.parse(localStorage.getItem("lz:user-contents") || "{}");
  return { id: works[0]?.id, fromLib: content, rawKeys: Object.keys(raw), rawBlocks: raw[works[0]?.id]?.blocks?.length };
}));
console.log("blocks image:", await page.$$eval(".tutorial-blocks img", (nodes) => nodes.length));
console.log("blocks video:", await page.$$eval(".tutorial-blocks video", (nodes) => nodes.length));
await page.screenshot({ path: ".shots/media-tutorial-detail.png", fullPage: true });
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
