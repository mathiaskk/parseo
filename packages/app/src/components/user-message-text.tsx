import { useMemo } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { isWeb } from "@/constants/platform";
import { useAgentCommandsQuery } from "@/hooks/use-agent-commands-query";
import { hasSlashToken, splitSkillMentions } from "@/utils/skill-mentions";

interface UserMessageTextProps {
  serverId?: string;
  agentId?: string;
  message: string;
  style: StyleProp<TextStyle>;
  dataSet: Record<string, string>;
}

export function UserMessageText({
  serverId,
  agentId,
  message,
  style,
  dataSet,
}: UserMessageTextProps) {
  const mayMentionSkill = useMemo(() => hasSlashToken(message), [message]);
  const { commands } = useAgentCommandsQuery({
    serverId: serverId ?? "",
    agentId: agentId ?? "",
    enabled: mayMentionSkill && !!serverId && !!agentId,
  });
  const segments = useMemo(() => {
    if (!mayMentionSkill || commands.length === 0) {
      return null;
    }
    const skillNames = new Set(
      commands.filter((command) => command.kind === "skill").map((command) => command.name),
    );
    const split = splitSkillMentions(message, skillNames);
    return split.some((segment) => segment.kind === "skill") ? split : null;
  }, [commands, mayMentionSkill, message]);

  return (
    <Text selectable style={style} dataSet={dataSet}>
      {segments
        ? segments.map((segment) =>
            segment.kind === "skill" ? (
              <Text key={segment.start} style={styles.skillPill} testID="user-message-skill-pill">
                {segment.name}
              </Text>
            ) : (
              <Text key={segment.start}>{segment.text}</Text>
            ),
          )
        : message}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  skillPill: {
    color: theme.colors.foreground,
    backgroundColor: theme.colors.surface1,
    fontSize: theme.fontSize.sm,
    ...(isWeb
      ? {
          paddingHorizontal: theme.spacing[2],
          borderRadius: theme.borderRadius.full,
          borderWidth: theme.borderWidth[1],
          borderStyle: "solid" as const,
          borderColor: theme.colors.border,
          lineHeight: Math.round(theme.fontSize.content * 1.4) - 2,
        }
      : {}),
  },
}));
