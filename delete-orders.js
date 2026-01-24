const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./orders.db');

// 🔴 DELETE ALL ORDERS
db.serialize(() => {
  db.run(`DELETE FROM order_items`, err => {
    if (err) console.error(err);
    else console.log("✅ order_items cleared");
  });

  db.run(`DELETE FROM orders`, err => {
    if (err) console.error(err);
    else console.log("✅ orders cleared");
  });
});

db.close();
