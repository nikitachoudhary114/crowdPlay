import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./socket";

const dev = process.env.NODE_ENV !== "production";
// In containers (Railway), bind to all interfaces. HOSTNAME is often a container id.
const hostname = dev ? process.env.HOSTNAME ?? "localhost" : "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  initSocketServer(server);

  server.listen(port, hostname, () => {
    const publicHost = dev ? hostname : "0.0.0.0";
    console.log(`> CrowdPlay ready on http://${publicHost}:${port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`> Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
    // Hard kill safety net
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
