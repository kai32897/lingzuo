import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.goto("http://127.0.0.1:5173/games/bianlidian-yeban/play", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1000));
console.log("choices:", await p.$$eval(".play-choice", (n) => n.length));
console.log("text:", await p.evaluate(() => document.body.textContent.includes("先补货")));
await b.close();
