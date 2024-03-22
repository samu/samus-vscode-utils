import * as path from "path";
import * as vscode from "vscode";

function getIconUri(iconName: string): vscode.Uri {
  return vscode.Uri.file(
    path.join(path.dirname(__dirname), "resources", "icons", `${iconName}.svg`)
  );
}

const selectionDecorationType = vscode.window.createTextEditorDecorationType({
  gutterIconPath: getIconUri("patch-exclamation"),
  gutterIconSize: "66%",
});

const DROP_LINE_TARGET = 15;

function setMultiSelectionDecorations(editor: vscode.TextEditor) {
  const decorations =
    editor.selections.length === 1
      ? []
      : editor.selections.map((selection) => ({
          range: new vscode.Range(
            selection.start,
            new vscode.Position(
              selection.end.line,
              selection.start.character === selection.end.character
                ? selection.end.character + 1
                : selection.end.character
            )
          ),
        }));

  editor.setDecorations(selectionDecorationType, decorations);
}

function getDropLineTarget(editor: vscode.TextEditor) {
  return editor.visibleRanges[0].start.line + DROP_LINE_TARGET;
}

function evaluateIsOnDropLine(editor: vscode.TextEditor) {
  vscode.commands.executeCommand(
    "setContext",
    "samusVscodeUtils.isOnDropLine",
    editor.selection.start.line === getDropLineTarget(editor)
  );
}

function withEditor(cb: (editor: vscode.TextEditor) => void) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  cb(editor);
}

export function activate(context: vscode.ExtensionContext) {
  vscode.window.onDidChangeTextEditorSelection(
    () => {
      withEditor((editor) => {
        setMultiSelectionDecorations(editor);
        evaluateIsOnDropLine(editor);
      });
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeTextEditorVisibleRanges(
    () => {
      withEditor((editor) => {
        evaluateIsOnDropLine(editor);
      });
    },
    null,
    context.subscriptions
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "samus-vscode-utils.pull-up",
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
      "samus-vscode-utils.pull-down",
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
}

export function deactivate() {}
