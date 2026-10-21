import type { Catalog, Skill } from "./types";

export type SkillFilters = {
  query: string;
  family: string;
  group: string;
  includeRelated: boolean;
  favoritesOnly: boolean;
  favorites: string[];
};
function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d");
}
export function filterSkills(catalog: Catalog | null, filters: SkillFilters): Skill[] {
  if (!catalog) return [];
  const groups = new Map(catalog.groups.map((g) => [g.id, g]));
  const families = new Map(catalog.families.map((f) => [f.id, f.label]));
  const words = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return catalog.skills.filter((skill) => {
    const memberships = [skill.groupId, ...(filters.includeRelated ? skill.relatedGroupIds : [])];
    const matchesField = memberships.some((id) =>
      (filters.group === "all" || filters.group === id) &&
      (filters.family === "all" || groups.get(id)?.family === filters.family),
    );
    const searchText = normalize([
      skill.id, skill.title, skill.description, skill.sourceCategory,
      ...[skill.groupId, ...skill.relatedGroupIds].flatMap((id) => {
        const group = groups.get(id);
        return [group?.label || "", families.get(group?.family || "") || ""];
      }),
    ].join(" "));
    return matchesField && (!filters.favoritesOnly || filters.favorites.includes(skill.id)) &&
      words.every((word) => searchText.includes(word));
  });
}
