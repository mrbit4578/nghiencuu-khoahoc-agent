import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../next.config";

test("React debugging and HMR permissions apply only in development", async () => {
  const env = process.env as Record<string, string | undefined>;
  const original = env.NODE_ENV;
  try {
    for (const environment of ["development", "production"]) {
      env.NODE_ENV = environment;
      const groups = await config.headers!();
      const csp = groups[0].headers.find(header => header.key === "Content-Security-Policy")!.value;
      assert.equal(csp.includes("'unsafe-eval'"), environment === "development");
      assert.equal(csp.includes("ws://localhost:*"), environment === "development");
      assert.equal(csp.includes("ws://127.0.0.1:*"), environment === "development");
      assert.ok(csp.includes("frame-ancestors 'none'"));
      assert.ok(csp.includes("object-src 'none'"));
      assert.ok(csp.includes("base-uri 'self'"));
    }
  } finally {
    if (original === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = original;
  }
});
