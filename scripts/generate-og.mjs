import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";

const root = process.cwd();
const outDir = path.join(root, "public", "og");
fs.mkdirSync(outDir, { recursive: true });

const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
const { works } = await server.ssrLoadModule("/src/data/seed.ts");
await server.close();

const typeMeta = {
  game: { label: "AI 游戏", color: "#D8FF3E", action: "玩一局" },
  drama: { label: "AI 短剧", color: "#FF5A3C", action: "追一集" },
  novel: { label: "AI 小说", color: "#B9A6FF", action: "读两页" },
  tutorial: { label: "AI 教程", color: "#FFC24B", action: "学一手" },
};

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

for (const work of works) {
  const meta = typeMeta[work.type];
  const names = work.tools.slice(0, 3).join(" · ");
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{width:1200px;height:630px;background:#F4F0E6;color:#15130F;font-family:"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden}
    .frame{position:absolute;inset:26px;border:4px solid #15130F;padding:34px 38px;display:flex;flex-direction:column}
    .top{display:flex;justify-content:space-between;align-items:flex-start}
    .brand{font-family:"SimHei","Microsoft YaHei",sans-serif;font-size:31px;font-weight:900;letter-spacing:-1px}
    .brand small{display:block;margin-top:2px;font-family:Consolas,monospace;font-size:10px;letter-spacing:3px;font-weight:400}
    .type{display:inline-flex;align-items:center;height:34px;padding:0 14px;border:2px solid #15130F;background:${meta.color};font-family:Consolas,monospace;font-size:13px;font-weight:700;letter-spacing:1px}
    .body{display:grid;grid-template-columns:1fr 300px;gap:38px;align-items:center;flex:1;min-height:0}
    .kicker{margin-bottom:12px;font-family:Consolas,monospace;font-size:11px;letter-spacing:2px;color:#6C665D}
    h1{font-family:"SimHei","Microsoft YaHei",sans-serif;font-size:${work.title.length > 9 ? 64 : 76}px;line-height:.98;letter-spacing:-3px;max-width:720px}
    .summary{max-width:650px;margin-top:16px;font-size:17px;line-height:1.7;color:#4E4942;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .cover{position:relative;width:300px;height:355px;border:3px solid #15130F;background:${work.cover.bg};box-shadow:10px 10px 0 #15130F;overflow:hidden;transform:rotate(1.5deg)}
    .glyph{position:absolute;right:-12px;bottom:-35px;color:${work.cover.ink};font-family:"SimHei",sans-serif;font-size:230px;line-height:1;opacity:.94}
    .cover-code{position:absolute;left:16px;top:14px;color:${work.cover.ink};font-family:Consolas,monospace;font-size:10px;letter-spacing:2px}
    .cover-mark{position:absolute;left:16px;bottom:12px;color:${work.cover.ink};font-family:Consolas,monospace;font-size:9px;letter-spacing:2px}
    .foot{display:flex;align-items:center;justify-content:space-between;border-top:2px solid #15130F;padding-top:15px;font-family:Consolas,monospace;font-size:12px;color:#4E4942}
    .foot strong{color:#15130F}
    .stamp{display:flex;align-items:center;gap:10px;font-size:12px}
    .dot{width:9px;height:9px;border-radius:50%;background:${meta.color};border:1px solid #15130F}
  </style></head><body>
    <div class="frame">
      <div class="top">
        <div class="brand">灵作<small>MADE WITH AI</small></div>
        <span class="type">${meta.label} / ${meta.action}</span>
      </div>
      <div class="body">
        <div>
          <div class="kicker">RECIPE / 配方公开 · ${work.stats.likes} 人喜欢</div>
          <h1>${escapeHtml(work.title)}</h1>
          <p class="summary">${escapeHtml(work.summary)}</p>
        </div>
        <div class="cover">
          <span class="cover-code">${escapeHtml(work.cover.code)}</span>
          <span class="glyph">${escapeHtml(work.cover.glyph)}</span>
          <span class="cover-mark">MADE WITH AI</span>
        </div>
      </div>
      <div class="foot">
        <span class="stamp"><span class="dot"></span><strong>${escapeHtml(names || "AI 工具")}</strong></span>
        <span>${escapeHtml(work.tags.slice(0, 3).map((tag) => `#${tag}`).join("  "))}</span>
        <span>lingzuo / 2026</span>
      </div>
    </div>
  </body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    path: path.join(outDir, `${work.type}-${work.slug}.png`),
    type: "png",
  });
  console.log(`${work.type}-${work.slug}.png`);
}

await browser.close();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
