import { describe, expect, it } from "vitest";
import {
  resolveProviderUsageDescriptions,
  resolveSidebarUsageAccounts,
  type SidebarUsageAccount,
} from "./sidebar-card-model";
import type { UsageReportEntry } from "./types";

function claudeAccount(id: string, email: string, plan: string, usedPct: number): UsageReportEntry {
  return {
    id: `claude:${id}`,
    account: { label: email },
    fetchedAt: "2026-01-01T00:00:00.000Z",
    sourceId: "claude",
    sourceLabel: "Claude",
    icon: "<svg/>",
    report: {
      status: "available",
      planLabel: plan,
      windows: [
        { id: "five_hour", label: "Session", summary: true, usedPct },
        { id: "seven_day", label: "Weekly", summary: true, usedPct: 10 },
        { id: "seven_day_opus", label: "Weekly Opus", usedPct: 99 },
      ],
    },
  };
}

function windowTexts(account: SidebarUsageAccount): string[] {
  return account.windows.map((window) => `${window.label} ${window.percentText}`);
}

describe("resolveSidebarUsageAccounts", () => {
  it("lists every account with its summary windows only", () => {
    const accounts = resolveSidebarUsageAccounts(
      [
        claudeAccount("max", "max@example.com", "Max", 31),
        claudeAccount("pro", "pro@example.com", "Pro", 70),
      ],
      "used",
    );
    expect(
      accounts.map((account) => [account.title, account.subtitle, windowTexts(account)]),
    ).toEqual([
      ["Max", "max@example.com", ["Session 31%", "Weekly 10%"]],
      ["Pro", "pro@example.com", ["Session 70%", "Weekly 10%"]],
    ]);
  });

  it("shows the remaining share when the user prefers it", () => {
    const [account] = resolveSidebarUsageAccounts(
      [claudeAccount("max", "max@example.com", "Max", 31)],
      "remaining",
    );
    expect(account?.windows[0]?.percentText).toBe("69% left");
  });

  it("keeps an account whose login expired, with the fix", () => {
    const expired: UsageReportEntry = {
      ...claudeAccount("pro", "pro@example.com", "Pro", 0),
      report: {
        status: "unavailable",
        problem: { kind: "expired", expiresAt: new Date().toISOString(), refreshedBy: "claude" },
      },
    };
    const [account] = resolveSidebarUsageAccounts([expired], "used");
    expect(account?.subtitle).toBe("pro@example.com");
    expect(account?.windows).toEqual([]);
    expect(account?.problem).toContain("Run claude to refresh it.");
  });

  it("shows a failed fetch's error", () => {
    const failed: UsageReportEntry = {
      ...claudeAccount("pro", "pro@example.com", "Pro", 0),
      report: { status: "error", error: "Usage fetch timed out" },
    };
    expect(resolveSidebarUsageAccounts([failed], "used")[0]?.problem).toBe("Usage fetch timed out");
  });

  it("describes each provider's account usage for the account picker", () => {
    const max = { ...claudeAccount("max", "max@example.com", "Max", 31), providerIds: ["claude"] };
    const pro = {
      ...claudeAccount("pro", "pro@example.com", "Pro", 70),
      providerIds: ["claude-alt"],
    };
    const descriptions = resolveProviderUsageDescriptions(
      resolveSidebarUsageAccounts([max, pro], "used"),
    );
    expect([...descriptions]).toEqual([
      ["claude", "Session 31% · Weekly 10%"],
      ["claude-alt", "Session 70% · Weekly 10%"],
    ]);
  });
});
