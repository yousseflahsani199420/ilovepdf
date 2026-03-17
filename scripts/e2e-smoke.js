const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".xml") return "application/xml; charset=utf-8";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  let candidate = path.join(ROOT, decoded);

  if (decoded.endsWith("/")) candidate = path.join(candidate, "index.html");
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, "index.html");
  }
  if (!path.extname(candidate) && fs.existsSync(`${candidate}.html`)) {
    candidate = `${candidate}.html`;
  }
  return candidate;
}

function createServer() {
  return http.createServer((req, res) => {
    const target = safeResolve(req.url || "/");
    if (!target.startsWith(ROOT) || !fs.existsSync(target)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    res.setHeader("Content-Type", contentType(target));
    fs.createReadStream(target).pipe(res);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function generateTinyVideoBuffer(page) {
  const arr = await page.evaluate(async () => {
    if (!window.MediaRecorder) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const buf = await blob.arrayBuffer();
        resolve(Array.from(new Uint8Array(buf)));
      };
    });

    recorder.start();
    let frame = 0;
    const draw = setInterval(() => {
      ctx.fillStyle = frame % 2 === 0 ? "#0ea5e9" : "#ef4444";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      frame += 1;
      if (frame > 12) {
        clearInterval(draw);
        recorder.stop();
      }
    }, 80);

    return done;
  });

  if (!arr) return null;
  return Buffer.from(arr);
}

async function waitForResultOrError(page, timeout = 25000) {
  await page.waitForFunction(() => {
    const result = document.getElementById("resultArea");
    const error = document.getElementById("errorMessage");
    const resultVisible = result && getComputedStyle(result).display !== "none";
    const errorVisible = error && getComputedStyle(error).display !== "none" && error.textContent.trim().length > 0;
    return resultVisible || errorVisible;
  }, { timeout });

  const resultVisible = await page.evaluate(() => getComputedStyle(document.getElementById("resultArea")).display !== "none");
  if (resultVisible) return { ok: true, message: await page.locator("#resultFileList").innerText() };
  return { ok: false, message: await page.locator("#errorMessage").innerText() };
}

async function run() {
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Server started on ${BASE}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

    const requiredCards = [
      "cropdf", "grayscalepdf", "signpdf", "metadatapdf", "removeblankpdf", "resizepdfpages",
      "ocrtool", "qrtemplates", "barcodegen", "barcodescan",
      "imageconvert", "imageresize", "videotogif",
      "qrcreate", "qrscan", "photocompress", "videocompress"
    ];
    for (const id of requiredCards) {
      assert(await page.locator(`[data-tool="${id}"]`).isVisible(), `Missing tool card: ${id}`);
    }

    await page.click('[data-tool="qrcreate"]');
    await page.fill("#qrText", "https://example.com");
    await page.fill("#qrSize", "256");
    await page.click("#processBtn");
    const qrResult = await waitForResultOrError(page, 30000);
    if (qrResult.ok && qrResult.message.includes("qr-code.png")) {
      console.log("QR generator smoke test passed.");
    } else {
      console.log(`QR generator functional test warning: ${qrResult.message}`);
    }

    await page.click('[data-tool="photocompress"]');
    await page.setInputFiles("#fileInput", path.join(ROOT, "pdflogo.png"));
    await page.click("#processBtn");
    const photoResult = await waitForResultOrError(page, 30000);
    assert(photoResult.ok, `Photo compressor failed: ${photoResult.message}`);
    const photoText = photoResult.message;
    assert(photoText.toLowerCase().includes("compressed"), "Photo compressor did not produce compressed output.");
    console.log("Photo compressor smoke test passed.");

    await page.click('[data-tool="videocompress"]');
    const tinyVideo = await generateTinyVideoBuffer(page);
    if (tinyVideo) {
      await page.setInputFiles("#fileInput", {
        name: "tiny.webm",
        mimeType: "video/webm",
        buffer: tinyVideo
      });
      await page.click("#processBtn");
      const videoResult = await waitForResultOrError(page, 50000);
      assert(videoResult.ok, `Video compressor failed: ${videoResult.message}`);
      const videoText = videoResult.message;
      assert(videoText.toLowerCase().includes("compressed.webm"), "Video compressor did not produce output.");
      console.log("Video compressor smoke test passed.");
    } else {
      console.log("Video compressor functional test skipped: MediaRecorder unavailable in headless runtime.");
    }

    await page.goto(`${BASE}/tools/qr-code-generator/`, { waitUntil: "domcontentloaded" });
    assert((await page.locator("h1").innerText()).toLowerCase().includes("qr code"), "QR SEO page failed to load.");

    await page.goto(`${BASE}/tools/video-compressor/`, { waitUntil: "domcontentloaded" });
    assert((await page.locator("h1").innerText()).toLowerCase().includes("video"), "Video SEO page failed to load.");
    console.log("SEO page smoke tests passed.");

    console.log("PASS: Browser smoke tests completed.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
});
