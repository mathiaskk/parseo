import { describe, expect, it } from "vitest";
import type { ProviderSnapshotEntry } from "@getpaseo/protocol/agent-types";
import { buildProviderAccountOptions } from "./provider-accounts";

function entry(
  overrides: Partial<ProviderSnapshotEntry> & Pick<ProviderSnapshotEntry, "provider">,
): ProviderSnapshotEntry {
  return {
    status: "ready",
    enabled: true,
    label: overrides.provider,
    ...overrides,
  };
}

describe("buildProviderAccountOptions", () => {
  const entries = [
    entry({ provider: "claude", label: "Claude Max" }),
    entry({ provider: "codex", label: "Codex" }),
    entry({ provider: "claude-pro", label: "Claude Pro", extends: "claude" }),
    entry({ provider: "zai", label: "Z.AI", extends: "claude-pro" }),
  ];

  it("groups a builtin provider with every provider that extends it", () => {
    expect(buildProviderAccountOptions(entries, "claude")).toEqual([
      { id: "claude", label: "Claude Max" },
      { id: "claude-pro", label: "Claude Pro" },
      { id: "zai", label: "Z.AI" },
    ]);
  });

  it("resolves the family from a custom provider too", () => {
    expect(buildProviderAccountOptions(entries, "zai").map((option) => option.id)).toEqual([
      "claude",
      "claude-pro",
      "zai",
    ]);
  });

  it("returns nothing when the selected provider has no siblings", () => {
    expect(buildProviderAccountOptions(entries, "codex")).toEqual([]);
    expect(buildProviderAccountOptions(entries, null)).toEqual([]);
  });

  it("skips providers that cannot be selected", () => {
    expect(
      buildProviderAccountOptions(
        [
          entry({ provider: "claude" }),
          entry({ provider: "claude-pro", extends: "claude", status: "unavailable" }),
          entry({ provider: "claude-old", extends: "claude", enabled: false }),
        ],
        "claude",
      ),
    ).toEqual([]);
  });
});
