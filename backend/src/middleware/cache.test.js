"use strict";

jest.mock("../services/redis", () => ({
  get: jest.fn(),
  set: jest.fn(),
  deletePattern: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const redis = require("../services/redis");
const cacheMiddleware = require("./cache");

function createApp(handler) {
  const app = express();
  app.use(cacheMiddleware);
  app.get("/test", handler);
  return app;
}

describe("response cache middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("responds with a cached payload and X-Cache: HIT", async () => {
    redis.get.mockResolvedValue({ success: true, cached: true });

    const app = createApp((req, res) => {
      res.json({ success: false, cached: false });
    });

    const response = await request(app).get("/test?foo=bar");

    expect(response.status).toBe(200);
    expect(response.headers["x-cache"]).toBe("HIT");
    expect(response.body).toEqual({ success: true, cached: true });
    expect(redis.get).toHaveBeenCalled();
  });

  test("caches a 200 JSON response on miss and sets X-Cache: MISS", async () => {
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue(undefined);

    const app = createApp((req, res) => {
      res.json({ success: true, cached: false });
    });

    const response = await request(app).get("/test?foo=bar");

    expect(response.status).toBe(200);
    expect(response.headers["x-cache"]).toBe("MISS");
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining("rsp:"),
      { success: true, cached: false },
      expect.any(Number),
    );
  });

  test("deduplicates concurrent misses so the route handler only runs once", async () => {
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue(undefined);

    let calls = 0;
    const app = createApp((req, res) => {
      calls += 1;
      setTimeout(() => res.json({ ok: true }), 20);
    });

    const [first, second] = await Promise.all([
      request(app).get("/test"),
      request(app).get("/test"),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(calls).toBe(1);
  });
});
