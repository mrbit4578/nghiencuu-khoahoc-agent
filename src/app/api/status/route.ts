import { authConfigured, authenticated } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  const cloudStorage =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;
  const ai = !!process.env.AI_API_KEY && authConfigured();
  let aiProvider = "Dịch vụ AI";
  try {
    if (
      new URL(process.env.AI_BASE_URL || "https://api.openai.com/v1")
        .hostname === "larprouter.com"
    )
      aiProvider = "LarpRouter";
  } catch {
    /* The chat endpoint reports an invalid provider configuration. */
  }
  return Response.json(
    {
      ai,
      aiProvider: ai ? aiProvider : null,
      aiModel: ai ? process.env.AI_MODEL || "gpt-4.1-mini" : null,
      authConfigured: authConfigured(),
      authenticated: await authenticated(),
      cloudStorage,
      durableQuota: cloudStorage,
      storage: cloudStorage ? "redis-available" : "browser-local",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
