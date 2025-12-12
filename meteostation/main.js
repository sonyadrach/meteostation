const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { db, registerUser, loginUser, updateUserCity, updateUserSettings, addReminder, getReminders, deleteReminder, addWeatherHistory, getWeatherHistory } = require('./db.js');

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
// Додати в main.js після існуючих обробників:

// === Нагадування ===
ipcMain.handle('add-reminder', async (event, data) => {
  const { userId, city, text, date } = data;
  return new Promise((resolve) => {
    addReminder(userId, city, text, date, (err, id) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при додаванні нагадування: ' + err.message });
      } else {
        resolve({ success: true, id });
      }
    });
  });
});

ipcMain.handle('get-reminders', async (event, data) => {
  const { userId } = data;
  return new Promise((resolve) => {
    getReminders(userId, (err, reminders) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при отриманні нагадувань: ' + err.message });
      } else {
        resolve({ success: true, reminders });
      }
    });
  });
});

ipcMain.handle('delete-reminder', async (event, data) => {
  const { id } = data;
  return new Promise((resolve) => {
    deleteReminder(id, (err) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при видаленні нагадування: ' + err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// === Історія погоди ===
ipcMain.handle('add-weather-history', async (event, data) => {
  const { userId, city, weatherData } = data;
  return new Promise((resolve) => {
    addWeatherHistory(userId, city, weatherData, (err) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при збереженні історії: ' + err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('get-weather-history', async (event, data) => {
  const { userId, city, limit = 10 } = data;
  return new Promise((resolve) => {
    getWeatherHistory(userId, city, limit, (err, history) => {
      if (err) {
        resolve({ success: false, message: 'Помилка при отриманні історії: ' + err.message });
      } else {
        resolve({ success: true, history });
      }
    });
  });
});