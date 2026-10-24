import fs from "node:fs";
import puppeteer from "puppeteer-core";

const session = JSON.parse(fs.readFileSync(".shots/test-session.json", "utf8"));
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.evaluateOnNewDocument((value) => {
  localStorage.setItem("sb-mgabezctmtuzskuzvolb-auth-token", JSON.stringify(value));
}, session);

const setField = async (selector, index, value) => {
  await p.evaluate(({ selector, index, value }) => {
    const el = document.querySelectorAll(selector)[index];
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, { selector, index, value });
};

await p.goto("http://127.0.0.1:5173/create/tutorial", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));
console.log("signed", await p.$$eval(".header-avatar", (n) => n.length), p.url());
await setField(".form-field input", 0, "真实发布测试");
await setField(".form-field textarea", 0, "这件教程从浏览器发布到 Supabase，刷新后仍然存在。");
await p.click(".editor-nav .btn--primary");
await new Promise((r) => setTimeout(r, 500));
await p.click(".editor-nav .btn--primary");
await new Promise((r) => setTimeout(r, 500));
await p.click(".rights-check input");
await p.click(".editor-nav .btn--primary");
await new Promise((r) => setTimeout(r, 3000));
console.log("url", p.url());
console.log("success", await p.$$eval(".create-success h1", (n) => n.map((x) => x.textContent?.trim())));
console.log("errors", errs);

const rows = await p.evaluate(async () => {
  const res = await fetch("https://mgabezctmtuzskuzvolb.supabase.co/rest/v1/works?select=id,title,slug,type,author_id&order=created_at.desc&limit=3", {
    headers: { apikey: "sb_publishable_VuWxxHQvkZOTZSBUP-cWVg_74dlFRR9", Authorization: "Bearer sb_publishable_VuWxxHQvkZOTZSBUP-cWVg_74dlFRR9" },
  });
  return { status: res.status, body: await res.json() };
});
console.log("db", rows);
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 2500));
console.log("home has title", (await p.evaluate(() => document.body.textContent)).includes("真实发布测试"));
await p.screenshot({ path: ".shots/remote-publish.png" });
await b.close();
