const { contextBridge, ipcRenderer } = require('electron');
const apiKey = '358ea41c4cffdd8bec2cca36703a4b64'

contextBridge.exposeInMainWorld('api', {
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
  getUserCity: (userId) => ipcRenderer.invoke('get-user-city', userId),
  updateUserCity: (data) => ipcRenderer.invoke('update-user-city', data),
  updateUserSettings: (data) => ipcRenderer.invoke('update-user-settings', data), 
  addReminder: (data) => ipcRenderer.invoke('add-reminder', data),
  getReminders: (data) => ipcRenderer.invoke('get-reminders', data),
  deleteReminder: (data) => ipcRenderer.invoke('delete-reminder', data),
    addWeatherHistory: (data) => ipcRenderer.invoke('add-weather-history', data),
  getWeatherHistory: (data) => ipcRenderer.invoke('get-weather-history', data),
});

contextBridge.exposeInMainWorld('env', { apiKey });
