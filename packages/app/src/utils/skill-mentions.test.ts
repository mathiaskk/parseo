import { describe, expect, it } from "vitest";

import { hasSlashToken, splitSkillMentions } from "./skill-mentions";

const skills = new Set(["diagnose", "caveman:caveman", "tdd"]);

describe("splitSkillMentions", () => {
  it("splits a leading skill from its arguments", () => {
    expect(splitSkillMentions("/diagnose the PR data does not update", skills)).toEqual([
      { kind: "skill", start: 0, name: "diagnose", text: "/diagnose" },
      { kind: "text", start: 9, text: " the PR data does not update" },
    ]);
  });

  it("finds namespaced and inline skills", () => {
    expect(splitSkillMentions("fix it with /tdd\nthen /caveman:caveman", skills)).toEqual([
      { kind: "text", start: 0, text: "fix it with " },
      { kind: "skill", start: 12, name: "tdd", text: "/tdd" },
      { kind: "text", start: 16, text: "\nthen " },
      { kind: "skill", start: 22, name: "caveman:caveman", text: "/caveman:caveman" },
    ]);
  });

  it("leaves unknown commands, paths, and partial tokens as text", () => {
    const text = "run /compact on /tmp/diagnose and a/tdd or /tdd.";
    expect(splitSkillMentions(text, skills)).toEqual([{ kind: "text", start: 0, text }]);
  });
});

describe("hasSlashToken", () => {
  it("detects slash tokens at word boundaries only", () => {
    expect(hasSlashToken("/diagnose")).toBe(true);
    expect(hasSlashToken("use /tdd here")).toBe(true);
    expect(hasSlashToken("see /home/me/file")).toBe(false);
    expect(hasSlashToken("and/or")).toBe(false);
  });
});
