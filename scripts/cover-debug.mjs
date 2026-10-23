import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const setField = async (selector, index, value) => {
  await page.evaluate(({ selector, index, value }) => {
    const el = document.querySelectorAll(selector)[index];
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, { selector, index, value });
};
const click = async (text) => {
  await page.evaluate((needle) => {
    [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(needle) && !b.disabled)?.click();
  }, text);
  await new Promise((r) => setTimeout(r, 400));
};
await page.goto("http://127.0.0.1:5173/create/novel", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "封面测试小说");
await setField(".form-field textarea", 0, "用来检查上传封面是否正确显示的测试小说。");
const inputs = await page.$$("input[type=file]");
await inputs[0].uploadFile("F:\\网站项目\\灵作\\.shots\\test-cover.png");
await new Promise((r) => setTimeout(r, 1000));
console.log("editor cover:", await page.evaluate(() => {
  const c = document.querySelector(".editor-preview .cover");
  return { cls: c?.className, img: !!c?.querySelector(".cover__image"), glyph: getComputedStyle(c?.querySelector(".cover__glyph")).display };
}));
await click("下一步");
await setField(".form-field textarea", 0, "测试配方提示词。");
await click("下一步");
await page.click(".rights-check input");
await click("发布作品");
await new Promise((r) => setTimeout(r, 600));
const work = await page.evaluate(() => JSON.parse(localStorage.getItem("lz:published-works") || "[]")[0]);
console.log("work cover:", work?.cover);
await page.goto(`http://127.0.0.1:5173/novels/${work.slug}`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1200));
console.log("detail:", await page.evaluate(() => {
  const c = document.querySelector(".novel-hero__cover .cover");
  return { cls: c?.className, img: !!c?.querySelector(".cover__image"), src: c?.querySelector(".cover__image")?.src?.slice(0, 30), glyph: getComputedStyle(c?.querySelector(".cover__glyph")).display, pattern: getComputedStyle(c?.querySelector(".cover__pattern")).display };
}));
await page.screenshot({ path: ".shots/cover-debug.png" });
await browser.close();
