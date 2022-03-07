'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// The module 'azdata' contains the Azure Data Studio extensibility API
// This is a complementary set of APIs that add SQL / Data-specific functionality to the app
// Import the module and reference it with the alias azdata in your code below

import * as azdata from 'azdata';
const sql = require('mssql');
let selectedText: string;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "sql-alias" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('sql-alias.searchQueryOrAlias', () => {
        // The code you place here will be executed every time your command is executed
        const editor = vscode.window.activeTextEditor;
        selectedText = editor?.document.getText(editor.selection) as string;
        if (selectedText === undefined){
            vscode.env.clipboard.readText().then((clipboard_content)=>{selectedText = clipboard_content})
        }
        azdata.connection.getCurrentConnection().then(connection => {
            if (connection === undefined){
                vscode.window.showInformationMessage('Connection Not Found, you have to connect first');
                return
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
                        encrypt: false, // for azure
                        trustServerCertificate: false // change to true for local dev / self-signed certs
                    }
                };
                const rex = new RegExp('[A-Z1-9&]{3,7}', 'g') 
                if (selectedText.match(rex) && isUpperCase(selectedText)){
                    getResultforAlias(sqlConfig);
                }
                else{
                    getResultforTable(sqlConfig);
                }
         
            });
        }
        );

        // Display a message box to the user

    }));

}

// this method is called when your extension is deactivated
export function deactivate() {
}

export async function getResultforAlias(sqlConfig: any){
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT name, base_object_name from sys.synonyms WHERE name = '${selectedText}'`);
        console.log(result.recordset[0]);
        const ResultBlock = (result.recordset[0].base_object_name as string).split('.');
        const Schema = replaceAll(ResultBlock[0], [{find: '\\[', replace: ''}, {find: '\\]', replace: ''}]);
        const Table = replaceAll(ResultBlock[1], [{find: '\\[', replace: ''}, {find: '\\]', replace: ''}]);
        vscode.window.showInformationMessage('Found Table for ' + result.recordset[0].name + ': TableName -> ' + Table + ', Schema -> ' + Schema);
        vscode.env.clipboard.writeText(Schema + '.' + Table);
    } catch (err) {
        vscode.window.showInformationMessage('Error');
        console.log(err);
    }
    sql.close();
};

export async function getResultforTable(sqlConfig: any){
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT name, base_object_name from sys.synonyms WHERE base_object_name like '%\\[${selectedText}\\]%' ESCAPE '\\'`);
        // console.log(`SELECT name, base_object_name from sys.synonyms WHERE base_object_name like '%\\[${selectedText}\\]%' ESCAPE '\\'`);
        console.log(result.recordset[0]);
        const ResultBlock = (result.recordset[0].base_object_name as string).split('.');
        const Schema = replaceAll(ResultBlock[0], [{find: '\\[', replace: ''}, {find: '\\]', replace: ''}]);
        const Table = replaceAll(ResultBlock[1], [{find: '\\[', replace: ''}, {find: '\\]', replace: ''}]);
        vscode.window.showInformationMessage('Found Alias for ' + Table + ': Alias -> ' + result.recordset[0].name + ', Schema -> ' + Schema);
        vscode.env.clipboard.writeText(Schema + '.' + result.recordset[0].name)
    } catch (err) {
        vscode.window.showInformationMessage('Error');
        console.log(err);
    }
    sql.close();
};

export function replaceAll(str:string, replace: { find: string, replace: string }[]) {
    return replace.reduce((prev, current) => { return prev.replace(new RegExp(current.find, 'g'), current.replace); }, str)
  }

export  function isUpperCase(str: string) {
    return str === str.toUpperCase();
}