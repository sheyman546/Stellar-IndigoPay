"use strict";

const crypto = require("crypto");
const redis = require("../services/redis");
const { cacheOperationsTotal } = require("../services/metrics").metrics;

const DEFAULT_TTL_SECONDS = 60;
const DEFAULT_BYPASS_PATHS = ["/api/health", "/api/readyz", "/api/csrf-token"];
const CACHE_PREFIX = "rsp:";

const pendingRequests = new Map();

function getCacheKey(req) {
  const path = req.path || req.originalUrl || "";
  const method = (req.method || "GET").toUpperCase();
  const query = req.query ? JSON.stringify(req.query) : "{}";
  return `${CACHE_PREFIX}${method}:${path}:${crypto
    .createHash("sha256")
    .update(query)
    .digest("hex")}`;
}

function shouldBypass(req) {
  return (
    req.method !== "GET" ||
    DEFAULT_BYPASS_PATHS.includes(req.path) ||
    req.headers?.["x-cache-bypass"] === "1" ||
    req.headers?.["x-cache-bypass"] === "true"
  );
}

function getTtl(req) {
  if (req.path === "/api/projects") return 60;
  if (req.path === "/api/projects/featured") return 300;
  if (req.path === "/api/stats/global") return 30;
  if (req.path === "/api/leaderboard") return 45;
  return DEFAULT_TTL_SECONDS;
}

async function cacheMiddleware(req, res, next) {
  if (shouldBypass(req)) {
    res.setHeader("X-Cache", "BYPASS");
    return next();
  }

  const cacheKey = getCacheKey(req);
  const ttlSeconds = getTtl(req);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      cacheOperationsTotal.inc({ cache: "redis", op: "get", result: "hit" });
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    cacheOperationsTotal.inc({ cache: "redis", op: "get", result: "miss" });

    const existing = pendingRequests.get(cacheKey);
    if (existing) {
      const response = await existing;
      res.setHeader("X-Cache", "HIT");
      return res.json(response);
    }

    const pending = new Promise((resolve, reject) => {
      const originalJson = res.json.bind(res);
      const originalEnd = res.end.bind(res);
      const finish = (payload) => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            redis.set(cacheKey, payload, ttlSeconds).catch(() => {});
          }
          resolve(payload);
        } catch (err) {
          reject(err);
        }
      };

      res.json = (body) => {
        originalJson(body);
        finish(body);
        return res;
      };

      res.end = ((chunk, encoding, cb) => {
        if (typeof chunk === "string" || Buffer.isBuffer(chunk)) {
          try {
            const parsed = JSON.parse(chunk.toString());
            finish(parsed);
          } catch {
            finish(chunk);
          }
        } else {
          finish(chunk);
        }
        return originalEnd(chunk, encoding, cb);
      }).bind(res);
    });

    pendingRequests.set(cacheKey, pending);
    res.on("finish", () => {
      pendingRequests.delete(cacheKey);
    });
    res.on("close", () => {
      pendingRequests.delete(cacheKey);
    });

    res.setHeader("X-Cache", "MISS");
    return next();
  } catch (err) {
    cacheOperationsTotal.inc({ cache: "redis", op: "get", result: "error" });
    return next(err);
  }
}

module.exports = cacheMiddleware;
