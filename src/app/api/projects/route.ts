import { z } from "zod";
import { projectsSchema } from "@/lib/projects";
import { authenticated, boundedJson, sameOrigin } from "@/lib/security";
import { cloudConfigured, redis } from "@/lib/cloud";
export const dynamic = "force-dynamic";
const key = "research:projects:v1";
export async function GET() {
  if (!(await authenticated()))
    return Response.json(
      { error: "Đăng nhập workspace để đồng bộ dự án." },
      { status: 401 },
    );
  if (!cloudConfigured())
    return Response.json(
      { error: "Cần cấu hình Redis để lưu dự án đám mây." },
      { status: 503 },
    );
  try {
    const raw = await redis(["GET", key]);
    const data = raw ? JSON.parse(raw) : { revision: 0, projects: [] };
    projectsSchema.parse(data.projects);
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Không đọc được dữ liệu đám mây." },
      { status: 502 },
    );
  }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Nguồn yêu cầu không hợp lệ." },
      { status: 403 },
    );
  if (!(await authenticated()))
    return Response.json(
      { error: "Đăng nhập workspace để đồng bộ dự án." },
      { status: 401 },
    );
  if (!cloudConfigured())
    return Response.json(
      { error: "Cần cấu hình Redis để lưu dự án đám mây." },
      { status: 503 },
    );
  let input;
  try {
    input = z
      .object({ revision: z.number().int().min(0), projects: projectsSchema })
      .parse(await boundedJson(request, 4_000_000));
  } catch {
    return Response.json(
      { error: "Dữ liệu dự án không hợp lệ hoặc lớn hơn 4 MB." },
      { status: 400 },
    );
  }
  try {
    const value = JSON.stringify({
      revision: input.revision + 1,
      projects: input.projects,
    });
    // Atomic compare-and-swap prevents overwriting a concurrent browser update.
    const script =
      "local old=redis.call('GET',KEYS[1]);local rev=0;if old then rev=cjson.decode(old).revision end;if rev~=tonumber(ARGV[1]) then return 0 end;redis.call('SET',KEYS[1],ARGV[2]);return 1";
    const saved = await redis(["EVAL", script, 1, key, input.revision, value]);
    if (Number(saved) !== 1)
      return Response.json(
        {
          error:
            "Có thay đổi mới từ thiết bị khác. Đồng bộ lại để hợp nhất dữ liệu.",
        },
        { status: 409 },
      );
    return Response.json({ revision: input.revision + 1 });
  } catch {
    return Response.json(
      { error: "Không lưu được dữ liệu đám mây." },
      { status: 502 },
    );
  }
}
