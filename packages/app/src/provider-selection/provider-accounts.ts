import type { AgentProvider, ProviderSnapshotEntry } from "@getpaseo/protocol/agent-types";
import { SELECTABLE_PROVIDER_STATUSES } from "./resolve-agent-form";

export interface ProviderAccountOption {
  id: AgentProvider;
  label: string;
}

function resolveRootProvider(
  provider: AgentProvider,
  entriesById: Map<AgentProvider, ProviderSnapshotEntry>,
): AgentProvider {
  let current = provider;
  for (let depth = 0; depth < entriesById.size; depth += 1) {
    const base = entriesById.get(current)?.extends;
    if (!base) {
      return current;
    }
    current = base;
  }
  return current;
}

/**
 * Providers that run the same agent as the selected one under different
 * credentials, e.g. builtin `claude` plus a custom provider that extends it with
 * its own `CLAUDE_CONFIG_DIR`. Empty unless there are at least two to switch between.
 */
export function buildProviderAccountOptions(
  entries: readonly ProviderSnapshotEntry[],
  selectedProvider: AgentProvider | null,
): ProviderAccountOption[] {
  if (!selectedProvider) {
    return [];
  }
  const entriesById = new Map(entries.map((entry) => [entry.provider, entry]));
  const selectedRoot = resolveRootProvider(selectedProvider, entriesById);
  const accounts = entries
    .filter(
      (entry) =>
        entry.enabled &&
        SELECTABLE_PROVIDER_STATUSES.has(entry.status) &&
        resolveRootProvider(entry.provider, entriesById) === selectedRoot,
    )
    .map((entry) => ({ id: entry.provider, label: entry.label ?? entry.provider }));
  return accounts.length > 1 ? accounts : [];
}
