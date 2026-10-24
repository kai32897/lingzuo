const supabaseUrl = "https://mgabezctmtuzskuzvolb.supabase.co";
const anonKey = "sb_publishable_VuWxxHQvkZOTZSBUP-cWVg_74dlFRR9";
const stamp = new Date().toISOString().slice(11, 19).replaceAll(":", "");
const password = `LingzuoTest2026!${stamp}`;
const handle = `qa${stamp}`;

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
const address = `lingzuo${stamp}@${domain}`;
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
    data: { handle, name: "真实注册测试" },
  }),
});
console.log("signup", signup.id ?? "no-id", "session", Boolean(signup.access_token));

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
console.log("verify link", Boolean(link));
if (link) {
  const confirm = await fetch(link, { redirect: "manual" });
  console.log("confirm", confirm.status);
}
await new Promise((resolve) => setTimeout(resolve, 1000));
const login = await json(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey },
  body: JSON.stringify({ email: address, password }),
});
console.log("login", Boolean(login.access_token), login.user?.email);
const profile = await json(
  `${supabaseUrl}/rest/v1/profiles?select=id,handle,name&id=eq.${login.user.id}`,
  { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
);
console.log("profile", profile);
