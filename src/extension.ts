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

export function activate(context: vscode.ExtensionContext) {
  vscode.window.onDidChangeTextEditorSelection(
    () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      setMultiSelectionDecorations(editor);
    },
    null,
    context.subscriptions
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
      "cursor-placement.move-selection-to-occurence",
      ({ value }: { value: number }) => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
          return;
        }

        const [range] = editor.visibleRanges;

        const selection = editor.selection;
        const query = editor.document.getText(selection);

        let targetLine: number | null = null;

        for (let i = range.start.line; i < range.end.line; i++) {
          if (editor.document.lineAt(i).text.includes(query)) {
            targetLine = i;
            break;
          }
        }

        if (targetLine === null) {
          // No line found with a match - we simply drop the cursor and escape
          // vim to normal mode.

          targetLine = range.start.line + value;
          const lineContent = editor.document.lineAt(
            Math.min(targetLine, editor.document.lineCount - 1)
          ).text;

          const targetChar = lineContent
            .split("")
            .findIndex((char) => char !== " ");

          editor.selection = new vscode.Selection(
            targetLine,
            targetChar,
            targetLine,
            targetChar
          );

          setTimeout(() => {
            vscode.commands.executeCommand("extension.vim_escape");
          }, 100);

          return;
        } else {
          // drop the cursor on the next best match

          const startChar = editor.document
            .lineAt(targetLine)
            .text.indexOf(query);

          const endChar = startChar + query.length;

          editor.selection = new vscode.Selection(
            targetLine,
            startChar,
            targetLine,
            endChar
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.vim-escape-then-run",
      ({ command }: { command: string }) => {
        vscode.commands.executeCommand("extension.vim_escape");
        setTimeout(() => vscode.commands.executeCommand(command), 0);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cursor-placement.open-then-focus", () => {
      vscode.commands.executeCommand("filesExplorer.openFilePreserveFocus");
      setTimeout(
        () =>
          vscode.commands.executeCommand(
            "workbench.action.focusFirstEditorGroup"
          ),
        100
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.open-result-then-reset",
      () => {
        vscode.commands.executeCommand("search.action.openResult");
        vscode.commands.executeCommand("workbench.view.explorer");
        vscode.commands.executeCommand(
          "workbench.action.focusFirstEditorGroup"
        );
        vscode.commands.executeCommand("extension.vim_escape");
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.close-find-widget-then-reset",
      () => {
        vscode.commands.executeCommand("closeFindWidget");
        vscode.commands.executeCommand("extension.vim_escape");
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor-placement.revert-change-then-hide",
      () => {
        vscode.commands.executeCommand("git.revertSelectedRanges");
        vscode.commands.executeCommand("extension.vim_escape");
      }
    )
  );
}

export function deactivate() {}
