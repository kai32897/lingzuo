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
await p.goto("http://127.0.0.1:5173/create/post", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "动态回收站测试");
await setField(".form-field textarea", 0, "用于验证动态进入回收站之后可以恢复。");
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("发布动态") && b.classList.contains("btn--primary"))?.click();
});
await new Promise((r) => setTimeout(r, 600));
const post = await p.evaluate(() => JSON.parse(localStorage.getItem("lz:user-posts") || "[]")[0]);
await p.goto(`http://127.0.0.1:5173/posts/${post.id}`, { waitUntil: "networkidle0" });
await p.click(".post-owner-actions button");
await new Promise((r) => setTimeout(r, 200));
await p.click(".confirm-dialog .btn--danger");
await new Promise((r) => setTimeout(r, 600));
console.log("trashed", await p.evaluate(() => ({
  url: location.pathname,
  posts: JSON.parse(localStorage.getItem("lz:user-posts") || "[]").length,
  trash: JSON.parse(localStorage.getItem("lz:trash") || "[]").length,
})));
await p.screenshot({ path: ".shots/trash-page.png" });
await p.click(".trash-item .btn--primary");
await new Promise((r) => setTimeout(r, 500));
console.log("restored", await p.evaluate(() => ({
  posts: JSON.parse(localStorage.getItem("lz:user-posts") || "[]").length,
  trash: JSON.parse(localStorage.getItem("lz:trash") || "[]").length,
})));
console.log("errors", errs);
await b.close();
