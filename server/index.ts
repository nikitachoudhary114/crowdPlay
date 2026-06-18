import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? process.env.HOSTNAME ?? "localhost" : "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function isSocketPath(pathname: string | null | undefined) {
  return pathname === "/api/socket" || pathname?.startsWith("/api/socket/");
}

app.prepare().then(() => {
  // Socket.IO must attach before the Next.js request handler (engine.io prepends its listener)
  const server = createServer();

  initSocketServer(server);

  server.on("request", (req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    const pathname = parsedUrl.pathname ?? "";

    if (pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, socket: true }));
      return;
    }

    // Socket.IO (prepended listener) already handled this — don't double-handle
    if (isSocketPath(pathname) || res.headersSent || res.writableEnded) {
      return;
    }

    void handle(req, res, parsedUrl).catch((err) => {
      console.error("Error handling request:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> CrowdPlay ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO path: /api/socket`);
  });

  const shutdown = (signal: string) => {
    console.log(`> Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
