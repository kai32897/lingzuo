import fs from "node:fs";
import { execFileSync } from "node:child_process";

const token = fs.readFileSync(".github-token", "utf8").trim();
const owner = "kai32897";
const repo = "lingzuo";
const branch = "main";
const localSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const remoteRef = await github(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
const remoteSha = remoteRef.object.sha;
if (remoteSha === localSha) {
  console.log("already synced");
  process.exit(0);
}
const remoteCommit = await github(`/repos/${owner}/${repo}/git/commits/${remoteSha}`);
const files = execFileSync("git", ["diff", "--name-status", `${remoteSha}..${localSha}`], { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    const [status, ...parts] = line.split("\t");
    return { status, path: parts.join("\t") };
  });

const tree = [];
for (const file of files) {
  if (file.status.startsWith("D")) {
    tree.push({ path: file.path, mode: "100644", type: "blob", sha: null });
    continue;
  }
  const content = execFileSync("git", ["show", `${localSha}:${file.path}`]);
  const blob = await github(`/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
  });
  tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
}

const newTree = await github(`/repos/${owner}/${repo}/git/trees`, {
  method: "POST",
  body: JSON.stringify({ base_tree: remoteCommit.tree.sha, tree }),
});
const message = execFileSync("git", ["log", "-1", "--pretty=%B", localSha], { encoding: "utf8" }).trim();
const commit = await github(`/repos/${owner}/${repo}/git/commits`, {
  method: "POST",
  body: JSON.stringify({ message, tree: newTree.sha, parents: [remoteSha] }),
});
await github(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
  method: "PATCH",
  body: JSON.stringify({ sha: commit.sha, force: false }),
});
console.log(`synced ${localSha.slice(0, 7)} -> ${commit.sha.slice(0, 7)} (${files.length} files)`);

async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "lingzuo-deploy",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return text ? JSON.parse(text) : {};
}
