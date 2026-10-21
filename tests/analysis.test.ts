import { test } from "node:test";
import assert from "node:assert/strict";
import { describe, sequenceStats } from "../src/lib/analysis";
import { projectsSchema } from "../src/lib/projects";
test("CSV statistics handle missing values, sample standard deviation and numeric zero", () => {
  const stats = describe([
    { a: "0", label: "control" },
    { a: "2", label: "treatment" },
    { a: "4", label: "" },
    { a: "", label: "control" },
  ]);
  assert.deepEqual(stats[0], {
    column: "a",
    type: "Số",
    count: 4,
    missing: 1,
    unique: 3,
    min: 0,
    max: 4,
    mean: 2,
    median: 2,
    standardDeviation: 2,
  });
  assert.equal(stats[1].type, "Văn bản");
  assert.equal(stats[1].mean, null);
  assert.equal(stats[1].unique, 2);
});
test("CSV rejects empty and excessive row sets and handles non-finite numbers as text", () => {
  assert.throws(() => describe([]));
  assert.throws(() => describe(Array(100001).fill({ a: "1" })));
  assert.equal(describe([{ a: "Infinity" }])[0].mean, null);
  assert.equal(describe([{ a: "1" }, { a: "3" }])[0].median, 2);
  assert.equal(describe([{ a: "1" }])[0].standardDeviation, null);
});
test("DNA honors FASTA headers, excludes unknowns from GC denominator and computes reverse complement", () => {
  assert.deepEqual(sequenceStats(">sequence\natgcNN"), {
    length: 6,
    counts: { A: 1, C: 1, G: 1, T: 1, N: 2 },
    gcPercent: 50,
    reverseComplement: "NNGCAT",
  });
  assert.equal(sequenceStats("NNN").gcPercent, null);
  assert.throws(() => sequenceStats("AGUX"));
  assert.throws(() => sequenceStats(">one\nAAA\n>two\nCCC"));
});
test("Project import rejects script URLs and malformed backups", () => {
  const project = {
    id: "p1",
    title: "Example",
    notes: "notes",
    skills: ["scanpy"],
    papers: [],
    updated: new Date().toISOString(),
  };
  assert.equal(projectsSchema.parse([project]).length, 1);
  assert.throws(() =>
    projectsSchema.parse([{ ...project, skills: ["../../etc/passwd"] }]),
  );
  assert.throws(() =>
    projectsSchema.parse([
      {
        ...project,
        papers: [
          {
            id: "1",
            title: "title",
            year: 2026,
            authors: [],
            doi: null,
            url: "javascript:alert(1)",
            citations: 0,
            venue: "",
            abstract: "",
            openAccess: false,
          },
        ],
      },
    ]),
  );
});
