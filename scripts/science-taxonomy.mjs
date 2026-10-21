// Explicitly reviewed assignments: never silently guess a new skill's field.
export function classifySkills(skills, taxonomy) {
  const families = new Set(taxonomy.families.map((f) => f.id));
  const groups = new Map(taxonomy.groups.map((g) => [g.id, g]));
  if (families.size !== taxonomy.families.length || groups.size !== taxonomy.groups.length)
    throw new Error("Duplicate taxonomy group or family");
  const knownSkills = new Set(skills.map((s) => s.id));
  const assignments = new Map();
  for (const group of taxonomy.groups) {
    if (!families.has(group.family)) throw new Error(`Unknown family: ${group.id}`);
    for (const id of group.skills) {
      if (!knownSkills.has(id)) throw new Error(`Unknown skill: ${id}`);
      if (assignments.has(id)) throw new Error(`Duplicate assignment: ${id}`);
      assignments.set(id, group);
    }
  }
  for (const [id, cross] of Object.entries(taxonomy.crossDisciplinary)) {
    if (!knownSkills.has(id)) throw new Error(`Unknown cross-disciplinary skill: ${id}`);
    if (!cross.reason?.trim()) throw new Error(`Missing classification reason: ${id}`);
    if (new Set(cross.relatedGroups).size !== cross.relatedGroups.length)
      throw new Error(`Duplicate related group: ${id}`);
    for (const related of cross.relatedGroups)
      if (!groups.has(related) || related === assignments.get(id)?.id)
        throw new Error(`Invalid related group: ${id}/${related}`);
  }
  return {
    skills: skills.map((skill) => {
      const group = assignments.get(skill.id);
      if (!group) throw new Error(`Unclassified skill: ${skill.id}`);
      const cross = taxonomy.crossDisciplinary[skill.id];
      return {
        ...skill,
        sourceCategory: skill.category,
        category: group.label,
        groupId: group.id,
        relatedGroupIds: cross?.relatedGroups || [],
        classificationReason: cross?.reason || group.description,
      };
    }),
    families: taxonomy.families,
    groups: taxonomy.groups.map(({ skills: ids, ...group }) => ({ ...group, count: ids.length })),
  };
}
