import {
    createConnection,
    ProposedFeatures,
    TextDocuments,
    InitializeParams,
    TextDocument,
    Diagnostic,
    DiagnosticSeverity,
    DidChangeConfigurationParams
} from 'vscode-languageserver';

import { basename } from 'path';

import * as jsonToAst from "json-to-ast";

import { ExampleConfiguration, Severity, SeverityKey } from './configuration';
import { makeLint, LinterProblem } from './linter';
import * as lint from './lint.js';
import { getServers } from 'dns';

let conn = createConnection(ProposedFeatures.all);
let docs = new TextDocuments();
let conf: ExampleConfiguration | undefined = undefined;

conn.onInitialize((params: InitializeParams) => {
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
        return undefined;
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
            return undefined;
    }
}

// function GetMessage(key: RuleKeys): string {
//     if (key === RuleKeys.BlockNameIsRequired) {
//         return 'Field named \'block\' is required!';
//     }

//     if (key === RuleKeys.UppercaseNamesIsForbidden) {
//         return 'Uppercase properties are forbidden!';
//     }

//     return `Unknown problem type '${key}'`;
// }

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    const source = basename(textDocument.uri);
    const json = textDocument.getText();
    const errors = lint(json);

    type LintLocationPosition = { offset: number };

    type LintError = {
        code: string,
        location: {
            start: LintLocationPosition,
            end: LintLocationPosition
        },
        error: string
    };

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
    console.log('2', diagnostics);
    // const validateObject = (
    //     obj: jsonToAst.AstObject
    // ): LinterProblem<RuleKeys>[] => {
    //     const blockFields = ['content', 'mods', 'elem', 'mods'];
    //     const isBlockObject = obj.children.some(p => blockFields.includes(p.key.value.toLowerCase()));
    //     return !isBlockObject || obj.children.some(p => p.key.value.toLowerCase() === 'block')
    //         ? []
    //         : [{ key: RuleKeys.BlockNameIsRequired, loc: obj.loc }];
    // }

    // const validateProperty = (
    //     property: jsonToAst.AstProperty
    // ): LinterProblem<RuleKeys>[] =>
    //     /^[A-Z]+$/.test(property.key.value)
    //         ? [
    //               {
    //                   key: RuleKeys.UppercaseNamesIsForbidden,
    //                   loc: property.key.loc
    //               }
    //           ]
    //         : [];

    // const diagnostics: Diagnostic[] = makeLint(
    //     json,
    //     validateProperty,
    //     validateObject
    // ).reduce(
    //     (
    //         list: Diagnostic[],
    //         problem: LinterProblem<RuleKeys>
    //     ): Diagnostic[] => {
    //         const severity = GetSeverity(problem.key);

    //         if (severity) {
    //             const message = GetMessage(problem.key);

    //             let diagnostic: Diagnostic = {
    //                 range: {
    //                     start: textDocument.positionAt(
    //                         problem.loc.start.offset
    //                     ),
    //                     end: textDocument.positionAt(problem.loc.end.offset)
    //                 },
    //                 severity,
    //                 message,
    //                 source
    //             };

    //             list.push(diagnostic);
    //         }

    //         return list;
    //     },
    //     []
    // );

    conn.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

async function validateAll() {
    for (const document of docs.all()) {
        await validateTextDocument(document);
    }
}

docs.onDidChangeContent(change => {
    validateTextDocument(change.document);
});

docs.onDidClose((e) => {
    conn.sendDiagnostics({ uri: e.document.uri, diagnostics: [] });
});

conn.onDidChangeConfiguration(({ settings }: DidChangeConfigurationParams) => {
    conf = settings.example;
    validateAll();
});

docs.listen(conn);
conn.listen();
