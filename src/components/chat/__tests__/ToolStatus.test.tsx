import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolStatus } from "../ToolStatus";

afterEach(() => {
  cleanup();
});

describe("ToolStatus", () => {
  describe("str_replace_editor tool", () => {
    it("displays creating message when creating a file", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "create",
          path: "/components/Button.jsx",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Creating Button.jsx...")).toBeDefined();
    });

    it("displays created message when file creation is complete", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "result" as const,
        args: {
          command: "create",
          path: "/components/Button.jsx",
        },
        result: "File created successfully",
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Created Button.jsx")).toBeDefined();
    });

    it("displays modifying message when replacing string in file", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "str_replace",
          path: "/App.jsx",
          old_str: "Hello",
          new_str: "Hi",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Modifying App.jsx...")).toBeDefined();
    });

    it("displays modified message when string replacement is complete", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "result" as const,
        args: {
          command: "str_replace",
          path: "/App.jsx",
        },
        result: "String replaced successfully",
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Modified App.jsx")).toBeDefined();
    });

    it("displays updating message when inserting into file", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "insert",
          path: "/utils/helpers.js",
          insert_line: 10,
          new_str: "console.log('debug');",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Updating helpers.js...")).toBeDefined();
    });

    it("displays updated message when insert is complete", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "result" as const,
        args: {
          command: "insert",
          path: "/utils/helpers.js",
        },
        result: "Content inserted successfully",
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Updated helpers.js")).toBeDefined();
    });

    it("displays viewing message when viewing a file", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "view",
          path: "/config.json",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Viewing config.json...")).toBeDefined();
    });

    it("displays viewed message when view is complete", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "result" as const,
        args: {
          command: "view",
          path: "/config.json",
        },
        result: "File content...",
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Viewed config.json")).toBeDefined();
    });

    it("displays reverting message when undoing edit", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "undo_edit",
          path: "/styles.css",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Reverting changes to styles.css...")).toBeDefined();
    });

    it("displays reverted message when undo is complete", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "result" as const,
        args: {
          command: "undo_edit",
          path: "/styles.css",
        },
        result: "Changes reverted",
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Reverted changes to styles.css")).toBeDefined();
    });

    it("extracts filename from nested path", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "create",
          path: "/src/components/ui/Button.jsx",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Creating Button.jsx...")).toBeDefined();
    });

    it("handles missing command gracefully with default message", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          path: "/test.js",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Modifying test.js...")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    it("displays renaming message when renaming a file", () => {
      const tool = {
        toolName: "file_manager",
        state: "call" as const,
        args: {
          command: "rename",
          path: "/old-name.js",
          new_path: "/new-name.js",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Renaming old-name.js to new-name.js...")).toBeDefined();
    });

    it("displays renamed message when rename is complete", () => {
      const tool = {
        toolName: "file_manager",
        state: "result" as const,
        args: {
          command: "rename",
          path: "/old-name.js",
          new_path: "/new-name.js",
        },
        result: { success: true, message: "Successfully renamed" },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Renamed old-name.js to new-name.js")).toBeDefined();
    });

    it("displays deleting message when deleting a file", () => {
      const tool = {
        toolName: "file_manager",
        state: "call" as const,
        args: {
          command: "delete",
          path: "/temp.txt",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Deleting temp.txt...")).toBeDefined();
    });

    it("displays deleted message when delete is complete", () => {
      const tool = {
        toolName: "file_manager",
        state: "result" as const,
        args: {
          command: "delete",
          path: "/temp.txt",
        },
        result: { success: true, message: "Successfully deleted" },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Deleted temp.txt")).toBeDefined();
    });

    it("handles missing command gracefully", () => {
      const tool = {
        toolName: "file_manager",
        state: "call" as const,
        args: {
          path: "/test.js",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Modifying file...")).toBeDefined();
    });
  });

  describe("unknown tools", () => {
    it("displays tool name for unknown tool in progress", () => {
      const tool = {
        toolName: "unknown_tool",
        state: "call" as const,
        args: {},
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("unknown_tool...")).toBeDefined();
    });

    it("displays tool name for unknown tool when complete", () => {
      const tool = {
        toolName: "unknown_tool",
        state: "result" as const,
        args: {},
        result: "Done",
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("unknown_tool")).toBeDefined();
    });
  });

  describe("visual indicators", () => {
    it("shows spinner when tool is in progress", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "create",
          path: "/test.js",
        },
      };

      const { container } = render(<ToolStatus tool={tool} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });

    it("does not show spinner when tool is complete", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "result" as const,
        args: {
          command: "create",
          path: "/test.js",
        },
        result: "Success",
      };

      const { container } = render(<ToolStatus tool={tool} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles missing path with fallback filename", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "create",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Creating file...")).toBeDefined();
    });

    it("handles empty path with fallback filename", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "call" as const,
        args: {
          command: "create",
          path: "",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Creating file...")).toBeDefined();
    });

    it("handles partial-call state", () => {
      const tool = {
        toolName: "str_replace_editor",
        state: "partial-call" as const,
        args: {
          command: "create",
          path: "/test.js",
        },
      };

      render(<ToolStatus tool={tool} />);
      expect(screen.getByText("Creating test.js...")).toBeDefined();
    });
  });
});
