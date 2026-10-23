import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

const setField = async (selector, index, value) => {
  await page.evaluate(
    ({ selector, index, value }) => {
      const el = document.querySelectorAll(selector)[index];
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { selector, index, value },
  );
};

const clickButton = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("button")]
      .find((item) => item.textContent?.includes(needle) && !item.disabled)
      ?.click();
  }, text);
  await new Promise((resolve) => setTimeout(resolve, 300));
};

const clickLink = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("a")]
      .find((item) => item.textContent?.replace(/\s+/g, "").includes(needle.replace(/\s+/g, "")))
      ?.click();
  }, text);
  await new Promise((resolve) => setTimeout(resolve, 400));
};

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.goto("http://127.0.0.1:5173/create/game", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 300));
await setField(".form-field input", 0, "夜班收银台");
await setField(".form-field textarea", 0, "凌晨三点，一个客人把一枚旧硬币放在收银台上，要求你只做一件事。");
await setField(".form-field input", 2, "6");
await setField(".form-field input", 3, "叙事 / 解谜");
await setField(".form-field input", 4, "HTML + CSS");
await setField(".form-field input", 5, "点击 / 空格确认");
await setField(".form-field textarea", 1, "硬币边缘刻着一个日期，是明天。你抬头，客人已经不在队里了。");
await setField(".form-field textarea", 2, "你把硬币翻过来。背面是一句很小的字：不要找零。门外开始下雨。");
await clickButton("下一步");
await setField(".form-field textarea", 0, "你是凌晨便利店的值班店员。请写出一个只有两个选择的短场景，结尾不解释。");
await setField(".form-field textarea", 1, "先写三个结局\n把每个场景压到两个按钮\n让 Claude 检查选择是否有意义");
await clickButton("下一步");
await page.evaluate(() => {
  const select = document.querySelector(".form-field select");
  select.value = "含 AI 生成内容";
  select.dispatchEvent(new Event("change", { bubbles: true }));
});
await setField(".form-field input", 0, "叙事, 便利店, 夜晚");
await page.click(".rights-check input");
await clickButton("发布作品");
await new Promise((resolve) => setTimeout(resolve, 500));
await page.screenshot({ path: ".shots/stage3-success2.png", fullPage: true });

await clickLink("查看作品");
await new Promise((resolve) => setTimeout(resolve, 400));
await page.screenshot({ path: ".shots/stage3-user-detail.png", fullPage: true });
console.log("detail author:", await page.evaluate(() => document.querySelector(".aside-author__head a")?.textContent));
console.log("recipe text:", await page.evaluate(() => document.querySelector(".recipe-panel")?.textContent?.includes("你是凌晨便利店")));

await clickButton("分享");
await new Promise((resolve) => setTimeout(resolve, 300));
await page.screenshot({ path: ".shots/stage3-share2.png" });
console.log("poster image:", await page.$eval(".share-preview img", (node) => node.src.length));
await page.evaluate(() => document.querySelector(".share-backdrop")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

await page.goto("http://127.0.0.1:5173/u/linyi", { waitUntil: "networkidle0" });
await page.screenshot({ path: ".shots/profile-fixed.png", fullPage: true });
console.log("profile name color:", await page.$eval(".profile-id h1", (node) => getComputedStyle(node).color));
console.log("profile cover bottom:", await page.$eval(".profile-cover", (node) => node.getBoundingClientRect().bottom));
console.log("profile name top:", await page.$eval(".profile-id h1", (node) => node.getBoundingClientRect().top));

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
