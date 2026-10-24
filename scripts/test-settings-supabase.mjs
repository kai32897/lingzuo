import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:5173/login", { waitUntil: "networkidle0" });
await p.type('input[type="email"]', "lingzuo134714@maxxspace.com");
await p.type('input[autocomplete="current-password"]', "LingzuoTest2026!134714");
await p.click(".auth-submit");
await new Promise((r) => setTimeout(r, 2000));
await p.goto("http://127.0.0.1:5173/settings", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 600));
const bio = await p.$(".form-field textarea");
await bio.evaluate((el) => (el.value = ""));
await bio.type("这是一个真实账号简介，保存到 Supabase。");
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("保存设置"))?.click();
});
await new Promise((r) => setTimeout(r, 1200));
console.log("saved", await p.evaluate(() => document.querySelector(".settings-save span")?.textContent?.trim()));
const profile = await p.evaluate(async () => {
  const token = JSON.parse(localStorage.getItem("sb-mgabezctmtuzskuzvolb-auth-token") || "{}");
  const res = await fetch("https://mgabezctmtuzskuzvolb.supabase.co/rest/v1/profiles?select=*", {
    headers: { apikey: "sb_publishable_VuWxxHQvkZOTZSBUP-cWVg_74dlFRR9", Authorization: `Bearer ${token.access_token}` },
  });
  return { status: res.status, body: await res.json() };
});
console.log(profile);
console.log("errors", errs);
await b.close();
