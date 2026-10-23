import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000 });
p.on("dialog", (dialog) => dialog.accept());
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:5173/games/bianlidian-yeban", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 500));
await p.evaluate(() => document.querySelector("#comments")?.scrollIntoView());
await p.type(".comment-form textarea", "这是一条测试评论，用来验证删除功能。");
await p.click(".comment-form .btn--primary");
await new Promise((r) => setTimeout(r, 500));
const read = () => p.evaluate(() => ({
  comments: JSON.parse(localStorage.getItem("lz:comments") || "[]").length,
  mine: [...document.querySelectorAll(".comment__text")].some((n) => n.textContent?.includes("测试评论")),
  deleteButtons: document.querySelectorAll(".comment__delete").length,
}));
console.log("after post", await read());
await p.click(".comment__delete");
await new Promise((r) => setTimeout(r, 500));
console.log("after delete", await read());
console.log("errors", errs);
await b.close();
