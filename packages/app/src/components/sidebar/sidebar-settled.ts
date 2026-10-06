import type {
  SidebarProjectEntry,
  SidebarWorkspaceEntry,
  SidebarWorkspacePlacement,
} from "@/hooks/use-sidebar-workspaces-list";

export function collectSettledAtByKey(
  entries: Iterable<SidebarWorkspaceEntry>,
): ReadonlyMap<string, string> {
  const settledAtByKey = new Map<string, string>();
  for (const entry of entries) {
    if (entry.settledAt) {
      settledAtByKey.set(entry.workspaceKey, entry.settledAt);
    }
  }
  return settledAtByKey;
}

function byMostRecentlySettled(settledAtByKey: ReadonlyMap<string, string>) {
  return (a: SidebarWorkspacePlacement, b: SidebarWorkspacePlacement) =>
    (settledAtByKey.get(b.workspaceKey) ?? "").localeCompare(
      settledAtByKey.get(a.workspaceKey) ?? "",
    );
}

/** Moves each project's settled rows out of `workspaces` and into `settledWorkspaces`. */
export function splitSettledProjects(
  projects: SidebarProjectEntry[],
  settledAtByKey: ReadonlyMap<string, string>,
): SidebarProjectEntry[] {
  if (settledAtByKey.size === 0) {
    return projects;
  }
  return projects.map((project) => {
    const settledWorkspaces = project.workspaces.filter((workspace) =>
      settledAtByKey.has(workspace.workspaceKey),
    );
    if (settledWorkspaces.length === 0) {
      return project;
    }
    return {
      ...project,
      workspaces: project.workspaces.filter(
        (workspace) => !settledAtByKey.has(workspace.workspaceKey),
      ),
      settledWorkspaces: settledWorkspaces.sort(byMostRecentlySettled(settledAtByKey)),
    };
  });
}

export function splitSettledWorkspaces(
  workspaces: SidebarWorkspaceEntry[],
  settledAtByKey: ReadonlyMap<string, string>,
): { active: SidebarWorkspaceEntry[]; settled: SidebarWorkspaceEntry[] } {
  const active: SidebarWorkspaceEntry[] = [];
  const settled: SidebarWorkspaceEntry[] = [];
  for (const workspace of workspaces) {
    (settledAtByKey.has(workspace.workspaceKey) ? settled : active).push(workspace);
  }
  settled.sort(byMostRecentlySettled(settledAtByKey));
  return { active, settled };
}
