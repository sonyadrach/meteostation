const { contextBridge, ipcRenderer } = require('electron');
const apiKey = '358ea41c4cffdd8bec2cca36703a4b64'

contextBridge.exposeInMainWorld('api', {
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
});

contextBridge.exposeInMainWorld('env', { apiKey });