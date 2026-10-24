import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:5173/login", { waitUntil: "networkidle0" });
await p.type('input[type="email"]', "lingzuo134714@maxxspace.com");
await p.type('input[autocomplete="current-password"]', "LingzuoTest2026!134714");
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "登录" && b.classList.contains("auth-submit"))?.click();
});
await new Promise((r) => setTimeout(r, 2500));
console.log("url", p.url());
console.log("avatar", await p.$$eval(".header-avatar", (n) => n.length));
console.log("session", await p.evaluate(() => Boolean(localStorage.getItem("sb-mgabezctmtuzskuzvolb-auth-token"))));
console.log("errors", errs);
await p.screenshot({ path: ".shots/auth-logged-in.png" });
await b.close();
