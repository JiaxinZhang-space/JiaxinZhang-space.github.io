import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(import.meta.dirname, "..", "public");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const requested = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const candidate = path.resolve(publicDir, `.${requested}`);
  const safe = candidate.startsWith(`${publicDir}${path.sep}`) && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
  const file = safe ? candidate : path.join(publicDir, "404.html");
  response.writeHead(safe ? 200 : 404, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Portfolio preview: http://127.0.0.1:${port}/`);
});
