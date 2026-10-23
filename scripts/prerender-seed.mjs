import fs from "node:fs";
import path from "node:path";
import { createServer, loadEnv } from "vite";

const root = process.cwd();
const dist = path.join(root, "dist");
const env = loadEnv("production", root, "");
const baseUrl = (
  env.VITE_SITE_URL ||
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  "http://127.0.0.1:5173"
).replace(/\/$/, "");

if (!fs.existsSync(path.join(dist, "index.html"))) {
  throw new Error("dist/index.html not found; run vite build first");
}

const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
const { works, tools, posts, creators } = await server.ssrLoadModule("/src/data/seed.ts");
await server.close();

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function metaFor(kind, item) {
  if (kind === "work") {
    return {
      title: `${item.title} · 灵作`,
      description: item.summary,
      image: `/og/${item.type}-${item.slug}.png`,
      type: "article",
      path: `/${item.type}s/${item.slug}`,
    };
  }
  if (kind === "tool") {
    return {
      title: `${item.name} · AI 工具 · 灵作`,
      description: item.tagline,
      image: "/og-default.png",
      type: "article",
      path: `/tools/${item.slug}`,
    };
  }
  if (kind === "post") {
    return {
      title: `${item.title} · 社区动态 · 灵作`,
      description: item.excerpt,
      image: "/og-default.png",
      type: "article",
      path: `/posts/${item.id}`,
    };
  }
  return {
    title: `${item.name} · 创作者 · 灵作`,
    description: item.bio,
    image: "/og-default.png",
    type: "profile",
    path: `/u/${item.handle}`,
  };
}

function pageHtml(meta) {
  const canonical = `${baseUrl}${meta.path}`;
  const image = `${baseUrl}${meta.image}`;
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*"\s*\/?>/,
    `<meta property="og:type" content="${meta.type}" />`,
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${image}" />`,
  );
  html = html.replace(
    /<meta property="og:image:alt" content="[^"]*"\s*\/?>/,
    `<meta property="og:image:alt" content="${escapeHtml(meta.title)}" />`,
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${image}" />`,
  );
  html = html.replace("</head>", `    <link rel="canonical" href="${canonical}" />\n    <meta property="og:url" content="${canonical}" />\n  </head>`);
  return html;
}

const routes = [];
for (const work of works) routes.push({ kind: "work", item: work, meta: metaFor("work", work) });
for (const tool of tools) routes.push({ kind: "tool", item: tool, meta: metaFor("tool", tool) });
for (const post of posts) routes.push({ kind: "post", item: post, meta: metaFor("post", post) });
for (const creator of creators) routes.push({ kind: "creator", item: creator, meta: metaFor("creator", creator) });

for (const route of routes) {
  const dir = path.join(dist, route.meta.path.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  const html = pageHtml(route.meta);
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  fs.writeFileSync(path.join(dist, `${route.meta.path.replace(/^\//, "")}.html`), html, "utf8");
}

const core = ["/", "/discover", "/search", "/games", "/dramas", "/novels", "/tutorials", "/tools", "/recipes", "/challenges", "/create", "/about", "/guidelines", "/ai-policy"];
const urls = [
  ...core.map((path) => ({ path, priority: path === "/" ? "1.0" : "0.7", changefreq: "weekly" })),
  ...works.map((work) => ({
    path: `/${work.type}s/${work.slug}`,
    priority: "0.8",
    changefreq: "monthly",
  })),
  ...tools.map((tool) => ({ path: `/tools/${tool.slug}`, priority: "0.6", changefreq: "monthly" })),
  ...posts.map((post) => ({ path: `/posts/${post.id}`, priority: "0.5", changefreq: "monthly" })),
  ...creators.map((creator) => ({ path: `/u/${creator.handle}`, priority: "0.6", changefreq: "weekly" })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${baseUrl}${url.path}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
  "utf8",
);

console.log(`prerendered ${routes.length} seed routes`);
console.log(`sitemap: ${urls.length} urls (${baseUrl})`);
