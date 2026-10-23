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
      if (!el) throw new Error(`missing field ${selector}[${index}]`);
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { selector, index, value },
  );
};

const clickButton = async (text) => {
  const clicked = await page.evaluate((needle) => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent?.includes(needle) && !item.disabled,
    );
    if (button) {
      button.click();
      return true;
    }
    return false;
  }, text);
  if (!clicked) throw new Error(`button not found: ${text}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
};

const clickLink = async (text) => {
  const clicked = await page.evaluate((needle) => {
    const link = [...document.querySelectorAll("a")].find(
      (item) => item.textContent?.replace(/\s+/g, "").includes(needle.replace(/\s+/g, "")),
    );
    if (link) {
      link.click();
      return true;
    }
    return false;
  }, text);
  if (!clicked) throw new Error(`link not found: ${text}`);
  await new Promise((resolve) => setTimeout(resolve, 400));
};

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.goto("http://127.0.0.1:5173/create/game", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 300));

await setField(".form-field input", 0, "测试便利店");
await setField(".form-field textarea", 0, "凌晨三点的便利店里，你只能选择补货或者结账。");
await setField(".form-field input", 2, "6");
await setField(".form-field input", 3, "叙事 / 解谜");
await setField(".form-field input", 4, "HTML + CSS");
await setField(".form-field input", 5, "点击 / 空格确认");
await setField(".form-field textarea", 1, "卷帘门半开着，关东煮的汤在冒泡。你听见门外有人停下了。");
await setField(".form-field textarea", 2, "你把最后一盒牛奶放回冷柜。门外的人推门进来，问了一个不该在凌晨三点问的问题。");
await clickButton("下一步");

await setField(".form-field textarea", 0, "你是凌晨便利店的值班店员。请写出一个只有两个选择的短场景，结尾不解释。");
await setField(".form-field textarea", 1, "先写三个结局\n把每个场景压到两个按钮\n让 Claude 检查选择是否有意义");
await clickButton("下一步");

const selects = await page.$$(".form-field select");
await page.evaluate(() => {
  const select = document.querySelector(".form-field select");
  if (select) {
    select.value = "含 AI 生成内容";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
});
await setField(".form-field input", 0, "叙事, 便利店, 夜晚");
await page.click(".rights-check input");
await clickButton("发布作品");
await new Promise((resolve) => setTimeout(resolve, 600));

console.log("success h1:", await page.$eval(".create-success h1", (node) => node.textContent));
const published = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]"));
console.log("published count:", published.length, published[0]?.title, published[0]?.slug);
const draftLeft = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:drafts") || "[]"));
console.log("draft after publish:", draftLeft.length);

await page.screenshot({ path: ".shots/stage3-success.png", fullPage: true });
await clickLink("查看作品");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("detail url:", page.url(), "h1:", await page.$eval(".detail-title", (node) => node.textContent).catch(() => "none"));
console.log("game story present:", await page.evaluate(() => document.body.textContent.includes("卷帘门半开着")));

await clickLink("开始游戏");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("play url:", page.url(), "opening:", await page.evaluate(() => document.body.textContent.includes("卷帘门半开着")));
await clickButton("继续往前");
await new Promise((resolve) => setTimeout(resolve, 300));
await clickButton("留下来");
await new Promise((resolve) => setTimeout(resolve, 300));
console.log("ending visible:", await page.evaluate(() => document.body.textContent.includes("结局：留下")));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0" });
console.log("home has new work:", await page.evaluate(() => document.body.textContent.includes("测试便利店")));
await page.goto("http://127.0.0.1:5173/search?q=测试便利店", { waitUntil: "networkidle0" });
console.log("search has new work:", await page.evaluate(() => document.body.textContent.includes("测试便利店")));
await page.goto("http://127.0.0.1:5173/u/linyi", { waitUntil: "networkidle0" });
console.log("profile has new work:", await page.evaluate(() => document.body.textContent.includes("测试便利店")));
await page.goto("http://127.0.0.1:5173/me", { waitUntil: "networkidle0" });
console.log("me has new work:", await page.evaluate(() => document.body.textContent.includes("测试便利店")));
await page.screenshot({ path: ".shots/stage3-me-published.png", fullPage: true });

await page.goto(`http://127.0.0.1:5173/games/${published[0].slug}`, { waitUntil: "networkidle0" });
await clickButton("分享");
await new Promise((resolve) => setTimeout(resolve, 300));
console.log("share sheet:", await page.$$eval(".share-sheet", (nodes) => nodes.length));
console.log("poster:", await page.$eval(".share-preview img", (node) => node.src.slice(0, 40)));
await page.screenshot({ path: ".shots/stage3-share.png", fullPage: false });
await page.keyboard.press("Escape").catch(() => {});
await page.evaluate(() => document.querySelector(".share-backdrop")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

await page.goto("http://127.0.0.1:5173/create/post", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "测试动态：你们会怎么选？");
await setField(".form-field textarea", 0, "我在测试一件新作品的时候，发现两个选择都像是在逃避。你们会怎么选？");
await clickButton("发布动态");
await new Promise((resolve) => setTimeout(resolve, 500));
console.log("post url:", page.url());
console.log("post title:", await page.$eval(".post-title", (node) => node.textContent).catch(() => "none"));
await page.reload({ waitUntil: "networkidle0" });
console.log("post persists:", await page.evaluate(() => document.body.textContent.includes("测试动态：你们会怎么选？")));

console.log("ERRORS:", errors.length ? errors : "none");

await page.evaluate(() => localStorage.clear());
await browser.close();
