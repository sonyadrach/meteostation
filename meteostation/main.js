const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { registerUser, loginUser } = require('./db.js'); 
require('dotenv').config();

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'build', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', (e) => {
  e.preventDefault();
});


// === Реєстрація користувача ===
ipcMain.handle('register-user', async (event, data) => {
  const { username, email, password } = data;

  return new Promise((resolve) => {
    registerUser(username, email, password, (err, id) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при реєстрації: ' + err.message });
      } else {
        resolve({ success: true, message: 'Користувач успішно зареєстрований', id });
      }
    });
  });
});

// === Вхід користувача ===
ipcMain.handle('login-user', async (event, data) => {
  const { email, password } = data;

  return new Promise((resolve) => {
    loginUser(email, password, (err, user) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при вході: ' + err.message });
      } else if (user) {
        resolve({ success: true, user });
      } else {
        resolve({ success: false, message: 'Неправильний email або пароль' });
      }
    });
  });
});
