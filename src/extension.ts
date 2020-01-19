import { readFileSync } from 'fs';
import { join, resolve, basename } from 'path';
import { bemhtml } from 'bem-xjst';

import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient';

const serverBundleRelativePath = join('out', 'server.js');
const previewPath: string = resolve(__dirname, '../preview/index.html');
const previewHtml: string = readFileSync(previewPath).toString();
const template = bemhtml.compile();
const exampleEnableProperty = 'example.enable';
const PANELS: Record<string, vscode.WebviewPanel> = {};

let client: LanguageClient;

const createLanguageClient = (context: vscode.ExtensionContext): LanguageClient => {
    const serverModulePath = context.asAbsolutePath(serverBundleRelativePath);

    const serverOptions: ServerOptions = {
        run: {
            module: serverModulePath,
            transport: TransportKind.ipc
        },
        debug: {
            module: serverModulePath,
            transport: TransportKind.ipc,
            options: { execArgv: ['--inspect=6009', '--nolazy'] }
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'json' }
        ],
        synchronize: { 
            configurationSection: 'example',
            fileEvents: vscode.workspace.createFileSystemWatcher('**/package.json')
        }
    };

    const client: LanguageClient = new LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);

    return client;
};

const getPreviewKey = (doc: vscode.TextDocument): string => doc.uri.path;

const getMediaPath = (context: vscode.ExtensionContext) => vscode.Uri
    .file(context.extensionPath)
    .with({ scheme: 'vscode-resource' })
    .toString();

const initPreviewPanel = (document: vscode.TextDocument) => {
    const key = getPreviewKey(document);
    const fileName = basename(document.fileName);

    const panel = vscode.window.createWebviewPanel(
        'example.preview',
        `Preview: ${fileName}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    PANELS[key] = panel;

    panel.onDidDispose(() => {
        delete PANELS[key];
    });

    return panel;
};

const updateContent = (doc: vscode.TextDocument, context: vscode.ExtensionContext) => {
    const panel = PANELS[getPreviewKey(doc)];

    if (panel) {
        try {
            const json = doc.getText();
            const data = JSON.parse(json);
            const html = template.apply(data);


            panel.webview.html = previewHtml 
                .replace(/{{\s*(\w+)\s*}}/g, (str, key) => {
                    if (key === 'content') {
                        return html;
                    }
                    if (key === 'mediaPath') {
                        return getMediaPath(context);
                    }
                    return str;
                });
        } catch(err) {
            throw new Error(err);
        }
    }
};

const openPreview = (context: vscode.ExtensionContext) => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const document: vscode.TextDocument = editor.document;
        const panel = PANELS[getPreviewKey(document)];

        if (panel) {
            panel.reveal();
            return;
        }
        const newPanel: vscode.WebviewPanel = initPreviewPanel(document);
        updateContent(document, context);
        context.subscriptions.push(newPanel);
    }
};

const linterChecker = () => vscode.workspace.getConfiguration().get(exampleEnableProperty);

export function activate(context: vscode.ExtensionContext) {
    console.info('Congratulations, your extension is now active!');

    client = createLanguageClient(context);

    if (linterChecker()) {
        client.start();
    }

    const changeConfigListener = (e: vscode.ConfigurationChangeEvent) => {
        // Если изменения не затрагивают конфиг enable, то ничего делать не нужно
        if (!e.affectsConfiguration(exampleEnableProperty)) {
            return;
        }
        // Линтер был включен в настройках
        if (linterChecker()) {
            client.start();
            console.info('Linter is Enable');
            return;
        }
        // Линтер был выключен в настройках
        client.stop();
        console.info('Linter is Disable');
    };

    const changeConfigHandler: vscode.Disposable = vscode.workspace.onDidChangeConfiguration(changeConfigListener);
    const eventChange: vscode.Disposable = vscode.workspace.onDidChangeTextDocument(
        (e: vscode.TextDocumentChangeEvent) => updateContent(e.document, context)
    );

    const previewCommand: vscode.Disposable = vscode.commands.registerCommand('example.showPreviewToSide', () => openPreview(context));

    context.subscriptions.push(previewCommand, eventChange, changeConfigHandler);
}

export function deactivate() {
    client.stop();
}
