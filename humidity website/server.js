// Minimal Node.js 18+ static server and same-origin UBA API proxy for the Tree-Mendous hackathon MVP.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Load a local .env file without requiring a third-party package.
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8000);
const UBA_ORIGIN = "https://luftdaten.umweltbundesamt.de/api-proxy";
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"
};

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(Buffer.isBuffer(body) || typeof body === "string" ? body : JSON.stringify(body));
}

async function proxy(res, upstreamUrl) {
  try {
    const upstream = await fetch(upstreamUrl, { headers: { Accept: "application/json", "User-Agent": "Tree-Mendous-Hackathon/1.0" }, signal: AbortSignal.timeout(15000) });
    const body = await upstream.text();
    send(res, upstream.status, body, upstream.headers.get("content-type") || "application/json; charset=utf-8");
  } catch (error) {
    send(res, 502, { error: "Upstream API request failed", detail: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/api/status") {
    return send(res, 200, { ubaAvailable: true });
  }
  if (url.pathname === "/api/uba/stations") {
    const upstream = new URL(`${UBA_ORIGIN}/stations/json`);
    url.searchParams.forEach((value, key) => upstream.searchParams.set(key, value));
    return proxy(res, upstream.toString());
  }
  if (url.pathname === "/api/uba/airquality") {
    const upstream = new URL(`${UBA_ORIGIN}/airquality/json`);
    url.searchParams.forEach((value, key) => upstream.searchParams.set(key, value));
    return proxy(res, upstream.toString());
  }


  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`) && filePath !== path.join(ROOT, "index.html")) return send(res, 403, { error: "Forbidden" });
  fs.readFile(filePath, (error, content) => {
    if (error) return send(res, 404, { error: "Not found" });
    send(res, 200, content, MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
});

server.listen(PORT, () => {
  console.log(`Tree-Mendous running at http://localhost:${PORT}`);
  console.log("UBA air-quality API proxy enabled; no API key required.");
});
