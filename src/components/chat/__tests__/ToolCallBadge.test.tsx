import { describe, test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// ─── Pure function tests ────────────────────────────────────────────────────

describe("getToolCallLabel", () => {
  describe("str_replace_editor — create", () => {
    test("in progress", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "create", path: "/components/Card.jsx" },
          false
        )
      ).toBe("Creating Card.jsx");
    });

    test("done", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "create", path: "/components/Card.jsx" },
          true
        )
      ).toBe("Created Card.jsx");
    });

    test("uses only the basename from a deep path", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "create", path: "/src/components/ui/Button.tsx" },
          false
        )
      ).toBe("Creating Button.tsx");
    });

    test("handles root-level files", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "create", path: "/App.jsx" },
          false
        )
      ).toBe("Creating App.jsx");
    });
  });

  describe("str_replace_editor — str_replace", () => {
    test("in progress", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "str_replace", path: "/App.jsx" },
          false
        )
      ).toBe("Editing App.jsx");
    });

    test("done", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "str_replace", path: "/App.jsx" },
          true
        )
      ).toBe("Edited App.jsx");
    });
  });

  describe("str_replace_editor — insert", () => {
    test("in progress shows same label as str_replace", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "insert", path: "/App.jsx" },
          false
        )
      ).toBe("Editing App.jsx");
    });

    test("done shows same label as str_replace", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "insert", path: "/App.jsx" },
          true
        )
      ).toBe("Edited App.jsx");
    });
  });

  describe("str_replace_editor — view", () => {
    test("in progress", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "view", path: "/components/Button.tsx" },
          false
        )
      ).toBe("Reading Button.tsx");
    });

    test("done", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "view", path: "/components/Button.tsx" },
          true
        )
      ).toBe("Read Button.tsx");
    });
  });

  describe("str_replace_editor — undo_edit", () => {
    test("in progress", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "undo_edit", path: "/App.jsx" },
          false
        )
      ).toBe("Reverting App.jsx");
    });

    test("done", () => {
      expect(
        getToolCallLabel(
          "str_replace_editor",
          { command: "undo_edit", path: "/App.jsx" },
          true
        )
      ).toBe("Reverted App.jsx");
    });
  });

  describe("str_replace_editor — missing path", () => {
    test("omits filename gracefully when path is absent", () => {
      expect(
        getToolCallLabel("str_replace_editor", { command: "create" }, false)
      ).toBe("Creating");
    });
  });

  describe("file_manager — rename", () => {
    test("in progress shows old filename only", () => {
      expect(
        getToolCallLabel(
          "file_manager",
          { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
          false
        )
      ).toBe("Renaming old.jsx");
    });

    test("done shows old → new filename", () => {
      expect(
        getToolCallLabel(
          "file_manager",
          {
            command: "rename",
            path: "/old.jsx",
            new_path: "/components/new.jsx",
          },
          true
        )
      ).toBe("Renamed old.jsx → new.jsx");
    });
  });

  describe("file_manager — delete", () => {
    test("in progress", () => {
      expect(
        getToolCallLabel(
          "file_manager",
          { command: "delete", path: "/temp.jsx" },
          false
        )
      ).toBe("Deleting temp.jsx");
    });

    test("done", () => {
      expect(
        getToolCallLabel(
          "file_manager",
          { command: "delete", path: "/temp.jsx" },
          true
        )
      ).toBe("Deleted temp.jsx");
    });
  });

  describe("unknown tool", () => {
    test("falls back to the raw tool name", () => {
      expect(getToolCallLabel("my_custom_tool", {}, false)).toBe(
        "my_custom_tool"
      );
      expect(getToolCallLabel("my_custom_tool", {}, true)).toBe(
        "my_custom_tool"
      );
    });
  });
});

// ─── Component tests ────────────────────────────────────────────────────────

describe("ToolCallBadge", () => {
  test("shows in-progress label and spinner when state is 'input-available'", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        toolInvocation={{
          state: "input-available",
          toolCallId: "1",
          input: { command: "create", path: "/App.jsx" },
        } as any}
      />
    );
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
    expect(screen.getByTestId("loading-indicator")).toBeDefined();
    expect(screen.queryByTestId("done-indicator")).toBeNull();
  });

  test("shows in-progress label and spinner when state is 'input-streaming'", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        toolInvocation={{
          state: "input-streaming",
          toolCallId: "1",
          input: { command: "create", path: "/App.jsx" },
        } as any}
      />
    );
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
    expect(screen.getByTestId("loading-indicator")).toBeDefined();
  });

  test("shows done label and green dot when state is 'output-available'", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        toolInvocation={{
          state: "output-available",
          toolCallId: "1",
          input: { command: "create", path: "/App.jsx" },
          output: "File created",
        } as any}
      />
    );
    expect(screen.getByText("Created App.jsx")).toBeDefined();
    expect(screen.getByTestId("done-indicator")).toBeDefined();
    expect(screen.queryByTestId("loading-indicator")).toBeNull();
  });

  test("renders str_replace correctly when done", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        toolInvocation={{
          state: "output-available",
          toolCallId: "2",
          input: { command: "str_replace", path: "/components/Card.jsx" },
          output: "OK",
        } as any}
      />
    );
    expect(screen.getByText("Edited Card.jsx")).toBeDefined();
  });

  test("renders file_manager delete correctly when done", () => {
    render(
      <ToolCallBadge
        toolName="file_manager"
        toolInvocation={{
          state: "output-available",
          toolCallId: "3",
          input: { command: "delete", path: "/old.jsx" },
          output: { success: true },
        } as any}
      />
    );
    expect(screen.getByText("Deleted old.jsx")).toBeDefined();
  });

  test("renders file_manager rename correctly when done", () => {
    render(
      <ToolCallBadge
        toolName="file_manager"
        toolInvocation={{
          state: "output-available",
          toolCallId: "4",
          input: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
          output: { success: true },
        } as any}
      />
    );
    expect(screen.getByText("Renamed old.jsx → new.jsx")).toBeDefined();
  });

  test("renders file_manager rename in progress", () => {
    render(
      <ToolCallBadge
        toolName="file_manager"
        toolInvocation={{
          state: "input-available",
          toolCallId: "5",
          input: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        } as any}
      />
    );
    expect(screen.getByText("Renaming old.jsx")).toBeDefined();
    expect(screen.getByTestId("loading-indicator")).toBeDefined();
  });
});
