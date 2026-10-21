import { cookies } from "next/headers";
import { z } from "zod";
import {
  SESSION_COOKIE,
  authConfigured,
  boundedJson,
  equal,
  issueSession,
  quota,
  sameOrigin,
} from "@/lib/security";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Nguồn yêu cầu không hợp lệ." },
      { status: 403 },
    );
  if (!authConfigured())
    return Response.json(
      { error: "Cần cấu hình APP_PASSWORD và AUTH_SECRET trên Vercel." },
      { status: 503 },
    );
  // Global login budget also applies across serverless instances when Redis is configured.
  if (!(await quota("login", 30, 900)))
    return Response.json(
      { error: "Quá nhiều lần thử. Vui lòng thử lại sau." },
      { status: 429 },
    );
  let body;
  try {
    body = z
      .object({ password: z.string().min(1).max(256) })
      .parse(await boundedJson(request, 2000));
  } catch {
    return Response.json({ error: "Mật khẩu không hợp lệ." }, { status: 400 });
  }
  if (!equal(body.password, process.env.APP_PASSWORD || ""))
    return Response.json({ error: "Mật khẩu không đúng." }, { status: 401 });
  (await cookies()).set(SESSION_COOKIE, issueSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600,
  });
  return Response.json({ ok: true });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
