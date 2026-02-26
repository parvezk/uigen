"use client";

import { Loader2 } from "lucide-react";
import type { UIToolInvocation } from "ai";

function basename(path?: string): string {
  if (!path) return "";
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function getToolCallLabel(
  toolName: string,
  args: Record<string, any>,
  isDone: boolean
): string {
  if (toolName === "str_replace_editor") {
    const file = basename(args.path);
    const suffix = file ? ` ${file}` : "";

    switch (args.command) {
      case "create":
        return isDone ? `Created${suffix}` : `Creating${suffix}`;
      case "str_replace":
      case "insert":
        return isDone ? `Edited${suffix}` : `Editing${suffix}`;
      case "view":
        return isDone ? `Read${suffix}` : `Reading${suffix}`;
      case "undo_edit":
        return isDone ? `Reverted${suffix}` : `Reverting${suffix}`;
      default:
        return isDone ? `Processed${suffix}` : `Processing${suffix}`;
    }
  }

  if (toolName === "file_manager") {
    const file = basename(args.path);
    const newFile = basename(args.new_path);

    switch (args.command) {
      case "rename":
        return isDone
          ? `Renamed ${file} → ${newFile}`
          : `Renaming ${file}`;
      case "delete":
        return isDone ? `Deleted ${file}` : `Deleting ${file}`;
      default: {
        const suffix = file ? ` ${file}` : "";
        return isDone ? `Processed${suffix}` : `Processing${suffix}`;
      }
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolName: string;
  toolInvocation: UIToolInvocation<any>;
}

export function ToolCallBadge({ toolName, toolInvocation }: ToolCallBadgeProps) {
  const isDone = toolInvocation.state === "output-available";
  const label = getToolCallLabel(
    toolName,
    (toolInvocation.input as Record<string, any>) ?? {},
    isDone
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div
          className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"
          data-testid="done-indicator"
        />
      ) : (
        <Loader2
          className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0"
          data-testid="loading-indicator"
        />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
