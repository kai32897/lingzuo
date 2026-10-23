import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
p.on("dialog", (dialog) => dialog.accept());
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
await p.goto("http://127.0.0.1:5173/create/post", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "动态编辑测试");
await setField(".form-field textarea", 0, "这是一条用来测试编辑和删除功能的动态，正文需要超过十个字。");
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("发布动态") && b.classList.contains("btn--primary"))?.click();
});
await new Promise((r) => setTimeout(r, 700));
const before = await p.evaluate(() => JSON.parse(localStorage.getItem("lz:user-posts") || "[]")[0]);
console.log("before", { id: before?.id, title: before?.title, count: await p.evaluate(() => JSON.parse(localStorage.getItem("lz:user-posts") || "[]").length) });
await p.goto(`http://127.0.0.1:5173/posts/${before.id}`, { waitUntil: "networkidle0" });
console.log("owner actions", await p.$$eval(".post-owner-actions a, .post-owner-actions button", (n) => n.map((x) => x.textContent?.trim())));
await p.click(".post-owner-actions a");
await new Promise((r) => setTimeout(r, 500));
console.log("edit url", p.url());
console.log("edit heading", await p.$eval(".post-create-main h1", (n) => n.textContent?.trim()));
console.log("prefill title", await p.$eval(".form-field input", (n) => n.value));
await setField(".form-field input", 0, "动态编辑测试（已改）");
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("保存修改"))?.click();
});
await new Promise((r) => setTimeout(r, 700));
const after = await p.evaluate(() => JSON.parse(localStorage.getItem("lz:user-posts") || "[]"));
console.log("after", { count: after.length, id: after[0]?.id, title: after[0]?.title, sameId: after[0]?.id === before.id });
console.log("detail title", await p.$eval(".post-head h1", (n) => n.textContent?.trim()));
await p.click(".post-owner-actions button");
await new Promise((r) => setTimeout(r, 600));
console.log("after delete", { url: p.url(), posts: await p.evaluate(() => JSON.parse(localStorage.getItem("lz:user-posts") || "[]").length) });
console.log("errors", errs);
await b.close();
