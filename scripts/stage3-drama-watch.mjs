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
page.on("dialog", async (dialog) => {
  console.log("dialog:", dialog.message().slice(0, 40));
  await dialog.accept();
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
    [...document.querySelectorAll("button")].find((item) => item.textContent?.includes(needle) && !item.disabled)?.click();
  }, text);
  await new Promise((resolve) => setTimeout(resolve, 300));
};
const clickLink = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("a")].find((item) => item.textContent?.replace(/\s+/g, "").includes(needle.replace(/\s+/g, "")))?.click();
  }, text);
  await new Promise((resolve) => setTimeout(resolve, 400));
};

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.goto("http://127.0.0.1:5173/create/drama", { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 300));
await setField(".form-field input", 0, "雨夜便利店");
await setField(".form-field textarea", 0, "一个雨夜，便利店店员和最后一个客人都不肯先走。");
await setField(".form-field input", 2, "2");
await setField(".form-field input", 3, "3");
await setField(".form-field input", 4, "都市 / 悬疑");
await setField(".form-field textarea", 1, "旁白：雨把整条街洗了一遍。\n客人：你们几点关门？\n店员：等雨停。\n客人：那我不走了。");
await clickButton("下一步");
await setField(".form-field textarea", 0, "请写一个雨夜便利店的双人场景，结尾停在动作上。");
await setField(".form-field textarea", 1, "先写雨声\n再写两个人都不看对方\n最后让一个人坐下");
await clickButton("下一步");
await page.evaluate(() => {
  const select = document.querySelector(".form-field select");
  select.value = "含 AI 生成内容";
  select.dispatchEvent(new Event("change", { bubbles: true }));
});
await page.click(".rights-check input");
await clickButton("发布作品");
await new Promise((resolve) => setTimeout(resolve, 500));
await clickLink("查看作品");
console.log("detail:", page.url());
await page.screenshot({ path: ".shots/stage3-user-drama-detail.png", fullPage: true });
await clickLink("全屏连刷");
await new Promise((resolve) => setTimeout(resolve, 600));
console.log("watch:", page.url());
console.log("caption present:", await page.evaluate(() => document.body.textContent.includes("等雨停")));
await page.screenshot({ path: ".shots/stage3-user-drama-watch.png" });

await page.goto("http://127.0.0.1:5173" + (await page.evaluate(() => {
  const work = JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0];
  return `/dramas/${work.slug}`;
})), { waitUntil: "networkidle0" });
await clickButton("分享");
await new Promise((resolve) => setTimeout(resolve, 300));
console.log("share size active:", await page.$eval(".share-size .is-active", (node) => node.textContent));
await page.screenshot({ path: ".shots/stage3-drama-share.png" });
await page.evaluate(() => document.querySelector(".share-backdrop")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

// delete works
const work = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
await page.goto(`http://127.0.0.1:5173/dramas/${work.slug}`, { waitUntil: "networkidle0" });
await page.click(".aside-delete");
await new Promise((resolve) => setTimeout(resolve, 500));
console.log("after delete:", page.url(), "stored:", await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]").length));
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
