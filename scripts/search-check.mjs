import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:5173";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
page.on("pageerror", (error) => console.log("[pageerror]", error.message));
page.on("console", (message) => {
  if (message.type() === "error") console.log("[console]", message.text());
});

const queries = [
  "AI 修仙游戏",
  "便利店夜班",
  "即梦",
  "不存在的东西",
  "赛博聊斋",
  "AI 工具",
  "月亮维修站",
];

for (const query of queries) {
  await page.goto(`${BASE}/search?q=${encodeURIComponent(query)}`, {
    waitUntil: "networkidle0",
  });
  await new Promise((resolve) => setTimeout(resolve, 350));
  const data = await page.evaluate(() => ({
    status: document.querySelector(".search-hero__status")?.textContent?.trim() ?? "",
    titles: Array.from(document.querySelectorAll(".result-card__title")).map((node) =>
      node.textContent?.trim(),
    ),
    empty: Boolean(document.querySelector(".empty-state")),
    tabs: Array.from(document.querySelectorAll(".search-tab")).map((node) =>
      node.textContent?.replace(/\s+/g, " ").trim(),
    ),
  }));
  console.log("\nQUERY:", query);
  console.log("status:", data.status);
  console.log("empty:", data.empty);
  console.log("titles:", data.titles.slice(0, 5).join(" | "));
  console.log("tabs:", data.tabs.join(" / "));
}

await browser.close();
