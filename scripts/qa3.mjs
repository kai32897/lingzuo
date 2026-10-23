import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

const routes = [
  ["create", "/create"],
  ["create-game", "/create/game"],
  ["create-drama", "/create/drama"],
  ["create-novel", "/create/novel"],
  ["create-tutorial", "/create/tutorial"],
  ["create-post", "/create/post"],
  ["profile", "/u/linyi"],
  ["profile-creator", "/u/chenjiu"],
  ["me", "/me"],
  ["notifications", "/notifications"],
  ["settings", "/settings"],
  ["about", "/about"],
  ["guidelines", "/guidelines"],
  ["ai-policy", "/ai-policy"],
];

for (const width of [1440, 390]) {
  await page.setViewport({ width, height: width === 390 ? 844 : 1000, isMobile: width === 390, hasTouch: width === 390 });
  for (const [name, path] of routes) {
    await page.goto(`http://127.0.0.1:5173${path}`, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const data = await page.evaluate(() => ({
      title: document.title,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      h1: document.querySelector("h1")?.textContent?.trim().slice(0, 40),
    }));
    console.log(`${name.padEnd(16)} ${width}  overflow=${data.overflow}  height=${data.height}  ${data.title} | ${data.h1}`);
    if (width === 1440 || ["create", "create-game", "profile", "me", "notifications", "settings", "about", "create-post"].includes(name)) {
      await page.screenshot({ path: `.shots/${name}-${width}.png`, fullPage: width === 1440 });
    }
  }
}

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
