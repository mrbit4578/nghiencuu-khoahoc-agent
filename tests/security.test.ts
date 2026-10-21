import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authConfigured,
  boundedJson,
  equal,
  issueSession,
  quota,
  sameOrigin,
  verifySession,
} from "../src/lib/security";
test("AI authentication fails closed and rejects tampered sessions", () => {
  delete process.env.APP_PASSWORD;
  delete process.env.AUTH_SECRET;
  assert.equal(authConfigured(), false);
  assert.equal(verifySession("123.x.y"), false);
  process.env.APP_PASSWORD = "test-password";
  process.env.AUTH_SECRET = "unit-test-secret-with-at-least-32-characters";
  const token = issueSession();
  assert.equal(verifySession(token), true);
  assert.equal(verifySession(token + "x"), false);
  assert.equal(
    verifySession("0." + token.split(".").slice(1).join(".")),
    false,
  );
  assert.equal(equal("a", "aa"), false);
  assert.equal(equal("test", "test"), true);
});
test("Mutations require matching Origin", () => {
  assert.equal(
    sameOrigin(new Request("http://0.0.0.0:3000/api/auth",{headers:{host:"localhost:3000",origin:"http://localhost:3000"}})),
    true,
  );
  assert.equal(
    sameOrigin(new Request("http://internal:3000/api/auth",{headers:{host:"research.example.com","x-forwarded-proto":"https",origin:"https://research.example.com"}})),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("https://example.com/api/auth", {
        headers: { origin: "https://example.com" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("https://example.com/api/auth", {
        headers: { origin: "https://attacker.com" },
      }),
    ),
    false,
  );
  assert.equal(sameOrigin(new Request("https://example.com/api/auth")), false);
});
test("Body size limits apply to actual bytes rather than trusting headers", async () => {
  assert.deepEqual(
    await boundedJson(
      new Request("https://example.com", {
        method: "POST",
        body: '{"valid":true}',
      }),
    ),
    { valid: true },
  );
  await assert.rejects(
    boundedJson(
      new Request("https://example.com", {
        method: "POST",
        body: '{"text":"' + "x".repeat(100) + '"}',
      }),
      20,
    ),
  );
});
test("Quota refuses requests after the configured budget", async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  assert.equal(await quota("unit-test-quota", 2, 60), true);
  assert.equal(await quota("unit-test-quota", 2, 60), true);
  assert.equal(await quota("unit-test-quota", 2, 60), false);
});
