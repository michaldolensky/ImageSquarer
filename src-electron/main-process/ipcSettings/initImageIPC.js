import { ipcMain } from 'electron';

const initImageIPC = (window, store) => {
  const chanelPrefix = 'image.';
  // width
  ipcMain
    .on(`${chanelPrefix}width`, (event, path) => {
      store.set('image.width', path);
    })
    .handle(`${chanelPrefix}width`, async (event, someArgument) => store.get('image.width'));
  store.get('image.width');
  // height
  ipcMain
    .on(`${chanelPrefix}height`, (event, path) => {
      store.set('image.height', path);
    })
    .handle(`${chanelPrefix}height`, async (event, someArgument) => store.get('image.height'));

  // color
  ipcMain
    .on(`${chanelPrefix}color`, (event, path) => {
      store.set('image.color', path);
    })
    .handle(`${chanelPrefix}color`, async (event, someArgument) => store.get('image.color'));

  // alpha
  ipcMain
    .on(`${chanelPrefix}alpha`, (event, path) => {
      store.set('image.alpha', path);
    })
    .handle(`${chanelPrefix}alpha`, async (event, someArgument) => store.get('image.alpha'));
};
export default initImageIPC;
