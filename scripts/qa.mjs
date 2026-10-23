import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:5173";

const routes = [
  ["home", "/"],
  ["search", "/search?q=AI%20%E4%BF%AE%E4%BB%99%E6%B8%B8%E6%88%8F"],
  ["search-empty", "/search?q=%E4%B8%8D%E5%AD%98%E5%9C%A8%E7%9A%84%E4%B8%9C%E8%A5%BF"],
  ["discover", "/discover"],
  ["games", "/games"],
  ["dramas", "/dramas"],
  ["novels", "/novels"],
  ["tutorials", "/tutorials"],
  ["tools", "/tools"],
  ["detail", "/dramas/ai-tongshi-cizhi"],
  ["404", "/nope"],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
});

for (const width of [1440, 390]) {
  const page = await browser.newPage();
  await page.setViewport({
    width,
    height: width === 390 ? 844 : 1000,
    deviceScaleFactor: 1,
    isMobile: width === 390,
    hasTouch: width === 390,
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.log("[console]", width, page.url(), message.text());
    }
  });
  page.on("pageerror", (error) => {
    console.log("[pageerror]", width, page.url(), error.message);
  });

  for (const [name, path] of routes) {
    await page.goto(BASE + path, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.screenshot({ path: `.shots/${name}-${width}.png`, fullPage: true });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      title: document.title,
    }));
    console.log(
      `${name.padEnd(13)} ${width}  overflow=${metrics.overflow}  height=${metrics.height}  ${metrics.title}`,
    );
  }
  await page.close();
}

await browser.close();
