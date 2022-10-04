import * as vscode from "vscode";

const lines = 15;

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "cursor-placement.move",
    () => {
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
          lineNumber: lineNumber - lines,
          at: "top",
        });
      } else {
        vscode.commands.executeCommand("cursorMove", {
          to: "viewPortTop",
          value: lines + 1,
        });
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
