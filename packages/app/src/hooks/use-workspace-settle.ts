import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/contexts/toast-context";
import { useHostFeature } from "@/runtime/host-features";
import { getHostRuntimeStore } from "@/runtime/host-runtime";
import { useWorkspaceFields } from "@/stores/session-store-hooks";

export interface WorkspaceSettleController {
  isSettled: boolean;
  /** Undefined when the host predates settling, so the menu hides the action. */
  toggleSettle: (() => void) | undefined;
}

export function useWorkspaceSettle({
  serverId,
  workspaceId,
}: {
  serverId: string;
  workspaceId: string;
}): WorkspaceSettleController {
  const { t } = useTranslation();
  const toast = useToast();
  const supportsSettling = useHostFeature(serverId, "workspaceSettling");
  const settledAt = useWorkspaceFields(serverId, workspaceId, (workspace) => workspace.settledAt);
  const isSettled = settledAt != null;

  const { mutate, isPending } = useMutation({
    mutationFn: async (settled: boolean) => {
      const client = getHostRuntimeStore().getClient(serverId);
      if (!client) {
        throw new Error(t("sidebar.workspace.toasts.hostDisconnected"));
      }
      await client.setWorkspaceSettled(workspaceId, settled);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("sidebar.workspace.toasts.hostDisconnected"),
      );
    },
  });

  const toggle = useCallback(() => {
    if (isPending) {
      return;
    }
    mutate(!isSettled);
  }, [isPending, isSettled, mutate]);

  return useMemo(
    () => ({ isSettled, toggleSettle: supportsSettling ? toggle : undefined }),
    [isSettled, supportsSettling, toggle],
  );
}
