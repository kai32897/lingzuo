import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const setField = async (selector, index, value) => {
  await page.evaluate(
    ({ selector, index, value }) => {
      const el = document.querySelectorAll(selector)[index];
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { selector, index, value },
  );
};
await page.goto("http://127.0.0.1:5173/settings", { waitUntil: "networkidle0" });
await setField(".form-field input", 0, "林一测试");
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("保存设置"))?.click();
});
await new Promise((resolve) => setTimeout(resolve, 300));
await page.goto("http://127.0.0.1:5173/u/linyi", { waitUntil: "networkidle0" });
console.log("profile:", await page.$eval("h1", (node) => node.textContent));
await page.goto("http://127.0.0.1:5173/me", { waitUntil: "networkidle0" });
console.log("me:", await page.$eval("h1", (node) => node.textContent?.trim()));
console.log("header avatar:", await page.$eval(".header-avatar .avatar", (node) => node.textContent));
await page.evaluate(() => localStorage.removeItem("lz:settings"));
await browser.close();
