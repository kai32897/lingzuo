import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const clickLink = async (text) => {
  const ok = await page.evaluate((needle) => {
    const link = [...document.querySelectorAll("a")].find((item) =>
      item.textContent?.replace(/\s+/g, "").includes(needle.replace(/\s+/g, "")),
    );
    if (link) {
      link.click();
      return true;
    }
    return false;
  }, text);
  if (!ok) throw new Error(`link ${text} not found`);
  await new Promise((resolve) => setTimeout(resolve, 400));
};

await page.goto("http://127.0.0.1:5173/challenges/two-buttons", { waitUntil: "networkidle0" });
await clickLink("参加这个命题");
console.log("challenge entry:", page.url());
console.log("challenge banner:", await page.evaluate(() => document.body.textContent.includes("正在参加")));
await clickLink("AI 游戏");
console.log("challenge editor:", page.url());
console.log("editor banner:", await page.evaluate(() => document.body.textContent.includes("标签已预填")));

await page.goto("http://127.0.0.1:5173/tutorials/3-tishi-dianying-duanpian", { waitUntil: "networkidle0" });
await clickLink("去检查");
console.log("post prefill url:", page.url());
console.log("post type active:", await page.$eval(".post-type-card.is-active strong", (node) => node.textContent));
console.log("post title:", await page.$eval(".form-field input", (node) => node.value));
console.log("related:", await page.$eval(".form-field select", (node) => node.value));

await page.goto("http://127.0.0.1:5173/games/bianlidian-yeban", { waitUntil: "networkidle0" });
await clickLink("二创");
console.log("remix entry:", page.url());
console.log("remix banner:", await page.evaluate(() => document.body.textContent.includes("正在二创")));
await clickLink("AI 游戏");
console.log("remix editor:", page.url());
console.log("remix title:", await page.$eval(".form-field input", (node) => node.value));

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
