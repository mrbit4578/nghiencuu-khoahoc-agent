import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
export const SESSION_COOKIE = "research_session";
export function equal(a: string, b: string) {
  const aa = Buffer.from(a),
    bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function authConfigured() {
  return (
    !!process.env.APP_PASSWORD && (process.env.AUTH_SECRET?.length || 0) >= 32
  );
}
function sign(payload: string) {
  return createHmac("sha256", process.env.AUTH_SECRET || "")
    .update(payload)
    .digest("hex");
}
export function issueSession() {
  const payload = `${Date.now() + 8 * 3600_000}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}
export function verifySession(token: string) {
  if (!authConfigured()) return false;
  const parts = token.split(".");
  return (
    parts.length === 3 &&
    Number(parts[0]) > Date.now() &&
    equal(parts[2], sign(parts.slice(0, 2).join(".")))
  );
}
export async function authenticated() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value || "");
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const server = new URL(request.url);
    // Next may construct request.url with its internal bind hostname.
    // Host reflects the requested deployment; browsers cannot forge it in fetch.
    const host = request.headers.get("host") || server.host;
    const protocol = request.headers.get("x-forwarded-proto") || server.protocol.slice(0,-1);
    return ["http:","https:"].includes(parsed.protocol) && parsed.host === host.toLowerCase() && parsed.protocol === protocol+":";
  } catch { return false; }
}
export async function boundedJson(request: Request, max = 64_000) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Thiếu dữ liệu yêu cầu.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > max) {
        await reader.cancel();
        throw new Error("Dữ liệu vượt giới hạn cho phép.");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    reader.releaseLock();
  }
}
const buckets = new Map<string, { count: number; expires: number }>();
export async function quota(key: string, limit = 20, seconds = 3600) {
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const bucket = `research:${key}:${Math.floor(Date.now() / (seconds * 1000))}`;
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", bucket],
          ["EXPIRE", bucket, seconds * 2],
        ]),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return false;
      const result = await res.json();
      return Number.isFinite(result?.[0]?.result) && result[0].result <= limit;
    } catch {
      return false;
    }
  }
  // Per-process fallback only. Configure Redis for quotas shared across instances.
  if (buckets.size > 5000)
    for (const [id, b] of buckets)
      if (b.expires < Date.now()) buckets.delete(id);
  let bucket = buckets.get(key);
  if (!bucket || bucket.expires < Date.now()) {
    bucket = { count: 0, expires: Date.now() + seconds * 1000 };
    buckets.set(key, bucket);
  }
  return ++bucket.count <= limit;
}
