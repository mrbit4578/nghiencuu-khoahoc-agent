import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
const root = process.cwd();
export const source = path.join(root, "vendor/scientific-agent-skills");
export const manifest = JSON.parse(
  await fs.readFile(path.join(root, "audit/manifest.json"), "utf8"),
);
const lock = JSON.parse(
  await fs.readFile(path.join(root, "upstream.lock.json"), "utf8"),
);
for (const entry of manifest)
  if (
    path.isAbsolute(entry.path) ||
    entry.path.split(/[\\/]/).some((p) => p === "..") ||
    !entry.path
  )
    throw new Error("Unsafe manifest path");
export async function pool(items, fn, concurrency = 12) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        await fn(item);
      }
    }),
  );
}
async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
if (
  !(await exists(path.join(source, "plugin.json"))) ||
  process.argv.includes("--verify-download")
) {
  const url = `https://codeload.github.com/${lock.repository}/zip/${lock.commit}`;
  console.log(
    `Fetching immutable upstream ${lock.commit} (${manifest.length} files)…`,
  );
  const response = await fetch(url, { signal: AbortSignal.timeout(300000) });
  if (!response.ok)
    throw new Error(`Upstream download failed: ${response.status}`);
  const zip = new Uint8Array(await response.arrayBuffer());
  const expected = new Set(manifest.map((e) => e.path));
  const unpacked = unzipSync(zip, {
    filter: (file) => expected.has(file.name.split("/").slice(1).join("/")),
  });
  const entries = new Map(
    Object.entries(unpacked).map(([name, data]) => [
      name.split("/").slice(1).join("/"),
      data,
    ]),
  );
  if (entries.size !== manifest.length)
    throw new Error("Archive file count differs from audited manifest");
  // Validate the complete archive before writing any source marker.
  for (const entry of manifest) {
    const data = entries.get(entry.path);
    if (
      !data ||
      createHash("sha256").update(data).digest("hex") !== entry.sha256
    )
      throw new Error(
        `Downloaded file differs from audited source: ${entry.path}`,
      );
  }
  await pool(manifest, async (entry) => {
    const target = path.join(source, entry.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, entries.get(entry.path));
  });
}
await pool(manifest, async (entry) => {
  const bytes = await fs.readFile(path.join(source, entry.path));
  if (
    bytes.length !== entry.size ||
    createHash("sha256").update(bytes).digest("hex") !== entry.sha256
  )
    throw new Error(`Source integrity check failed: ${entry.path}`);
});
if (process.platform !== "win32") {
  const known = new Set(manifest.map(entry => entry.path));
  await pool(lock.executableFiles || [], async file => {
    if (!known.has(file)) throw new Error("Executable metadata is outside the audited manifest");
    await fs.chmod(path.join(source, file), 0o755);
  });
}
console.log(
  `Verified ${manifest.length} source files against the original audit.`,
);
