const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { db, registerUser, loginUser, updateUserCity, updateUserSettings } = require('./db.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

win.loadFile(path.join(__dirname, 'build', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

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
      if (err) resolve({ success: false, message: err.message });
      else if (user) resolve({ success: true, user });
      else resolve({ success: false, message: 'Неправильний email або пароль' });
    });
  });
});
// === Отримання міста користувача ===
ipcMain.handle('get-user-city', async (event, userId) => {
  return new Promise((resolve) => {
    db.get(`SELECT city FROM users WHERE id = ?`, [userId], (err, row) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при отриманні міста: ' + err.message });
      } else {
        resolve({ success: true, city: row ? row.city : '' });
      }
    });
  });
});

// === Оновлення міста ===
ipcMain.handle('update-user-city', async (event, { userId, city }) => {
  return new Promise((resolve) => {
    updateUserCity(userId, city, (err) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при оновленні міста: ' + err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('update-user-settings', async (event, { userId, theme, language }) => {
  return new Promise((resolve) => {
    updateUserSettings(userId, { theme, language }, (err) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при оновленні налаштувань: ' + err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});