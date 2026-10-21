export function describe(rows: Record<string, string>[]) {
  if (!rows.length) throw new Error("CSV không có dòng dữ liệu.");
  if (rows.length > 100000) throw new Error("Tối đa 100.000 dòng.");
  return Object.keys(rows[0]).map((column) => {
    const values = rows.map((r) => r[column]?.trim() ?? "");
    const present = values.filter(Boolean);
    const numbers = present.map(Number);
    const numeric = present.length > 0 && numbers.every(Number.isFinite);
    const sorted = numeric ? [...numbers].sort((a, b) => a - b) : [];
    const sum = numeric ? numbers.reduce((a, b) => a + b, 0) : 0;
    const mean = numeric ? sum / numbers.length : null;
    const variance =
      numeric && numbers.length > 1
        ? numbers.reduce((s, n) => s + (n - mean!) ** 2, 0) /
          (numbers.length - 1)
        : null;
    return {
      column,
      type: numeric ? "Số" : "Văn bản",
      count: values.length,
      missing: values.length - present.length,
      unique: new Set(present).size,
      min: numeric ? sorted[0] : null,
      max: numeric ? sorted.at(-1)! : null,
      mean,
      median: numeric
        ? sorted.length % 2
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : null,
      standardDeviation: variance === null ? null : Math.sqrt(variance),
    };
  });
}
export function sequenceStats(input: string) {
  const sequence = input
    .split(/\r?\n/)
    .filter((l) => !l.startsWith(">"))
    .join("")
    .replace(/\s/g, "")
    .toUpperCase();
  if (!sequence || !/^[ACGTN]+$/.test(sequence))
    throw new Error("Nhập một chuỗi DNA chỉ chứa A, C, G, T, N.");
  if (input.split(/\r?\n/).filter((l) => l.startsWith(">")).length > 1)
    throw new Error("Chỉ hỗ trợ một trình tự mỗi lần phân tích.");
  const counts = Object.fromEntries(
    "ACGTN"
      .split("")
      .map((c) => [c, [...sequence].filter((x) => x === c).length]),
  );
  const known = sequence.length - counts.N;
  return {
    length: sequence.length,
    counts,
    gcPercent: known ? ((counts.G + counts.C) / known) * 100 : null,
    reverseComplement: [...sequence]
      .reverse()
      .map((c) => ({ A: "T", T: "A", C: "G", G: "C", N: "N" })[c])
      .join(""),
  };
}
