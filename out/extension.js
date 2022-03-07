'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUpperCase = exports.replaceAll = exports.getResultforTable = exports.getResultforAlias = exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// The module 'azdata' contains the Azure Data Studio extensibility API
// This is a complementary set of APIs that add SQL / Data-specific functionality to the app
// Import the module and reference it with the alias azdata in your code below
const azdata = require("azdata");
const sql = require('mssql');
let selectedText;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "sql-alias" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('sql-alias.searchQueryOrAlias', () => {
        // The code you place here will be executed every time your command is executed
        const editor = vscode.window.activeTextEditor;
        selectedText = editor === null || editor === void 0 ? void 0 : editor.document.getText(editor.selection);
        if (selectedText === undefined) {
            vscode.env.clipboard.readText().then((clipboard_content) => { selectedText = clipboard_content; });
        }
        azdata.connection.getCurrentConnection().then(connection => {
            if (connection === undefined) {
                vscode.window.showInformationMessage('Connection Not Found, you have to connect first');
                return;
            }
            azdata.connection.getCredentials(connection.connectionId).then(credentials => {
                const sqlConfig = {
                    user: connection.userName,
                    password: credentials.password,
                    database: connection.databaseName,
                    server: connection.serverName,
                    pool: {
                        max: 1,
                        min: 0,
                        idleTimeoutMillis: 30000
                    },
                    options: {
                        encrypt: false,
                        trustServerCertificate: false // change to true for local dev / self-signed certs
                    }
                };
                const rex = new RegExp('[A-Z1-9&]{3,7}', 'g');
                if (selectedText.match(rex) && isUpperCase(selectedText)) {
                    getResultforAlias(sqlConfig);
                }
                else {
                    getResultforTable(sqlConfig);
                }
            });
        });
        // Display a message box to the user
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
function getResultforAlias(sqlConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // make sure that any items are correctly URL encoded in the connection string
            yield sql.connect(sqlConfig);
            const result = yield sql.query(`SELECT name, base_object_name from sys.synonyms WHERE name = '${selectedText}'`);
            console.log(result.recordset[0]);
            const ResultBlock = result.recordset[0].base_object_name.split('.');
            const Schema = replaceAll(ResultBlock[0], [{ find: '\\[', replace: '' }, { find: '\\]', replace: '' }]);
            const Table = replaceAll(ResultBlock[1], [{ find: '\\[', replace: '' }, { find: '\\]', replace: '' }]);
            vscode.window.showInformationMessage('Found Table for ' + result.recordset[0].name + ': TableName -> ' + Table + ', Schema -> ' + Schema);
            vscode.env.clipboard.writeText(Schema + '.' + Table);
        }
        catch (err) {
            vscode.window.showInformationMessage('Error');
            console.log(err);
        }
        sql.close();
    });
}
exports.getResultforAlias = getResultforAlias;
;
function getResultforTable(sqlConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // make sure that any items are correctly URL encoded in the connection string
            yield sql.connect(sqlConfig);
            const result = yield sql.query(`SELECT name, base_object_name from sys.synonyms WHERE base_object_name like '%\\[${selectedText}\\]%' ESCAPE '\\'`);
            // console.log(`SELECT name, base_object_name from sys.synonyms WHERE base_object_name like '%\\[${selectedText}\\]%' ESCAPE '\\'`);
            console.log(result.recordset[0]);
            const ResultBlock = result.recordset[0].base_object_name.split('.');
            const Schema = replaceAll(ResultBlock[0], [{ find: '\\[', replace: '' }, { find: '\\]', replace: '' }]);
            const Table = replaceAll(ResultBlock[1], [{ find: '\\[', replace: '' }, { find: '\\]', replace: '' }]);
            vscode.window.showInformationMessage('Found Alias for ' + Table + ': Alias -> ' + result.recordset[0].name + ', Schema -> ' + Schema);
            vscode.env.clipboard.writeText(Schema + '.' + result.recordset[0].name);
        }
        catch (err) {
            vscode.window.showInformationMessage('Error');
            console.log(err);
        }
        sql.close();
    });
}
exports.getResultforTable = getResultforTable;
;
function replaceAll(str, replace) {
    return replace.reduce((prev, current) => { return prev.replace(new RegExp(current.find, 'g'), current.replace); }, str);
}
exports.replaceAll = replaceAll;
function isUpperCase(str) {
    return str === str.toUpperCase();
}
exports.isUpperCase = isUpperCase;
//# sourceMappingURL=extension.js.map