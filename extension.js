const vscode = require('vscode');
const cowsay = require('cowsay');

function activate(context) {
    console.log('Activating VS Code Cowsay extension');

    const provider = new CowsayViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CowsayViewProvider.viewType, provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-cowsay.refresh', () => {
            provider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-cowsay.zoomIn', () => {
            provider.zoomIn();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-cowsay.zoomOut', () => {
            provider.zoomOut();
        })
    );
}

class CowsayViewProvider {
    static viewType = 'cowsayView';

    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this._zoomLevel = 0.8;
        this._currentMessage = this._getRandomMessage();
    }

    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        this._update();
    }

    refresh() {
        this._currentMessage = this._getRandomMessage();
        this._update();
    }

    zoomIn() {
        this._zoomLevel = Math.min(this._zoomLevel + 0.1, 2);
        this._update();
    }

    zoomOut() {
        this._zoomLevel = Math.max(this._zoomLevel - 0.1, 0.5);
        this._update();
    }

    _update() {
        if (this._view) {
            const message = cowsay.say({
                text: this._currentMessage,
                e: "oO",
                T: "U "
            });
            this._view.webview.html = this._getHtmlForWebview(message);
        }
    }

    _getHtmlForWebview(message) {
        
        var config = vscode.workspace.getConfiguration('editor');
        var fontFamily = config.get('fontFamily');
 
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Code Cowsay</title>
            <style>
                body {
                    white-space: pre;
                    font-size: ${14 * this._zoomLevel}px;
                    line-height: 1.1;
                }
                pre {
                    font-family: ${fontFamily}, monospace;
                }
            </style>
        </head>
        <body>
            <pre>${message}</pre>
        </body>
        </html>`;
    }

    _getRandomMessage() {
        const messages = [
            "Hello from VS Code!",
            "Moo-ve over, I'm coding!",
            "Have you herd? VS Code is awesome!",
            "Holy cow, that's some good code!",
            "Udder-ly fantastic extension, right?",
            "No bull, VS Code is the best IDE around!",
            "No beef with clean code!",
            "Moo-ving on to the next line.",
            "Don't have a cow, just keep coding!",
            "This code is udderly perfect!",
            "Moo-mentum is key when coding.",
            "Time for a cow-ffee break!",
            "Grazing through the code like a pro!",
            "This code is off the moo-n!",
            "Legendairy coder right here!",
            "Bull-dozing through bugs like a champ!",
            "You're really milking VS Code for all it's worth!",
            "This code is a real cream of the crop!",
            "Moo-difying some functions!",
            "Cow-ding is so much fun!",
            "Hay there, keep up the good work!",
            "Moo-sic to my coding ears!",
            "Hoofing through!"            
        ];
        let message = messages[Math.floor(Math.random() * messages.length)];
    
        if (message.length > 20) {
            const midpoint = Math.ceil(message.length / 2);
            const lastSpaceBeforeMidpoint = message.lastIndexOf(' ', midpoint);
            const breakpoint = lastSpaceBeforeMidpoint > 0 ? lastSpaceBeforeMidpoint : midpoint;
            message = message.slice(0, breakpoint) + '\n' + message.slice(breakpoint).trim();
        }
        return message;
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
