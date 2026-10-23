import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
page.on("dialog", async (dialog) => {
  console.log("dialog:", dialog.message());
  await dialog.accept();
});
await page.goto("http://127.0.0.1:5173/u/linyi", { waitUntil: "networkidle0" });
const href = await page.$eval(".profile-work-grid a", (link) => link.getAttribute("href"));
console.log("work:", href);
await page.goto(`http://127.0.0.1:5173${href}`, { waitUntil: "networkidle0" });
const del = await page.$$(".aside-delete");
console.log("delete buttons:", del.length);
if (del[0]) await del[0].click();
await new Promise((resolve) => setTimeout(resolve, 500));
console.log("url:", page.url());
console.log("stored:", await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]").length));
console.log("me has work:", await page.evaluate(() => document.body.textContent.includes("夜班收银台")));
await browser.close();
