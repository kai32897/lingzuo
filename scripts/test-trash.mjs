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
const counts = () => p.evaluate(() => ({
  works: JSON.parse(localStorage.getItem("lz:published-works") || "[]").length,
  trash: JSON.parse(localStorage.getItem("lz:trash") || "[]").length,
}));
await p.goto("http://127.0.0.1:5173/create/novel", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "回收站测试");
await setField(".form-field textarea", 0, "验证移入回收站、恢复和彻底删除。");
await p.click(".editor-nav .btn--primary");
await new Promise((r) => setTimeout(r, 300));
await p.click(".editor-nav .btn--primary");
await new Promise((r) => setTimeout(r, 300));
await p.click(".rights-check input");
await p.click(".editor-nav .btn--primary");
await new Promise((r) => setTimeout(r, 600));
const work = await p.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
await p.goto(`http://127.0.0.1:5173/novels/${work.slug}`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 500));
await p.click(".owner-panel .btn--danger");
await new Promise((r) => setTimeout(r, 200));
await p.click(".confirm-dialog .btn--danger");
await new Promise((r) => setTimeout(r, 600));
console.log("trashed", { url: p.url(), ...(await counts()) });
console.log("trash title", await p.$eval(".trash-item h2", (n) => n.textContent?.trim()));
await p.click(".trash-item .btn--primary");
await new Promise((r) => setTimeout(r, 500));
console.log("restored", await counts());
await p.goto(`http://127.0.0.1:5173/novels/${work.slug}`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 400));
await p.click(".owner-panel .btn--danger");
await new Promise((r) => setTimeout(r, 200));
await p.click(".confirm-dialog .btn--danger");
await new Promise((r) => setTimeout(r, 500));
await p.click(".trash-item__purge");
await new Promise((r) => setTimeout(r, 200));
console.log("purge dialog", await p.$eval(".confirm-dialog h2", (n) => n.textContent?.trim()));
await p.click(".confirm-dialog .btn--danger");
await new Promise((r) => setTimeout(r, 500));
console.log("purged", await counts());
console.log("empty", await p.$eval(".trash-empty h2", (n) => n.textContent?.trim()));
console.log("errors", errs);
await b.close();
