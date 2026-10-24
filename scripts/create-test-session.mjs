import fs from "node:fs";

const supabaseUrl = "https://mgabezctmtuzskuzvolb.supabase.co";
const anonKey = "sb_publishable_VuWxxHQvkZOTZSBUP-cWVg_74dlFRR9";
const stamp = Date.now().toString(36).slice(-6);
const password = `Test-${stamp}-Aa1!`;

async function json(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(body)}`);
  return body;
}

const domains = await json("https://api.mail.tm/domains");
const domain = domains["hydra:member"][0].domain;
const address = `lz${stamp}@${domain}`;
await json("https://api.mail.tm/accounts", {
  method: "POST",
  body: JSON.stringify({ address, password }),
});
const mailToken = await json("https://api.mail.tm/token", {
  method: "POST",
  body: JSON.stringify({ address, password }),
});
console.log("mailbox", address);

const signup = await json(`${supabaseUrl}/auth/v1/signup`, {
  method: "POST",
  headers: { apikey: anonKey },
  body: JSON.stringify({
    email: address,
    password,
    data: { handle: `lz${stamp}`, name: "迁移测试用户" },
  }),
});
console.log("signup", signup.id, "session", Boolean(signup.access_token));

if (signup.access_token) {
  fs.writeFileSync(
    ".shots/test-session.json",
    JSON.stringify(
      {
        email: address,
        password,
        access_token: signup.access_token,
        refresh_token: signup.refresh_token,
        expires_at: signup.expires_at,
        expires_in: signup.expires_in,
        token_type: signup.token_type,
        user: signup.user,
      },
      null,
      2,
    ),
  );
  console.log("session saved (auto confirmed)");
  process.exit(0);
}

let message = null;
for (let attempt = 0; attempt < 15 && !message; attempt += 1) {
  const list = await json("https://api.mail.tm/messages", {
    headers: { Authorization: `Bearer ${mailToken.token}` },
  });
  message = list["hydra:member"]?.[0] ?? null;
  if (!message) await new Promise((resolve) => setTimeout(resolve, 2000));
}
if (!message) throw new Error("no verification email");
const detail = await json(`https://api.mail.tm/messages/${message.id}`, {
  headers: { Authorization: `Bearer ${mailToken.token}` },
});
const html = detail.html?.join?.("") ?? String(detail.html ?? "");
const link = html.match(/https:\/\/mgabezctmtuzskuzvolb\.supabase\.co\/auth\/v1\/verify[^"']+/)?.[0]?.replaceAll("&amp;", "&");
if (!link) throw new Error("no verification link");
await fetch(link, { redirect: "manual" });
const login = await json(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey },
  body: JSON.stringify({ email: address, password }),
});
if (!login.access_token) throw new Error("no access token");
fs.writeFileSync(
  ".shots/test-session.json",
  JSON.stringify(
    {
      email: address,
      password,
      access_token: login.access_token,
      refresh_token: login.refresh_token,
      expires_at: login.expires_at,
      expires_in: login.expires_in,
      token_type: login.token_type,
      user: login.user,
    },
    null,
    2,
  ),
);
console.log("session saved");
