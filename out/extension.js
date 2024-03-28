"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const paths_to_exclude = [
    "node_modules",
    "vendor",
    ".git",
    ".vscode",
    ".idea",
    "__pycache__",
    ".pytest_cache",
    ".gitignore",
    ".gitattributes",
    ".gitmodules",
    ".gitkeep",
    ".gitlab-ci.yml",
    ".gitlab-ci.yml.example",
    ".gitlab-ci.yml.sample",
];
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
async function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('gospace.generate-workspace', async () => {
        // get the current opened folders in the workspace
        const folders = vscode.workspace.workspaceFolders;
        if (folders === undefined || folders.length === 0) {
            vscode.window.showInformationMessage('No folder or workspace opened');
            return;
        }
        var roots = new Set();
        var workspaceUri = vscode.workspace.workspaceFile;
        var workspaceContent = new Uint8Array();
        var workspaceJson = {
            "folders": [],
        };
        if (workspaceUri !== undefined) {
            try {
                workspaceContent = await vscode.workspace.fs.readFile(workspaceUri);
                workspaceJson = JSON.parse(workspaceContent.toString());
            }
            catch (error) {
                console.error("Error reading workspace file", error);
            }
        }
        for (let i = 0; i < workspaceJson.folders.length; i++) {
            const folder = workspaceJson.folders[i];
            roots.add(folder.path);
        }
        for (let i = 0; i < folders.length; i++) {
            // list all files in the first folder
            const folder = folders[i];
            if (roots.has(folder.uri.fsPath)) {
                continue;
            }
            const files = await vscode.workspace.fs.readDirectory(folder.uri);
            var current_roots = [];
            current_roots = await searchGolangRoots(folder.uri, files);
            if (current_roots.length === 0) {
                vscode.window.showInformationMessage('No golang project found');
                return;
            }
            current_roots.forEach((root) => {
                if (!roots.has(root)) {
                    roots.add(root);
                    workspaceJson.folders.push({ "path": root, "name": root.split("/").pop() });
                }
            });
        }
        const workspacePath = vscode.Uri.joinPath(folders[0].uri, "workspace.code-workspace").fsPath;
        workspaceUri = vscode.Uri.file(workspacePath);
        var workspaceUintContent = stringToUint8Array(JSON.stringify(workspaceJson, null, 4));
        await vscode.workspace.fs.writeFile(workspaceUri, workspaceUintContent);
        // Prompt the user to open the new workspace
        const open = await vscode.window.showInformationMessage('Workspace file created. Do you want to open it?', 'Yes', 'No');
        if (open === 'Yes') {
            await vscode.commands.executeCommand('vscode.open', workspaceUri);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
async function searchGolangRoots(basepath, files) {
    // for (let i = 0; i < paths_to_exclude.length; i++) {
    // 	if (basepath.fsPath.includes(paths_to_exclude[i])) {
    // 		return [];
    // 	}
    // }
    var roots = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (file[1] === vscode.FileType.File) {
            if (file[0] === "go.mod" || file[0] === "main.go") {
                roots.push(basepath.fsPath);
                break;
            }
        }
        else if (file[1] === vscode.FileType.Directory) {
            const newBase = vscode.Uri.joinPath(basepath, file[0]);
            const files = vscode.workspace.fs.readDirectory(newBase);
            let f = await files;
            roots = roots.concat(await searchGolangRoots(newBase, f));
        }
    }
    return roots;
}
const stringToUint8Array = (str) => {
    const utf8 = decodeURIComponent(encodeURIComponent(str));
    const uint8Array = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) {
        uint8Array[i] = utf8.charCodeAt(i);
    }
    return uint8Array;
};
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map