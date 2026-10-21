import { authConfigured, authenticated } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  const cloudStorage =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;
  return Response.json(
    {
      ai: !!process.env.AI_API_KEY && authConfigured(),
      authConfigured: authConfigured(),
      authenticated: await authenticated(),
      cloudStorage,
      durableQuota: cloudStorage,
      storage: cloudStorage ? "redis-available" : "browser-local",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
