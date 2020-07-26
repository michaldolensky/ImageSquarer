import {
  app, BrowserWindow, nativeTheme, ipcMain, screen,
} from 'electron';
import sharp from 'sharp';
import chokidar from 'chokidar';

import path from 'path';
import fs from 'fs';

import Store from 'electron-store';
import { initIpcSettings } from './ipcSettings';

require('dotenv').config();

const store = new Store({ cwd: process.env.DEV_STORE_CONFIG_FOLDER });

function* idMaker() {
  let index = 0;
  while (true) {
    index += 1;
    yield index;
  }
}
const gen = idMaker();

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'));
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname;
}

let mainWindow;

function createWindow() {
  // display on second screen while in dev and second monitor is available
  const displays = screen.getAllDisplays();
  // eslint-disable-next-line max-len
  const externalDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);

  let devOptions = {};
  if (externalDisplay && process.env.NODE_ENV === 'development') {
    devOptions = {
      x: externalDisplay.bounds.x + 50,
      y: externalDisplay.bounds.y + 50,
    };
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    ...devOptions,
    darkTheme: true,
    useContentSize: true,
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
      nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    },
  });

  initIpcSettings(mainWindow, store);
  mainWindow.loadURL(process.env.APP_URL);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC

ipcMain.on('message', (event, data) => {
  // console.log(`Received: ${data}`);
  event.sender.send('message', 'Hello interface!');
});
ipcMain.on('config', (event, data) => {
  console.log(`Received: ${data}`);
  store.set('CONFIG', { test: data });
  // event.sender.send('message', 'Hello interface!');
});

const fileOut = process.env.FILE_OUTPUT_FOLDER;

if (!fs.existsSync(fileOut)) {
  fs.mkdirSync(fileOut);
}

const watcher = chokidar.watch(process.env.FILE_INPUT_FOLDER, {
  depth: 0,
  persistent: true,
  ignoreInitial: true,
  ignored: process.env.IGNORED_FILES,
});
watcher
  .on('add', async (file) => {
    console.log(`File ${file} has been added`);
    const image = sharp(file);
    const a = await image
      .metadata()
      .then((metadata) => {
        let max;
        if (metadata.width > metadata.height) {
          max = metadata.width;
        } else {
          max = metadata.height;
        }
        const outputFile = `${fileOut}${gen.next().value}-edit${path.basename(file)}`;

        return image
          .resize({
            width: max,
            height: max,
            fit: sharp.fit.contain,
            background: {
              r: 255, g: 255, b: 255, alpha: 0.0,
            },
          })
          .png()
          .toFile(outputFile, (err, info) => {
            // console.log(this);

          });
      }).then(() => {
        setTimeout(() => { fs.unlinkSync(file); }, 60000);
      });
  });
