export function selectSkills(current: string[], ids: string[], checked: boolean): string[] {
  const scope = new Set(ids);
  return checked
    ? [...new Set([...current, ...ids])]
    : current.filter((id) => !scope.has(id));
}

export function selectionState(current: string[], ids: string[]) {
  const chosen = new Set(current);
  const count = ids.filter((id) => chosen.has(id)).length;
  return {
    checked: ids.length > 0 && count === ids.length,
    partial: count > 0 && count < ids.length,
    count,
  };
}
