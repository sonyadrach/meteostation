const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'user_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Помилка підключення до бази:', err.message);
  } else {
    console.log(' Підключено до бази даних SQLite');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )
  `, (err) => {
    if (err) {
      console.error(' Помилка створення таблиці users:', err.message);
    } else {
      console.log(' Таблиця users готова');
    }
  });
});


// Додавання користувача (реєстрація)
function registerUser(username, email, password, callback) {
  const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  db.run(query, [username, email, password], function (err) {
    if (err) {
      console.error('Помилка реєстрації:', err.message);
      callback(err);
    } else {
      console.log('Користувач доданий:', username);
      callback(null, this.lastID);
    }
  });
}

// Перевірка користувача (логін)
function loginUser(email, password, callback) {
  const query = `SELECT * FROM users WHERE email = ? AND password = ?`;
  db.get(query, [email, password], (err, row) => {
    if (err) {
      console.error(' Помилка входу:', err.message);
      callback(err);
    } else {
      callback(null, row);
    }
  });
}

module.exports = {
  db,
  registerUser,
  loginUser,
};
