import {
    createConnection,
    ProposedFeatures,
    TextDocuments,
    TextDocument,
    Diagnostic,
    DiagnosticSeverity,
    DidChangeConfigurationParams, 
    IConnection,
    TextDocumentChangeEvent
} from 'vscode-languageserver';
import { basename } from 'path';

import {
    ExampleConfiguration,
    Severity,
    SeverityKey,
    LintError
} from './configuration';
import * as lint from './lint.js';

let conn: IConnection = createConnection(ProposedFeatures.all);
let docs: TextDocuments = new TextDocuments();
let conf: ExampleConfiguration | undefined = undefined;

conn.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: docs.syncKind
        }
    };
});

function getSeverityKey(code: string): SeverityKey {
    return <SeverityKey>code.replace('.', '_');
}

function getSeverity(key: SeverityKey): DiagnosticSeverity | undefined {
    if (!conf || !conf.severity) {
        return;
    }

    const severity: Severity = conf.severity[key];

    switch (severity) {
        case Severity.Error:
            return DiagnosticSeverity.Error;
        case Severity.Warning:
            return DiagnosticSeverity.Warning;
        case Severity.Information:
            return DiagnosticSeverity.Information;
        case Severity.Hint:
            return DiagnosticSeverity.Hint;
        default:
            return;
    }
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    const source: string = basename(textDocument.uri);
    const json: string = textDocument.getText();
    const errors = lint(json);

    // console.log('1', errors);
    const diagnostics: Diagnostic[] = errors.map((err: LintError) => {
        const severity = getSeverity(getSeverityKey(err.code)); 
        return ({
            range: {
                start: textDocument.positionAt(err.location.start.offset),
                end: textDocument.positionAt(err.location.end.offset)
            },
            severity,
            message: err.error,
            source
        });
    });

    conn.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

async function validateAll(): Promise<void> {
    for (const document of docs.all()) {
        await validateTextDocument(document);
    }
}

docs.onDidChangeContent((change: TextDocumentChangeEvent) => {
    validateTextDocument(change.document);
});

docs.onDidClose((e: TextDocumentChangeEvent) => {
    conn.sendDiagnostics({ uri: e.document.uri, diagnostics: [] });
});

conn.onDidChangeConfiguration(({ settings }: DidChangeConfigurationParams) => {
    conf = settings.example;
    validateAll();
});

docs.listen(conn);
conn.listen();
