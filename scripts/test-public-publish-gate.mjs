import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox", "--disable-http2", "--host-resolver-rules=MAP lingzuo-ai.netlify.app 13.215.239.219"] });
const p = await b.newPage();
await p.goto("https://lingzuo-ai.netlify.app/create/tutorial", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 5000));
console.log("url", p.url());
console.log("email inputs", await p.$$eval('input[type="email"]', (n) => n.length));
console.log("body", (await p.evaluate(() => document.body.textContent)).slice(0, 200));
await b.close();
