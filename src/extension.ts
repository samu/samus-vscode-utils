import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.smart-move",
      ({ value }: { value: number }) => {
        const lineNumber = vscode.window.activeTextEditor?.selection.start.line;

        const [range] = vscode.window.activeTextEditor?.visibleRanges ?? [];

        if (!range || lineNumber === undefined) {
          return;
        }

        const startLine = range.start.line;
        const endLine = range.end.line;

        const isInRange = startLine <= lineNumber && lineNumber <= endLine;

        if (isInRange) {
          vscode.commands.executeCommand("revealLine", {
            lineNumber: lineNumber - value,
            at: "top",
          });
        } else {
          vscode.commands.executeCommand("cursorMove", {
            to: "viewPortTop",
            value: value + 1,
          });
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.pull-up",
      ({ value }: { value: number }) => {
        const lineNumber = vscode.window.activeTextEditor?.selection.start.line;

        if (!lineNumber) {
          return;
        }

        vscode.commands.executeCommand("revealLine", {
          lineNumber: lineNumber - value,
          at: "top",
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.pull-down",
      ({ value }: { value: number }) => {
        const lineNumber = vscode.window.activeTextEditor?.selection.end.line;

        if (!lineNumber) {
          return;
        }

        vscode.commands.executeCommand("revealLine", {
          lineNumber: lineNumber + value,
          at: "bottom",
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.move-down-and-scroll",
      ({ value }: { value: number }) => {
        vscode.commands.executeCommand("cursorMove", {
          to: "down",
          by: "line",
          value,
        });

        vscode.commands.executeCommand("editorScroll", {
          to: "down",
          by: "line",
          value,
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.move-up-and-scroll",
      ({ value }: { value: number }) => {
        vscode.commands.executeCommand("cursorMove", {
          to: "up",
          by: "line",
          value,
        });

        vscode.commands.executeCommand("editorScroll", {
          to: "up",
          by: "line",
          value,
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.escape-cursorMove",
      ({ value }: { value: number }) => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
          return;
        }

        const [range] = editor.visibleRanges;

        const targetLine = range.start.line + value;

        vscode.commands.executeCommand("extension.vim_escape");

        setTimeout(() => {
          vscode.commands.executeCommand("revealLine", {
            lineNumber: targetLine - value,
            at: "top",
          });

          setTimeout(() => {
            vscode.commands.executeCommand("cursorMove", {
              to: "viewPortTop",
              by: "line",
              value,
            });
          }, 100);
        }, 0);
      }
    )
  );
}

export function deactivate() {}
