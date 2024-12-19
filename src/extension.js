const vscode = require("vscode")
const parser = require("./parser")
const signals = require("./signals")

const activate = (context) => {

    const diagnosticCollection = vscode.languages.createDiagnosticCollection("maszynaw")

    const validateDocument = (document) => {
        let errors
        if (document.languageId === "maszynaw") {
            errors = parser.analyzeDocument(document)
        }
        else if (document.languageId === "maszynaw-rozkaz") {
            // errors = signals.analyzeDocument(document)
        }
        else return

        const diagnostics = []

        errors.forEach((error) => {
            const range = new vscode.Range(
                new vscode.Position(error.line, error.charStart),
                new vscode.Position(error.line, error.charEnd)
            )
            
            const diagnostic = new vscode.Diagnostic(
                range,
                error.message,
                vscode.DiagnosticSeverity.Error
            )

            diagnostics.push(diagnostic)
        })

        diagnosticCollection.set(document.uri, diagnostics)
    }

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return

        const document = editor.document
        const changes = event.contentChanges

        if (changes.length === 0) return

        const change = changes[0]
        const position = change.range.start
        if (document.languageId === "maszynaw") {
            if (change.text === '\n') {
                const previousLine = document.lineAt(position.line);
                const previousText = previousLine.text;
    
    
                // Znajdź pierwszą instrukcję w poprzedniej linii
                const match = previousText.match(/:\s*(\b\w+\b)/); // Dopasowanie instrukcji po dwukropku
                const commentIndex = previousText.indexOf("//")
                if (match && (commentIndex === -1 || match.index < commentIndex)) {
                    const instructionStartIndex = match.index + match[0].indexOf(match[1]);
                
                    editor.edit((editBuilder) => {
                        const padding = " ".repeat(instructionStartIndex)
                        const newPosition = new vscode.Position(position.line + 1, instructionStartIndex)
                        editBuilder.insert(newPosition, padding)
                    }).then(() => {
                        const movePosition = new vscode.Position(position.line + 1, instructionStartIndex)  
                        editor.selection = new vscode.Selection(movePosition, movePosition)
                    })
                }
            }
        }
        else if (document.languageId === "maszynaw-rozkaz") {
            signals.labels.clear()
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i).text.trim()
                const at = line.indexOf("@")
                if (at === 0) {
                    const label = line.match(/@(\w+)/)
                    if (label) {
                        const match = line.match(/@\w+\s+/)
                        signals.labels.add(label[1])
                    }
                }
            }
        }
        else return
    }))

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            {"language": "maszynaw", "scheme": "file"},
            {provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position, /\b[a-zA-Z]+\b/)
                if (!range) return
        
                const word = document.getText(range).toLocaleLowerCase()
                const description = parser.validInstructions[word]?.documentation
        
                if (description) {
                    const detail = parser.validInstructions[word].detail
                    const documentation = new vscode.MarkdownString(`**${word.toLocaleUpperCase()}**: ${detail}\n\n`)
                    const descriptionLines = description.trim().split("\n")
                    descriptionLines.forEach((line) => {
                        documentation.appendText(line.trim())
                        documentation.appendMarkdown("\n")
                    })
                    return new vscode.Hover(documentation)
                }
            
                return null
            }}
        )
    )

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            {"language": "maszynaw-rozkaz", "scheme": "file"},
            {provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position, /\b[a-zA-Z]+\b/)
                if (!range) return
        
                const word = document.getText(range)
                const description = signals.validSignals[word]?.detail

                if (description) {
                    const documentation = new vscode.MarkdownString(`**${word}**: ${description}`)
                    if (signals.validSignals[word].edge_trigger) {
                        documentation.appendMarkdown("\n\nSygnał Impulsowy")
                    }
                    else documentation.appendMarkdown("\n\nSygnał Poziomowy")
                    return new vscode.Hover(documentation)
                }
            }}
        )
    )

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => validateDocument(e.document))
    )

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(validateDocument)
    )

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((document) => diagnosticCollection.delete(document.uri))
    )
    
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: "maszynaw", scheme: "file" },
            {
                provideCompletionItems(document, position) {
                    const completions = []
                    
                    
                    Object.keys(parser.validInstructions).forEach((instruction) => {
                        const completion = new vscode.CompletionItem(
                            instruction,
                            vscode.CompletionItemKind.Keyword
                        );
                        completion.detail = parser.validInstructions[instruction].detail
                        completion.documentation = new vscode.MarkdownString()
                        const unformattedDocumentation = parser.validInstructions[instruction].documentation
                        unformattedDocumentation.split("\n").forEach((line) => {
                            completion.documentation.appendText(line.trim())
                            completion.documentation.appendMarkdown("\n")
                        })
                        completion.insertText = instruction + " "
                        completions.push(completion)
                    })

                    for (let i = 0; i < document.lineCount; i++) {
                        const line = document.lineAt(i).text.trim()
                        const colon = line.indexOf(":")
                        // zabezpieczenie przed : jako znak w tekście oraz przed komentarzami
                        const singleQuote = line.indexOf("'")
                        const semicolonComment = line.indexOf(";")
                        const comment = line.indexOf("//")
                        if (colon !== -1  
                            && (singleQuote === -1 || colon < singleQuote)
                            && (semicolonComment === -1 || colon < semicolonComment)
                            && (comment === -1 || colon < comment)) {
                            const label = line.substring(0, colon)
                            const completion = new vscode.CompletionItem(
                                label,
                                vscode.CompletionItemKind.Function
                            );
                            completion.insertText = label + " "
                            completions.push(completion)
                        }
                    }
            
                    return completions
                },
            },
            "" // Wyzwala autouzupełnianie dla każdego znaku
        ),
        vscode.languages.registerCompletionItemProvider(
            {language: "maszynaw-rozkaz", scheme: "file"},
            {
                provideCompletionItems(document, position) {
                    const completions = []
                    
                    Object.keys(signals.validSignals).forEach((signal) => {
                        const completion = new vscode.CompletionItem(
                            signal,
                            vscode.CompletionItemKind.Keyword
                        )
                        completion.insertText = signal + " "
                        completion.detail = signals.validSignals[signal].detail
                        completions.push(completion)
                    })

                    signals.condtionalStatement.forEach((statement) => {
                        const completion = new vscode.CompletionItem(
                            statement,
                            vscode.CompletionItemKind.Keyword
                        )
                        completion.insertText = statement + " "
                        completions.push(completion)
                    })
                    

                    return completions
                }
            },
            ""
        ),
        vscode.languages.registerCompletionItemProvider(
            {language: "maszynaw-rozkaz", scheme: "file"},
            {
                provideCompletionItems(document, position) {
                    const completions = []
                    signals.labels.forEach((label) => {
                        const completion = new vscode.CompletionItem(
                            label,
                            vscode.CompletionItemKind.Function
                        )
                        completion.insertText = label + " "
                        completions.push(completion)
                    })

                    return completions
                }
            },
            "@"
        )
    );
};

const deactivate = () => {}

module.exports = {
    activate,
    deactivate,
};
