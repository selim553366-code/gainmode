import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.disable("x-powered-by");
app.disable("etag");

const allowedOrigins = new Set(
  (process.env["ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin(origin, callback) {
    if (!origin || process.env["NODE_ENV"] !== "production") return callback(null, true);
    return callback(null, allowedOrigins.has(origin));
  },
}));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

const publicGuideAssets = path.resolve(process.cwd(), "public/app-assets/form-guides");
app.use("/api/app-assets/form-guides", express.static(publicGuideAssets, {
  maxAge: "7d",
  immutable: true,
  fallthrough: false,
}));

app.use("/api", router);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  const typedError = error as { type?: string; status?: number };
  if (typedError.type === "entity.too.large" || typedError.status === 413) {
    return res.status(413).json({ error: "Request payload is too large." });
  }
  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  return next(error);
});

export default app;
