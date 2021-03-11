import {
  app, BrowserWindow, nativeTheme, screen,
} from 'electron';
import sharp from 'sharp';
import chokidar from 'chokidar';

import path from 'path';
import fs from 'fs';

import Store from 'electron-store';
import { idMaker } from './utils/id-maker';
import schema from './ConfigSchema.json';
import { initIpcSettings } from './ipcSettings';

require('dotenv')
  .config();

const gen = idMaker();
let watcher;

const storeConfig = {
  schema,
  clearInvalidConfig: true,
  cwd: process.env.DEV_STORE_CONFIG_FOLDER,
  // bypass issue https://github.com/sindresorhus/electron-store/issues/92
  defaults: {
    folder: {},
    image: {},
  },
};
if (process.env.DEV) storeConfig.cwd = path.resolve('./');

const store = new Store(storeConfig);

const initWatcher = () => {
  const fileIn = store.get('folder.inputFolderPath');
  const fileOut = store.get('folder.outputFolderPath');
  console.log(fileIn, fileOut);

  if (!fs.existsSync(fileOut)) {
    fs.mkdirSync(fileOut);
  }
  watcher = chokidar.watch(fileIn, {
    depth: 0,
    persistent: true,
    ignoreInitial: true,
    ignored: [`${fileIn}/*.crdownload*`, `${fileIn}/*.tmp*`],
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
          if (max > 2000) max = 2000;

          const parsedInputFile = path.parse(file);

          const outputFile = path.format({
            dir: fileOut,
            name: `${gen.next().value}-edit${parsedInputFile.name}`,
            ext: '.png',
          });

          return image
            .resize({
              width: max,
              height: max,
              fit: sharp.fit.contain,
              background: {
                r: 255,
                g: 255,
                b: 255,
                alpha: 1,
              },
            })
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .png()
            .toFile(outputFile, (err, info) => {
              // console.log(this);

            });
        })
        .then(() => {
          // setTimeout(() => { fs.unlinkSync(file); }, 60000);
        });
    });
};

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    // eslint-disable-next-line global-require
    require('fs')
      .unlinkSync(require('path')
        .join(app.getPath('userData'), 'DevTools Extensions'));
  }
// eslint-disable-next-line no-empty
} catch (_) {
}

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  // eslint-disable-next-line no-underscore-dangle
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
  initWatcher();
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

store.onDidAnyChange((newValue, oldValue) => {
  watcher.close()
    .then(() => console.log('watacher closed'));
  initWatcher();
});
