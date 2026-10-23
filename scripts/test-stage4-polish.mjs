import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:5173/games/bianlidian-yeban", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 400));
console.log("og image", await p.$eval('meta[property="og:image"]', (n) => n.getAttribute("content")));
console.log("canonical", await p.$eval('link[rel="canonical"]', (n) => n.getAttribute("href")));
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("分享"))?.click();
});
await new Promise((r) => setTimeout(r, 300));
await p.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 300));
console.log("share closed", (await p.$$(".share-sheet")).length);

await p.goto("http://127.0.0.1:5173/create/tutorial", { waitUntil: "networkidle0" });
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "图片")?.click();
});
await new Promise((r) => setTimeout(r, 300));
const inputs = await p.$$("input[type=file]");
await inputs[1].uploadFile("F:\\网站项目\\灵作\\.shots\\large-test.png");
await new Promise((r) => setTimeout(r, 1500));
const stat = await p.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const r = indexedDB.open("lingzuo-media", 1);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const records = await new Promise((resolve, reject) => {
    const tx = db.transaction("media", "readonly");
    const r = tx.objectStore("media").getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const item = records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!item) return null;
  const bitmap = await createImageBitmap(item.blob);
  return { width: bitmap.width, height: bitmap.height, size: item.size, type: item.type };
});
console.log("compressed", stat);
console.log("errors", errs);
await b.close();
