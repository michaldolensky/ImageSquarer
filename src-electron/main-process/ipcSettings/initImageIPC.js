import { ipcMain } from 'electron';

const initImageIPC = (window, store) => {
  const chanelPrefix = 'image.';
  // width
  ipcMain.handle(`${chanelPrefix}width.set`, async (event, path) => {
    store.set('image.width', path);
  });
  ipcMain.handle(`${chanelPrefix}width.get`, async () => store.get('image.width'));

  // height
  ipcMain.handle(`${chanelPrefix}height.set`, async (event, path) => {
    store.set('image.height', path);
  });
  ipcMain.handle(`${chanelPrefix}height.get`, async () => store.get('image.height'));

  // color
  ipcMain.handle(`${chanelPrefix}color.set`, async (event, path) => {
    store.set('image.color', path);
  });
  ipcMain.handle(`${chanelPrefix}color.get`, async () => store.get('image.color'));

  // alpha
  ipcMain
    .on(`${chanelPrefix}alpha`, (event, path) => {
      store.set('image.alpha', path);
    })
    .handle(`${chanelPrefix}alpha`, async (event, someArgument) => store.get('image.alpha'));
};
export default initImageIPC;
