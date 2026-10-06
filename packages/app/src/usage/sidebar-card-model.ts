import { usageCopy } from "./copy";
import { formatDisplayPct, formatResetLabel } from "./format";
import { displayPercent } from "./model";
import type { UsageDisplayAs } from "./preferences";
import { windowTone } from "./tone";
import type { UsageReportEntry, UsageTone } from "./types";

export interface SidebarUsageWindow {
  key: string;
  label: string;
  percent: number;
  percentText: string;
  /** "resets 2h", or null when the source sends no reset time. */
  resetText: string | null;
  tone: UsageTone;
}

export interface SidebarUsageAccount {
  key: string;
  icon: string | null;
  /** The plan ("Max"), else the source ("Claude"). */
  title: string;
  /** The account's email, when the source knows it. */
  subtitle: string | null;
  windows: SidebarUsageWindow[];
  /** Why the account has no usage to show, e.g. an expired login. Null when it has windows. */
  problem: string | null;
  /** Configured agent providers that run under this account. */
  providerIds: string[];
}

/**
 * One entry per account, each with its summary windows (Claude's session and weekly limits), or
 * with the problem that kept them from loading. Accounts that loaded without a summary window are
 * left out.
 */
export function resolveSidebarUsageAccounts(
  reports: readonly UsageReportEntry[],
  displayAs: UsageDisplayAs,
): SidebarUsageAccount[] {
  return reports.flatMap((entry): SidebarUsageAccount[] => {
    const identity = {
      key: entry.id,
      icon: entry.icon ?? null,
      subtitle: entry.account.label ?? null,
      providerIds: entry.providerIds ?? [],
    };
    if (entry.report.status !== "available") {
      const problem =
        entry.report.status === "error"
          ? entry.report.error
          : usageCopy.problem(entry.report.problem);
      return [{ ...identity, title: entry.sourceLabel, windows: [], problem }];
    }
    const windows = entry.report.windows.flatMap((window) => {
      const percent = window.summary ? displayPercent(window, displayAs) : null;
      if (percent === null) return [];
      return [
        {
          key: `${entry.id}/${window.id}`,
          label: window.label,
          percent,
          percentText: formatDisplayPct(percent, displayAs),
          resetText: formatResetLabel(window.resetsAt),
          tone: windowTone(window),
        },
      ];
    });
    if (windows.length === 0) return [];
    return [
      {
        ...identity,
        title: entry.report.planLabel ?? entry.sourceLabel,
        windows,
        problem: null,
      },
    ];
  });
}

/** "Session 31% · Weekly 10%", or the account's problem. */
export function describeAccountUsage(account: SidebarUsageAccount): string {
  return (
    account.problem ??
    account.windows.map((window) => `${window.label} ${window.percentText}`).join(" · ")
  );
}

/** Each configured provider's usage line, for providers whose account the host has found. */
export function resolveProviderUsageDescriptions(
  accounts: readonly SidebarUsageAccount[],
): Map<string, string> {
  const descriptions = new Map<string, string>();
  for (const account of accounts) {
    for (const providerId of account.providerIds) {
      descriptions.set(providerId, describeAccountUsage(account));
    }
  }
  return descriptions;
}
