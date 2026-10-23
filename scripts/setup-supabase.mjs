import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = process.cwd();
const envPath = path.join(root, ".supabase.env");

if (!fs.existsSync(envPath)) {
  console.error("缺少 .supabase.env");
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const dbUrl = env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("缺少 SUPABASE_DB_URL");
  process.exit(1);
}

const sqlPath = path.join(root, "supabase", "migrations", "0001_init.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("数据库已连接");
  await client.query(sql);
  console.log("schema / RLS / storage 已应用");

  const { rows } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('profiles','works','comments','likes','saves','follows','posts','notifications')
    order by table_name
  `);
  console.log("已创建表:", rows.map((row) => row.table_name).join(", "));
} finally {
  await client.end();
}

const publicEnvPath = path.join(root, ".env.production");
const publicEnv = [
  "VITE_SITE_URL=https://lingzuo-ai.netlify.app",
  `VITE_SUPABASE_URL=${env.VITE_SUPABASE_URL ?? ""}`,
  `VITE_SUPABASE_ANON_KEY=${env.VITE_SUPABASE_ANON_KEY ?? ""}`,
].join("\n");
fs.writeFileSync(publicEnvPath, `${publicEnv}\n`, "utf8");
console.log("已写入 .env.production（仅公开 anon key）");
