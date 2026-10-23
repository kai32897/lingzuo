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
  }, { selector, index, value });
};
const click = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(needle) && !b.disabled)?.click();
  }, text);
  await new Promise((r) => setTimeout(r, 350));
};

await page.goto("http://127.0.0.1:5173/create/game", { waitUntil: "networkidle0" });
const gameLabels = await page.$$eval(".form-field__label", (nodes) => nodes.map((node) => node.textContent?.trim()));
console.log("game labels:", gameLabels);
console.log("cover sizes:", await page.$$eval(".media-size-options button", (nodes) => nodes.map((n) => n.textContent)));

await page.goto("http://127.0.0.1:5173/create/drama", { waitUntil: "networkidle0" });
console.log("episodes before:", await page.$$eval(".episode-media-row", (n) => n.length));
await click("加一集");
console.log("episodes after add:", await page.$$eval(".episode-media-row", (n) => n.length));
await page.click(".episode-delete");
await new Promise((r) => setTimeout(r, 300));
console.log("episodes after delete:", await page.$$eval(".episode-media-row", (n) => n.length));
await click("1:1 · 1080×1080");
const inputs = await page.$$("input[type=file]");
await inputs[0].uploadFile("F:\\网站项目\\灵作\\.shots\\test-cover.png");
await new Promise((r) => setTimeout(r, 900));
const dims = await page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("lingzuo-media", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const records = await new Promise((resolve, reject) => {
    const tx = db.transaction("media", "readonly");
    const request = tx.objectStore("media").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const image = records.filter((item) => item.kind === "image").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!image) return null;
  const bitmap = await createImageBitmap(image.blob);
  return { width: bitmap.width, height: bitmap.height, name: image.name };
});
console.log("cropped cover:", dims);

await page.goto("http://127.0.0.1:5173/create/tutorial", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "无步骤无配方教程");
await setField(".form-field textarea", 0, "这是一个不写步骤、也不写提示词的教程，用来验证可选。", 0);
await click("下一步");
await click("下一步");
await page.click(".rights-check input");
await click("发布作品");
await new Promise((r) => setTimeout(r, 600));
console.log("tutorial success:", await page.$eval(".create-success h1", (node) => node.textContent));
const work = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
await page.goto(`http://127.0.0.1:5173/tutorials/${work.slug}`, { waitUntil: "networkidle0" });
console.log("empty steps message:", await page.evaluate(() => document.body.textContent.includes("作者没有分步骤")));
console.log("recipe fallback:", await page.evaluate(() => document.body.textContent.includes("提示词还没有公开") || document.body.textContent.includes("尚未补充")));

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
