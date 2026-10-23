import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:5173/games/bianlidian-yeban", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 400));
await p.evaluate(() => document.querySelector("#comments")?.scrollIntoView());
await p.type(".comment-form textarea", "这条评论用来测试点赞和举报。");
await p.click(".comment-form .btn--primary");
await new Promise((r) => setTimeout(r, 400));
const like = await p.$(".comment__like");
console.log("before", await like.evaluate((el) => ({ text: el.textContent?.trim(), pressed: el.getAttribute("aria-pressed") })));
await like.click();
await new Promise((r) => setTimeout(r, 200));
console.log("liked", await p.evaluate(() => ({
  text: document.querySelector(".comment__like")?.textContent?.trim(),
  pressed: document.querySelector(".comment__like")?.getAttribute("aria-pressed"),
  stored: JSON.parse(localStorage.getItem("lz:liked-comments") || "[]").length,
})));
await p.click(".comment__like");
await new Promise((r) => setTimeout(r, 200));
console.log("unliked", await p.evaluate(() => ({
  text: document.querySelector(".comment__like")?.textContent?.trim(),
  pressed: document.querySelector(".comment__like")?.getAttribute("aria-pressed"),
  stored: JSON.parse(localStorage.getItem("lz:liked-comments") || "[]").length,
})));
await p.click(".comment__report");
await new Promise((r) => setTimeout(r, 300));
console.log("report", await p.$eval(".report-dialog h2, .report-modal h2, .modal h2", (n) => n.textContent?.trim()).catch(() => "opened"));
await p.keyboard.press("Escape");
console.log("errors", errs);
await b.close();
