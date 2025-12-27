import { Loader2, CheckCircle2, FileEdit, FilePlus, Trash2, FolderTree } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: "call" | "result" | "partial-call";
  args?: Record<string, unknown>;
  result?: unknown;
}

interface ToolStatusProps {
  tool: ToolInvocation;
}

function getToolMessage(tool: ToolInvocation): { icon: React.ReactNode; message: string; isCompleted: boolean } {
  const { toolName, args, state } = tool;
  const isCompleted = state === "result";

  // str_replace_editor tool
  if (toolName === "str_replace_editor") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;
    const fileName = path ? path.split("/").pop() : "file";

    switch (command) {
      case "create":
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FilePlus className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Created ${fileName}` : `Creating ${fileName}...`,
          isCompleted,
        };
      case "str_replace":
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FileEdit className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Modified ${fileName}` : `Modifying ${fileName}...`,
          isCompleted,
        };
      case "insert":
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FileEdit className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Updated ${fileName}` : `Updating ${fileName}...`,
          isCompleted,
        };
      case "view":
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FolderTree className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Viewed ${fileName}` : `Viewing ${fileName}...`,
          isCompleted,
        };
      case "undo_edit":
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FileEdit className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Reverted changes to ${fileName}` : `Reverting changes to ${fileName}...`,
          isCompleted,
        };
      default:
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FileEdit className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Modified ${fileName}` : `Modifying ${fileName}...`,
          isCompleted,
        };
    }
  }

  // file_manager tool
  if (toolName === "file_manager") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;
    const newPath = args?.new_path as string | undefined;
    const fileName = path ? path.split("/").pop() : "file";
    const newFileName = newPath ? newPath.split("/").pop() : "";

    switch (command) {
      case "rename":
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FileEdit className="w-3 h-3 text-blue-600" />,
          message: isCompleted
            ? `Renamed ${fileName} to ${newFileName}`
            : `Renaming ${fileName} to ${newFileName}...`,
          isCompleted,
        };
      case "delete":
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Trash2 className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Deleted ${fileName}` : `Deleting ${fileName}...`,
          isCompleted,
        };
      default:
        return {
          icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FileEdit className="w-3 h-3 text-blue-600" />,
          message: isCompleted ? `Modified file` : `Modifying file...`,
          isCompleted,
        };
    }
  }

  // Default fallback for unknown tools
  return {
    icon: isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Loader2 className="w-3 h-3 animate-spin text-blue-600" />,
    message: isCompleted ? toolName : `${toolName}...`,
    isCompleted,
  };
}

export function ToolStatus({ tool }: ToolStatusProps) {
  const { icon, message, isCompleted } = getToolMessage(tool);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {!isCompleted && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
      {icon}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
