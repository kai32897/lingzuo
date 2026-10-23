import fs from "node:fs";
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setContent("<canvas id='c' width='640' height='360'></canvas>");
const base64 = await page.evaluate(async () => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
  const chunks = [];
  recorder.ondataavailable = (event) => chunks.push(event.data);
  const done = new Promise((resolve) => (recorder.onstop = resolve));
  recorder.start();
  const start = performance.now();
  await new Promise((resolve) => {
    const draw = () => {
      const t = (performance.now() - start) / 1000;
      ctx.fillStyle = "#101410";
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = "#d8ff3e";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText("TEST DRAMA", 70, 160);
      ctx.font = "22px sans-serif";
      ctx.fillText(`frame ${Math.floor(t * 10)}`, 70, 210);
      if (t < 1.4) requestAnimationFrame(draw);
      else resolve();
    };
    draw();
  });
  recorder.stop();
  await done;
  const blob = new Blob(chunks, { type: "video/webm" });
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
});
fs.writeFileSync(".shots/test-drama.webm", Buffer.from(base64, "base64"));
console.log("video bytes", fs.statSync(".shots/test-drama.webm").size);
await browser.close();
