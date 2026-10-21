import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { source, manifest, pool } from "./ensure-upstream.mjs";
import { classifySkills } from "./science-taxonomy.mjs";
const root = process.cwd();
const doc = await fs.readFile(path.join(source, "docs/skills.md"), "utf8");
let category = "Other";
const categories = new Map();
for (const line of doc.split("\n")) {
  if (/^#{2,3} /.test(line)) category = line.replace(/^#+ /, "");
  for (const match of line.matchAll(/\.\.\/skills\/([^/]+)\/SKILL\.md/g))
    categories.set(match[1], category);
}
const all = manifest.map((entry) => entry.path).sort();
const skills = [];
for (const id of (await fs.readdir(path.join(source, "skills"))).sort()) {
  const md = await fs.readFile(
    path.join(source, "skills", id, "SKILL.md"),
    "utf8",
  );
  const boundary = md.indexOf("\n---", 4);
  if (!md.startsWith("---\n") || boundary < 0)
    throw new Error(`Missing frontmatter: ${id}`);
  const data = parse(md.slice(4, boundary));
  const content = md.slice(boundary + 4);
  const files = all.filter((f) => f.startsWith(`skills/${id}/`));
  skills.push({
    id,
    name: String(data.name || id),
    title: content.match(/^#\s+(.+)$/m)?.[1] || id,
    description: String(data.description || ""),
    category: categories.get(id) || "Other",
    compatibility: String(data.compatibility || ""),
    version: String(data.metadata?.version || ""),
    files,
    scripts: files.filter((f) => f.endsWith(".py") && f.includes("/scripts/"))
      .length,
    image: all.includes(`docs/images/${id}.png`)
      ? `docs/images/${id}.png`
      : null,
    execution: "Tài liệu + mã nguồn; thực thi chuyên sâu cần môi trường riêng",
  });
}
await fs.mkdir(path.join(root, "data"), { recursive: true });
await fs.mkdir(path.join(root, "public"), { recursive: true });
const classified = classifySkills(skills, JSON.parse(
  await fs.readFile(path.join(root, "data/science-taxonomy.json"), "utf8"),
));
const catalog = {
  ...classified,
  fileCount: all.length,
  version: JSON.parse(
    await fs.readFile(path.join(source, "plugin.json"), "utf8"),
  ).version,
  categories: classified.groups.map((g) => g.label),
};
await fs.writeFile(
  path.join(root, "data/catalog.json"),
  JSON.stringify(catalog),
);
await fs.writeFile(
  path.join(root, "public/catalog.json"),
  JSON.stringify(catalog),
);
await fs.writeFile(path.join(root, "public/files.json"), JSON.stringify(all));
// Static assets preserve the original relative links; no Python runs inside Vercel.
await pool(manifest, async (entry) => {
  const target = path.join(root, "public/library", entry.path);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(path.join(source, entry.path), target);
});
// A prior local test run may have left cache files in the generated directory.
// Only generated files outside the authoritative archive manifest are removed.
const generatedRoot = path.resolve(root, "public/library");
const expectedPaths = new Set(all);
async function pruneGenerated(directory, prefix = "") {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    const absolute = path.resolve(directory, entry.name);
    if (
      !absolute.startsWith(generatedRoot + path.sep) ||
      entry.isSymbolicLink()
    )
      throw new Error("Unsafe generated asset path");
    if (entry.isDirectory()) await pruneGenerated(absolute, relative + "/");
    else if (!expectedPaths.has(relative)) await fs.unlink(absolute);
  }
}
await pruneGenerated(generatedRoot);
await fs.mkdir(path.join(root, "public/audit"), { recursive: true });
for (const name of ["summary.json", "manifest.json", "findings.json"])
  await fs.copyFile(
    path.join(root, "audit", name),
    path.join(root, "public/audit", name),
  );
console.log(
  `Catalog: ${skills.length} skills, ${all.length} original files. All copied for static serving.`,
);
