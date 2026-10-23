import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
for (const path of ["/", "/create/game", "/create/drama", "/create/tutorial", "/about"]) {
  await p.goto(`http://127.0.0.1:5173${path}`, { waitUntil: "networkidle0" });
  console.log(path, await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
}
await p.goto("http://127.0.0.1:5173/create/game", { waitUntil: "networkidle0" });
const labels = await p.$$eval(".form-field__label", (n) => n.map((x) => x.textContent?.trim()));
console.log("labels", labels);
console.log("errors", errs);
await b.close();
