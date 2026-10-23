import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const shots = [
  { name: "viewport-home-1440", url: "/", width: 1440, height: 900 },
  { name: "viewport-home-390", url: "/", width: 390, height: 844 },
  { name: "viewport-games-390", url: "/games", width: 390, height: 844 },
  { name: "viewport-discover-1440", url: "/discover", width: 1440, height: 900 },
  { name: "viewport-search-390", url: "/search?q=%E5%8D%B3%E6%A2%A6", width: 390, height: 844 },
];

for (const shot of shots) {
  const page = await browser.newPage();
  await page.setViewport({
    width: shot.width,
    height: shot.height,
    isMobile: shot.width < 500,
    hasTouch: shot.width < 500,
  });
  await page.goto("http://127.0.0.1:5173" + shot.url, { waitUntil: "networkidle0" });
  await new Promise((resolve) => setTimeout(resolve, 400));
  await page.screenshot({ path: `.shots/${shot.name}.png` });
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    h1: document.querySelector("h1")?.textContent?.trim(),
  }));
  console.log(shot.name, metrics);
  await page.close();
}

await browser.close();
