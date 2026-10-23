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
      if (!el) throw new Error(`missing ${selector}[${index}]`);
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

const fillRecipeAndPublish = async () => {
  await clickButton("下一步");
  await setField(".form-field textarea", 0, "请根据以下设定写一个短篇。要求具体、克制、不解释。");
  await setField(".form-field textarea", 1, "先写结尾\n再补中间\n最后删掉一半解释");
  await clickButton("下一步");
  await page.evaluate(() => {
    const select = document.querySelector(".form-field select");
    select.value = "含 AI 生成内容";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.click(".rights-check input");
  await clickButton("发布作品");
  await new Promise((resolve) => setTimeout(resolve, 500));
};

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());

// Novel
await page.goto("http://127.0.0.1:5173/create/novel", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 250));
await setField(".form-field input", 0, "雨停之前");
await setField(".form-field textarea", 0, "一个只在雨天营业的修伞铺，老板修不好自己的伞。");
await setField(".form-field input", 2, "800");
await setField(".form-field input", 3, "科幻 / 治愈");
await setField(".form-field textarea", 1, "雨停之前，修伞铺的灯一直亮着。");
await setField(".form-field textarea", 2, "雨从傍晚开始下。修伞铺的老板把最后一把伞撑开，又合上。\n\n他没有伞。他只是想让路过的人以为，这里还开着。");
await fillRecipeAndPublish();
console.log("novel success:", await page.$eval(".create-success h1", (node) => node.textContent));
await clickLink("查看作品");
await new Promise((resolve) => setTimeout(resolve, 300));
console.log("novel detail:", await page.evaluate(() => document.body.textContent.includes("雨停之前")));
await clickLink("开始阅读");
await new Promise((resolve) => setTimeout(resolve, 300));
console.log("reader url:", page.url(), "body:", await page.evaluate(() => document.body.textContent.includes("雨从傍晚开始下")));
await page.screenshot({ path: ".shots/stage3-user-novel.png" });

// Tutorial
await page.goto("http://127.0.0.1:5173/create/tutorial", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 250));
await setField(".form-field input", 0, "用三句话做一个雨夜分镜");
await setField(".form-field textarea", 0, "不讲运镜理论，三个提示词做出一个能发出来的雨夜片段。");
await setField(".form-field input", 2, "25");
await setField(".form-field input", 3, "30 秒雨夜短片");
await setField(".form-field textarea", 1, "先定雨的方向：让雨从右往左，画面就有了风。\n再定一盏灯：只留一盏，其他都压暗。\n最后留三秒空镜：让人听见雨。");
await fillRecipeAndPublish();
await clickLink("查看作品");
console.log("tutorial detail:", await page.evaluate(() => document.body.textContent.includes("先定雨的方向")));
await page.screenshot({ path: ".shots/stage3-user-tutorial.png", fullPage: true });

// Drama
await page.goto("http://127.0.0.1:5173/create/drama", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 250));
await setField(".form-field input", 0, "雨夜便利店");
await setField(".form-field textarea", 0, "一个雨夜，便利店店员和最后一个客人都不肯先走。");
await setField(".form-field input", 2, "2");
await setField(".form-field input", 3, "3");
await setField(".form-field input", 4, "都市 / 悬疑");
await setField(".form-field textarea", 1, "旁白：雨把整条街洗了一遍。\n客人：你们几点关门？\n店员：等雨停。\n客人：那我不走了。");
await fillRecipeAndPublish();
await clickLink("查看作品");
console.log("drama detail:", await page.evaluate(() => document.body.textContent.includes("雨夜便利店")));
await clickLink("开始观看");
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("watch url:", page.url(), "line:", await page.evaluate(() => document.body.textContent.includes("等雨停")));
await page.screenshot({ path: ".shots/stage3-user-drama.png" });

// Draft
await page.goto("http://127.0.0.1:5173/create/novel", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "没写完的雨");
await setField(".form-field textarea", 0, "这是一个还没有写完的草稿，用来检查自动保存。");
await new Promise((resolve) => setTimeout(resolve, 1200));
await page.goto("http://127.0.0.1:5173/me", { waitUntil: "networkidle0" });
console.log("me draft:", await page.evaluate(() => document.body.textContent.includes("没写完的雨")));
await page.goto("http://127.0.0.1:5173/create/novel", { waitUntil: "networkidle0" });
console.log("draft restored:", await page.$eval(".form-field input", (node) => node.value));

console.log("ERRORS:", errors.length ? errors : "none");
await page.evaluate(() => localStorage.clear());
await browser.close();
