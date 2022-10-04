import * as vscode from "vscode";

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
          lineNumber,
          at: "center",
        });
      } else {
        vscode.commands.executeCommand("cursorMove", {
          to: "viewPortCenter",
        });
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
