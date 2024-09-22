const vscode = require("vscode");
const cowsay = require("cowsay");
const fs = require("fs");
const path = require("path");

function activate(context) {
  console.log("Activating VS Code Cowsay extension");

  // Pass the entire context to the provider
  const provider = new CowsayViewProvider(context.extensionUri, context);
  context.subscriptions.push(provider);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CowsayViewProvider.viewType,
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cowsay.refresh", () => {
      provider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cowsay.zoomIn", () => {
      provider.zoomIn();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cowsay.zoomOut", () => {
      provider.zoomOut();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-cowsay.changeAnimal", () => {
      provider.showAnimalDropdown();
    })
  );
}

class CowsayViewProvider {
  static viewType = "cowsayView";

  constructor(extensionUri, context) {
    this._extensionUri = extensionUri;
    this._context = context; // Store the context for globalState access

    // Retrieve the saved zoom level or set to default (0.8)
    this._zoomLevel = this._context.globalState.get('cowsayZoomLevel', 0.8);

    this._currentMessage = this._getRandomMessage();
    this._currentAnimalIndex = vscode.workspace.getConfiguration('vscode-cowsay').get('selectedAnimalIndex', 0);
    this._animals = [
      { value: "default", label: "Cow" },
      { value: "small", label: "Small Cow" },
      { value: "sheep", label: "Sheep" },
      { value: "tux", label: "Tux (Penguin)" },
      { value: "koala", label: "Koala" },
      { value: "bunny", label: "Bunny" },
      { value: "owl", label: "Owl" },
      { value: "bat", label: "Bat" },
      { value: "bear", label: "Bear" },
      { value: "butterfly", label: "Butterfly" },
      { value: "cat", label: "Cat" },
      { value: "dog", label: "Dog" },
      { value: "llama", label: "Llama" }
    ];
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this._update();
    this.startAutoRefresh();
  }

  dispose() {
    this.stopAutoRefresh();
  }

  refresh() {
    this._currentMessage = this._getRandomMessage();
    this._update();
  }

  zoomIn() {
    this._zoomLevel = Math.min(this._zoomLevel + 0.1, 2);
    this._context.globalState.update('cowsayZoomLevel', this._zoomLevel); // Save the new zoom level
    this._update();
  }

  zoomOut() {
    this._zoomLevel = Math.max(this._zoomLevel - 0.1, 0.5);
    this._context.globalState.update('cowsayZoomLevel', this._zoomLevel); // Save the new zoom level
    this._update();
  }

  changeAnimal() {
    this._currentAnimalIndex =
      (this._currentAnimalIndex + 1) % this._animals.length;
    this._update();
  }

  showAnimalDropdown() {
    vscode.window.showQuickPick(this._animals).then((selectedAnimal) => {
      if (selectedAnimal) {
        this._currentAnimalIndex = this._animals.findIndex(
          (animal) => animal.value === selectedAnimal.value
        );
        vscode.workspace.getConfiguration('vscode-cowsay').update('selectedAnimalIndex', this._currentAnimalIndex, true);
        this._update();
      }
    });
  }

  startAutoRefresh() {
    const config = vscode.workspace.getConfiguration('vscode-cowsay');
    const intervalMinutes = config.get('autoRefreshInterval', 5);
    
    if (intervalMinutes > 0) {
      this._autoRefreshInterval = setInterval(() => {
        this.refresh();
      }, intervalMinutes * 60 * 1000);
    }
  }

  stopAutoRefresh() {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
    }
  }

  _update() {
    if (this._view) {
      const currentAnimal = this._animals[this._currentAnimalIndex].value;
      let cowFile;

      if (currentAnimal === "owl" || currentAnimal === "dog" || currentAnimal === "bat" || currentAnimal === "bear" || currentAnimal === "llama" || currentAnimal === "butterfly" || currentAnimal === "cat") {
        cowFile = path.join(this._extensionUri.fsPath, 'resources', `${currentAnimal}.cow`);
      } else {
        cowFile = currentAnimal;
      }

      const message = cowsay.say({
        text: this._currentMessage,
        f: cowFile,
        e: "oO",
        T: "U ",
      });

      this._view.webview.html = this._getHtmlForWebview(message);
    }
  }

  _getHtmlForWebview(message) {
    const config = vscode.workspace.getConfiguration("editor");
    const fontFamily = config.get("fontFamily");

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VS Code Cowsay</title>
            <style>
                body {
                    font-size: ${14 * this._zoomLevel}px;
                    line-height: 1.0;
                    overflow: hidden;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                pre {
                    font-family: ${fontFamily}, monospace;
                }
                ::-webkit-scrollbar {
                    display: none;
                }
            </style>
        </head>
        <body>
            <pre>${message}</pre>
        </body>
        </html>`;
  }

  _wrapLongMessage(message) {
    const maxLineLength = 30;
    const words = message.split(' ');
    const lines = [];
    let currentLine = '';
  
    for (const word of words) {
      // Check if adding the next word exceeds the maximum length
      if ((currentLine + ' ' + word).trim().length > maxLineLength) {
        if (currentLine.length > 0) {
          lines.push(currentLine.trim());
        }
  
        // If the word itself is longer than maxLineLength, split the word
        if (word.length > maxLineLength) {
          const splitWords = word.match(new RegExp(`.{1,${maxLineLength}}`, 'g'));
          lines.push(...splitWords);
          currentLine = '';
        } else {
          currentLine = word;
        }
      } else {
        currentLine += ' ' + word;
      }
    }
  
    // Add any remaining words to the lines
    if (currentLine.length > 0) {
      lines.push(currentLine.trim());
    }
  
    return lines.join('\n');
  }

  _getRandomMessage() {
    const excusesPath = path.join(this._extensionUri.fsPath, "resources/excuses.txt");
    let excuses = [];

    try {
      const data = fs.readFileSync(excusesPath, "utf8");
      excuses = data.split("\n").filter((excuse) => excuse.trim() !== "");
    } catch (err) {
      console.error("Error reading excuses.txt:", err);
      // Fallback to original messages if file read fails
      return this._getDefaultMessage();
    }

    if (excuses.length === 0) {
      return this._getDefaultMessage();
    }

    let message = excuses[Math.floor(Math.random() * excuses.length)];
    return this._wrapLongMessage(message);
  }

  _getDefaultMessage() {
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
      "Hoofing through!",
    ];
    let message = messages[Math.floor(Math.random() * messages.length)];
    return this._wrapLongMessage(message);
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
