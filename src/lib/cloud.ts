export function cloudConfigured() {
  return (
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
export async function redis(command: (string | number)[]) {
  if (!cloudConfigured()) throw new Error("Cloud storage not configured");
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Cloud storage unavailable");
  const data = await response.json();
  if (data.error) throw new Error("Redis command failed");
  return data.result;
}
