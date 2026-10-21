import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterSkills, type SkillFilters } from "../src/lib/skill-filters";
import type { Catalog } from "../src/lib/types";
import { classifySkills } from "../scripts/science-taxonomy.mjs";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const taxonomy = JSON.parse(readFileSync("data/science-taxonomy.json", "utf8"));
const defaults: SkillFilters = { query: "", family: "all", group: "all", includeRelated: false, favoritesOnly: false, favorites: [] };
const find = (changes: Partial<SkillFilters>) => filterSkills(catalog, { ...defaults, ...changes });

test("All 177 skills have exactly one reviewed primary group and valid related fields", () => {
  assert.equal(catalog.skills.length, 177);
  assert.equal(catalog.groups.length, 12);
  assert.equal(catalog.families.length, 5);
  assert.equal(catalog.groups.reduce((n, g) => n + g.count, 0), 177);
  assert.equal(new Set(catalog.skills.map((s) => s.id)).size, 177);
  for (const group of catalog.groups) {
    assert.equal(find({ group: group.id }).length, group.count);
    assert.ok(catalog.families.some((f) => f.id === group.family));
  }
  for (const skill of catalog.skills) {
    assert.equal(skill.category, catalog.groups.find((g) => g.id === skill.groupId)?.label);
    assert.ok(skill.classificationReason.trim());
    assert.ok(skill.sourceCategory);
    assert.ok(!skill.relatedGroupIds.includes(skill.groupId));
    for (const id of skill.relatedGroupIds) assert.ok(catalog.groups.some((g) => g.id === id));
  }
});

test("Classification follows the scientific object instead of old broad headings", () => {
  for (const [id, group] of Object.entries({ astropy: "physics", cobrapy: "biology", "zarr-python": "infrastructure", "marine-carbonate-chemistry": "earth", "dhdna-profiler": "methodology" }))
    assert.equal(catalog.skills.find((s) => s.id === id)?.groupId, group, id);
});

test("Family, related, search and saved filters compose without duplicate results", () => {
  assert.equal(find({ family: "natural" }).length, 73);
  const chemistry = find({ group: "chemistry" });
  const interdisciplinary = find({ group: "chemistry", includeRelated: true });
  assert.equal(chemistry.length, 14);
  assert.ok(interdisciplinary.length > chemistry.length);
  assert.ok(!chemistry.some((s) => s.id === "cobrapy"));
  assert.ok(interdisciplinary.some((s) => s.id === "cobrapy"));
  assert.equal(new Set(interdisciplinary.map((s) => s.id)).size, interdisciplinary.length);
  assert.equal(find({ query: "thien van astropy" })[0]?.id, "astropy");
  assert.deepEqual(find({ query: "hoá học", group: "chemistry", favoritesOnly: true, favorites: ["rdkit", "astropy"] }).map((s) => s.id), ["rdkit"]);
  assert.equal(find({ group: "physics", family: "health", includeRelated: true }).length, 0);
  assert.equal(filterSkills(null, defaults).length, 0);
});

test("Build fails on missing, duplicate, unknown or invalid classifications", () => {
  const invalid = (mutate: (copy: typeof taxonomy) => void, pattern: RegExp) => {
    const copy = structuredClone(taxonomy);
    mutate(copy);
    assert.throws(() => classifySkills(catalog.skills, copy), pattern);
  };
  invalid((t) => t.groups[0].skills.pop(), /Unclassified/);
  invalid((t) => t.groups[0].skills.push("astropy"), /Duplicate assignment/);
  invalid((t) => t.groups[0].skills.push("unknown-skill"), /Unknown skill/);
  invalid((t) => t.crossDisciplinary.astropy.relatedGroups.push("physics"), /Invalid related group/);
  invalid((t) => t.groups[0].family = "unknown", /Unknown family/);
});
