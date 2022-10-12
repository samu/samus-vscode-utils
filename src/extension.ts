import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const selectionDecorationType = vscode.window.createTextEditorDecorationType({
    outline: "2px solid rgba(211, 54, 130, 0.5)",
  });

  vscode.window.onDidChangeTextEditorSelection(
    (event) => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      const decorations =
        event.selections.length === 1
          ? []
          : event.selections.map((selection) => ({
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
    },
    null,
    context.subscriptions
  );

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
}

export function deactivate() {}
