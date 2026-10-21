import { quota } from "@/lib/security";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 3 || query.length > 300)
    return Response.json(
      { error: "Từ khóa cần từ 3 đến 300 ký tự." },
      { status: 400 },
    );
  if (!(await quota("papers", 180, 60)))
    return Response.json(
      { error: "Nhiều yêu cầu tìm kiếm. Thử lại sau một phút." },
      { status: 429 },
    );
  try {
    const url = new URL(
      "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
    );
    url.search = new URLSearchParams({
      query,
      format: "json",
      pageSize: "20",
      resultType: "core",
    }).toString();
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("upstream");
    const data = await res.json();
    const results = (data.resultList?.result || []).map(
      (p: Record<string, unknown>) => {
        const authors =
          (p.authorList as { author?: { fullName?: string }[] })?.author || [];
        return {
          id: `${p.source}:${p.id}`,
          title: String(p.title || ""),
          year: Number(p.pubYear) || null,
          authors: authors.map((a) => a.fullName).filter(Boolean),
          doi: typeof p.doi === "string" ? p.doi : null,
          url:
            typeof p.doi === "string"
              ? `https://doi.org/${encodeURIComponent(p.doi)}`
              : `https://europepmc.org/article/${encodeURIComponent(String(p.source))}/${encodeURIComponent(String(p.id))}`,
          citations: Number(p.citedByCount) || 0,
          venue: String(
            (p.journalInfo as { journal?: { title?: string } })?.journal
              ?.title || "",
          ),
          abstract: String(p.abstractText || "").replace(/<[^>]*>/g, ""),
          openAccess: p.isOpenAccess === "Y",
        };
      },
    );
    return Response.json({
      results,
      total: data.hitCount,
      source: "Europe PMC",
    });
  } catch {
    return Response.json(
      { error: "Europe PMC hiện không phản hồi. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}
