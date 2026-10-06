export type SkillMentionSegment =
  | { kind: "text"; start: number; text: string }
  | { kind: "skill"; start: number; name: string; text: string };

const SLASH_TOKEN = /(^|\s)\/([^\s/"']+)(?=\s|$)/;
const SLASH_TOKENS = new RegExp(SLASH_TOKEN.source, "g");

export function hasSlashToken(text: string): boolean {
  return SLASH_TOKEN.test(text);
}

export function splitSkillMentions(
  text: string,
  skillNames: ReadonlySet<string>,
): SkillMentionSegment[] {
  const segments: SkillMentionSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(SLASH_TOKENS)) {
    const name = match[2];
    if (!skillNames.has(name)) {
      continue;
    }
    const start = match.index + match[1].length;
    if (start > cursor) {
      segments.push({ kind: "text", start: cursor, text: text.slice(cursor, start) });
    }
    const end = start + name.length + 1;
    segments.push({ kind: "skill", start, name, text: text.slice(start, end) });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ kind: "text", start: cursor, text: text.slice(cursor) });
  }
  return segments;
}
