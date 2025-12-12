const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'user_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Помилка підключення до бази:', err.message);
  } else {
    console.log('✅ Підключено до бази даних SQLite');
  }
});

db.serialize(() => {
  // 1. Таблиця користувачів
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      city TEXT DEFAULT ''
    )
  `, (err) => {
    if (err) {
      console.error('Помилка створення таблиці users:', err.message);
    } else {
      console.log('✅ Таблиця users готова');
    }
  });

  // 2. ДОДАНО: Таблиця для налаштувань користувача (тема, мова)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      theme TEXT DEFAULT 'default',
      language TEXT DEFAULT 'ua',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Помилка створення таблиці user_settings:', err.message);
    } else {
      console.log('✅ Таблиця user_settings готова');
    }
  });
});

// === Реєстрація користувача ===
function registerUser(username, email, password, callback) {
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return callback(err);

    const query = `INSERT INTO users (username, email, password, city) VALUES (?, ?, ?, '')`;
    db.run(query, [username, email, hash], function (err) {
      const newUserId = this?.lastID;

      // КЛЮЧ: Додаємо запис у user_settings при реєстрації
      if (newUserId) {
        db.run(`INSERT INTO user_settings (user_id, theme, language) VALUES (?, 'default', 'ua')`, [newUserId], (dataErr) => {
          if (dataErr) console.error('Помилка ініціалізації user_settings:', dataErr.message);
          callback(err, newUserId);
        });
      } else {
        callback(err, newUserId);
      }
    });
  });
}

// === Вхід користувача ===
function loginUser(email, password, callback) {
  const userQuery = `SELECT * FROM users WHERE email = ?`;
  db.get(userQuery, [email], (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(null, null);

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return callback(err);
      if (!isMatch) return callback(null, null);

      // Отримуємо додаткові налаштування користувача
      db.get(`SELECT theme, language FROM user_settings WHERE user_id = ?`, [user.id], (settingsErr, settingsRow) => {
        if (settingsErr) console.error('Помилка отримання user_settings:', settingsErr.message);

        // Додаємо налаштування до об'єкта користувача, який повертаємо фронтенду
        user.settings = {
          theme: settingsRow ? settingsRow.theme : 'default',
          language: settingsRow ? settingsRow.language : 'ua',
        };

        callback(null, user);
      });
    });
  });
}

// === Оновлення міста користувача ===
function updateUserCity(userId, city, callback) {
  const query = `UPDATE users SET city = ? WHERE id = ?`;
  db.run(query, [city, userId], function (err) {
    callback(err);
  });
}

// === ДОДАНО: Оновлення налаштувань користувача (тема/мова) ===
function updateUserSettings(userId, { theme, language }, callback) {
  const query = `INSERT INTO user_settings (user_id, theme, language) VALUES (?, ?, ?) 
                 ON CONFLICT(user_id) DO UPDATE SET theme=excluded.theme, language=excluded.language`;
                 
  db.run(query, [userId, theme, language], function (err) {
    callback(err);
  });
}
db.run(`CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  city TEXT NOT NULL,
  text TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

// Створення таблиці історії погоди
db.run(`CREATE TABLE IF NOT EXISTS weather_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  city TEXT NOT NULL,
  date DATE NOT NULL,
  temp REAL NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  humidity INTEGER NOT NULL,
  wind REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, city, date)
)`);

// Функція для додавання нагадування
const addReminder = (userId, city, text, date, callback) => {
  db.run(
    `INSERT INTO reminders (user_id, city, text, date) VALUES (?, ?, ?, ?)`,
    [userId, city, text, date],
    function(err) {
      callback(err, this?.lastID);
    }
  );
};

// Функція для отримання нагадувань користувача
const getReminders = (userId, callback) => {
  db.all(
    `SELECT * FROM reminders WHERE user_id = ? ORDER BY date DESC, created_at DESC`,
    [userId],
    callback
  );
};

// Функція для видалення нагадування
const deleteReminder = (id, callback) => {
  db.run(`DELETE FROM reminders WHERE id = ?`, [id], callback);
};

// Функція для додавання запису історії
const addWeatherHistory = (userId, city, weatherData, callback) => {
  const { temp, description, icon, humidity, wind } = weatherData;
  const today = new Date().toISOString().split('T')[0];
  
  db.run(
    `INSERT OR REPLACE INTO weather_history 
     (user_id, city, date, temp, description, icon, humidity, wind) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, city, today, temp, description, icon, humidity, wind],
    callback
  );
};

// Функція для отримання історії погоди
const getWeatherHistory = (userId, city, limit = 10, callback) => {
  db.all(
    `SELECT * FROM weather_history 
     WHERE user_id = ? AND city = ? 
     ORDER BY date DESC 
     LIMIT ?`,
    [userId, city, limit],
    callback
  );
};

module.exports = {
  db,
  registerUser,
  loginUser,
  updateUserCity,
  updateUserSettings,
  addReminder,
  getReminders,
  deleteReminder,
  addWeatherHistory,
  getWeatherHistory
};