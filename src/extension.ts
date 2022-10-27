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

const nthLineDecorationType = vscode.window.createTextEditorDecorationType({
  gutterIconPath: getIconUri("arrow-right-short"),
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

function setNthLineDecoration(editor: vscode.TextEditor, line: number) {
  const decorations = [
    {
      range: new vscode.Range(
        new vscode.Position(line, 0),
        new vscode.Position(line, 80)
      ),
    },
    {
      range: new vscode.Range(
        new vscode.Position(line + 5, 0),
        new vscode.Position(line + 5, 80)
      ),
    },
    {
      range: new vscode.Range(
        new vscode.Position(line + 10, 0),
        new vscode.Position(line + 10, 80)
      ),
    },
  ];

  editor.setDecorations(nthLineDecorationType, decorations);
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

  vscode.window.onDidChangeActiveTextEditor(
    () => {
      withEditor((editor) => {
        setNthLineDecoration(editor, getDropLineTarget(editor));
      });
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeTextEditorVisibleRanges(
    () => {
      withEditor((editor) => {
        setNthLineDecoration(editor, getDropLineTarget(editor));
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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "samus-vscode-utils.move-selection-to-occurence",
      ({ value }: { value: number }) => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
          return;
        }

        const [range] = editor.visibleRanges;

        const targetLine = range.start.line + value;
        const lineContent = editor.document.lineAt(
          Math.min(targetLine, editor.document.lineCount - 1)
        ).text;

        const targetChar = Math.max(
          0,
          lineContent.split("").findIndex((char) => char !== " ")
        );

        editor.selection = new vscode.Selection(
          targetLine,
          targetChar,
          targetLine,
          targetChar
        );

        setTimeout(() => {
          vscode.commands.executeCommand("extension.vim_escape");
        }, 100);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "samus-vscode-utils.run-multiple",
      async ({ commands }: { commands: Array<Command> }) => {
        for (let i = 0; i < commands.length; i++) {
          const command = commands[i];

          if (command.timeout !== undefined) {
            await new Promise((resolve) =>
              setTimeout(resolve, command.timeout)
            );
          }

          vscode.commands.executeCommand(command.command, command.args);
        }
      }
    )
  );
}

type Command = {
  command: string;
  args: any;
  timeout?: number;
};

export function deactivate() {}
