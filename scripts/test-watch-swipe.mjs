import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:5173/dramas/ai-tongshi-cizhi/watch", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 700));
const read = () => p.evaluate(() => ({ top: document.querySelector(".watch-page").scrollTop, ep: document.querySelector(".watch-title span")?.textContent }));
console.log("before", await read());
const client = await p.createCDPSession();
await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 650 }] });
for (const y of [600, 540, 470, 390, 300]) {
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y }] });
  await new Promise((r) => setTimeout(r, 20));
}
await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await new Promise((r) => setTimeout(r, 900));
console.log("after touch", await read());
console.log("expected top", 844);
await p.screenshot({ path: ".shots/watch-touch-next.png" });
console.log("errors", errs);
await b.close();
