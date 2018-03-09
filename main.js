const electron = require("electron");
const {ipcMain, shell, Menu} = electron;
const {fetchQuery} = require("./lib/queryUtils");
const url = require("url");
const path = require("path");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow;

// Redirects external URLS to the browser
const handleRedirect = (e, url) => {
  if(url != mainWindow.webContents.getURL()) {
    e.preventDefault()
    shell.openExternal(url)
  }
}

function addListeners() {
  ipcMain.on("runQuery", async(event, options) => {
    const data = await fetchQuery(options.query);
    event.sender.send("responseRunQuery", {
      id: options.id,
      data
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden'
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'dist/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('will-navigate', handleRedirect)
  mainWindow.webContents.on('new-window', handleRedirect)

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Bugzy",
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          click: (menuItem, browserWindow, event) => {
            browserWindow.webContents.send("openPreferences");
          }
        },
        {type: 'separator'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    },
    {
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

function onReady() {
  buildMenu();
  addListeners();
  createWindow();
}

app.on("ready", onReady);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
