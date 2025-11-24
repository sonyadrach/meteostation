const { contextBridge, ipcRenderer } = require('electron');
const apiKey = '358ea41c4cffdd8bec2cca36703a4b64'

contextBridge.exposeInMainWorld('api', {
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
  getUserCity: (userId) => ipcRenderer.invoke('get-user-city', userId),
  updateUserCity: (data) => ipcRenderer.invoke('update-user-city', data),
});

contextBridge.exposeInMainWorld('env', { apiKey });
