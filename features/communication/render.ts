/**
 * Pure {tag} substitution — the same tags_hint convention the legacy
 * schema already used (e.g. "{student_name}, {school_name}"). Unknown
 * tags are left as-is rather than silently dropped, so a typo in a
 * template is visible in the sent message instead of vanishing.
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
  });
}
