import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0" });
const data = await page.evaluate(() => {
  const likes = document.querySelectorAll(".challenge-work-likes")[2];
  likes.scrollIntoView({ block: "center" });
  const rect = likes.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const elements = document.elementsFromPoint(x, y).map((el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: el.className,
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage,
      shadow: cs.boxShadow,
      color: cs.color,
      text: el.textContent?.trim().slice(0, 40),
    };
  });
  return {
    likesRect: rect.toJSON(),
    point: { x, y },
    selection: window.getSelection()?.toString(),
    elements,
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
