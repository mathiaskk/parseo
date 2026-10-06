import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View, type PressableStateCallbackType } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { builtinSidebarNavLabelKey } from "@/sidebar-nav/model";
import { buildUsageRoute } from "@/utils/host-routes";
import { useUsagePreferences } from "./display";
import { useUsageHostId } from "./hosts";
import { UsageMeter } from "./meter";
import { useUsageHostReports } from "./queries";
import {
  resolveProviderUsageDescriptions,
  resolveSidebarUsageAccounts,
  type SidebarUsageAccount,
  type SidebarUsageWindow,
} from "./sidebar-card-model";
import { UsageSourceIcon } from "./source-icon";

function cardStyle({ hovered }: PressableStateCallbackType & { hovered?: boolean }) {
  return hovered ? [styles.card, styles.cardHovered] : styles.card;
}

/** Each configured provider's usage line on the given host, e.g. "Session 31% · Weekly 10%". */
export function useProviderUsageDescriptions(serverId: string | null): Map<string, string> {
  const { preferences } = useUsagePreferences();
  const reports = useUsageHostReports(serverId);
  return useMemo(
    () =>
      resolveProviderUsageDescriptions(resolveSidebarUsageAccounts(reports, preferences.displayAs)),
    [preferences.displayAs, reports],
  );
}

/**
 * Every account's session and weekly limits in one card above the workspaces, so several
 * subscriptions can be compared at a glance. Renders nothing until an account has data.
 */
export function SidebarUsageCard({ onBeforeOpen }: { onBeforeOpen?: () => void } = {}) {
  const { t } = useTranslation();
  const { preferences } = useUsagePreferences();
  const reports = useUsageHostReports(useUsageHostId());
  const accounts = useMemo(
    () => resolveSidebarUsageAccounts(reports, preferences.displayAs),
    [preferences.displayAs, reports],
  );
  const openUsage = useCallback(() => {
    onBeforeOpen?.();
    router.push(buildUsageRoute());
  }, [onBeforeOpen]);
  if (accounts.length === 0) return null;
  return (
    <View style={styles.container}>
      <Pressable
        onPress={openUsage}
        accessibilityRole="button"
        accessibilityLabel={t(builtinSidebarNavLabelKey("usage"))}
        style={cardStyle}
        testID="sidebar-usage-card"
      >
        {accounts.map((account, index) => (
          <AccountRow key={account.key} account={account} first={index === 0} />
        ))}
      </Pressable>
    </View>
  );
}

function AccountRow({ account, first }: { account: SidebarUsageAccount; first: boolean }) {
  return (
    <View style={first ? styles.row : [styles.row, styles.rowBorder]}>
      <View style={styles.header}>
        <UsageSourceIcon svg={account.icon} size={14} />
        <Text style={styles.title} numberOfLines={1}>
          {account.title}
        </Text>
        {account.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="middle">
            {account.subtitle}
          </Text>
        ) : null}
      </View>
      {account.problem ? (
        <Text style={styles.problem} numberOfLines={2}>
          {account.problem}
        </Text>
      ) : null}
      {account.windows.map((window) => (
        <WindowLine key={window.key} window={window} />
      ))}
    </View>
  );
}

function WindowLine({ window }: { window: SidebarUsageWindow }) {
  return (
    <View style={styles.window}>
      <View style={styles.windowText}>
        <Text style={styles.windowLabel} numberOfLines={1}>
          {window.label}
        </Text>
        <Text style={styles.percent} numberOfLines={1}>
          {window.percentText}
          {window.resetText ? <Text style={styles.reset}>{` · ${window.resetText}`}</Text> : null}
        </Text>
      </View>
      <UsageMeter percent={window.percent} tone={window.tone} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.spacing[2],
    paddingTop: theme.spacing[2],
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  cardHovered: {
    backgroundColor: theme.colors.surfaceSidebarHover,
  },
  row: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    gap: theme.spacing[1.5],
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1.5],
    minWidth: 0,
  },
  title: {
    flexShrink: 0,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  subtitle: {
    flexShrink: 1,
    minWidth: 0,
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  window: {
    gap: theme.spacing[1],
  },
  windowText: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: theme.spacing[2],
  },
  windowLabel: {
    flexShrink: 0,
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  percent: {
    flexShrink: 1,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontVariant: ["tabular-nums"],
  },
  reset: {
    color: theme.colors.foregroundMuted,
  },
  problem: {
    color: theme.colors.palette.red[300],
    fontSize: theme.fontSize.sm,
  },
}));
