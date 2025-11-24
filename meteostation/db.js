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
});

// === Реєстрація користувача ===
function registerUser(username, email, password, callback) {
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return callback(err);

    const query = `INSERT INTO users (username, email, password, city) VALUES (?, ?, ?, '')`;
    db.run(query, [username, email, hash], function (err) {
      callback(err, this?.lastID);
    });
  });
}

// === Вхід користувача ===
function loginUser(email, password, callback) {
  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email], (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(null, null);

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return callback(err);
      if (!isMatch) return callback(null, null);
      callback(null, user);
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

module.exports = {
  db,
  registerUser,
  loginUser,
  updateUserCity,
};
