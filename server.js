// EVERLUSH CUSTOMS – FINAL MULTI-PRODUCT SERVER
// Tech: Node.js + Express + SQLite

// =====================
// SETUP
// =====================
// npm init -y
// npm install express sqlite3 body-parser cors
// node server.js
// EVERLUSH CUSTOMS – FINAL MULTI-PRODUCT SERVER
// Tech: Node.js + Express + SQLite

// const express = require('express');
// const sqlite3 = require('sqlite3').verbose();
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const nodemailer = require('nodemailer');

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.static('public'));

// const db = new sqlite3.Database('./orders.db');

// /* =====================
//    🔴 ADMIN CONFIG
// ===================== */
// const ADMIN_EMAIL = "everlushcustoms@gmail.com";
// const EMAIL_USER  = "everlushcustoms@gmail.com";
// const EMAIL_PASS  = "tirc ukdv fgwz wlza";

// EVERLUSH CUSTOMS – PRODUCTION SERVER
// Tech: Node.js + Express + SQLite

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// ✅ IMPORTANT: Render PORT
const PORT = process.env.PORT || 3000;

/* =====================
   MIDDLEWARE
===================== */
app.use(cors());
app.use(bodyParser.json());

// ✅ Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

/* =====================
   ROOT ROUTE (VERY IMPORTANT)
===================== */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* =====================
   DATABASE
===================== */
const db = new sqlite3.Database('./orders.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      phone TEXT PRIMARY KEY,
      name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      total INTEGER,
      created_at TEXT,
      status TEXT DEFAULT 'Pending',
      cancel_request TEXT DEFAULT 'No'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product TEXT,
      option TEXT,
      quantity INTEGER,
      price INTEGER,
      subtotal INTEGER
    )
  `);
});

/* =====================
   ADMIN CONFIG (ENV)
===================== */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "everlushcustoms@gmail.com";
const EMAIL_USER  = process.env.EMAIL_USER  || "everlushcustoms@gmail.com";
const EMAIL_PASS  = "tirc ukdv fgwz wlza"; // App Password

/* =====================
   EMAIL SETUP
===================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

/* =====================
   PRICE MAP
===================== */
const prices = {
  bouquet: {
    XL: 1149,
    L: 999,
    M: 849,
    XS: 699,
    MINI: 549
  },
  chocolateBouquet: {
    XL: 1199,
    L: 1129,
    M: 949,
    XS: 799,
    MINI: 649
  },
  tower: {
    "1 Layer": 699,
    "2 Layers": 1199,
    "3 Layers": 1699
  },
  others: {
    "Handmade Keychains": 199,
    "Bead Bracelets": 299,
    "Customized Coffee Cup": 399,
    "Customized Greeting Cards": 249
  }
};

/* =====================
   PLACE ORDER
===================== */
app.post('/order', (req, res) => {
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const items = req.body.items;

  if (!name || !phone || !Array.isArray(items) || items.length === 0) {
    return res.json({ error: true, message: "Invalid order data" });
  }

  const createdAt = new Date().toLocaleString();

  db.get(
    `SELECT name FROM customers WHERE phone = ?`,
    [phone],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.json({ error: true });
      }

      if (row && row.name !== name) {
        return res.json({
          error: true,
          message: "Phone number already registered with another name"
        });
      }

      if (!row) {
        db.run(
          `INSERT INTO customers (phone, name) VALUES (?, ?)`,
          [phone, name]
        );
      }

      let total = 0;
      const finalItems = [];

      for (const item of items) {
        let price = 0;

        if (item.product === "Flower Bouquet")
          price = prices.bouquet[item.option];
        else if (item.product === "Chocolate Bouquet")
          price = prices.chocolateBouquet[item.option];
        else if (item.product === "Chocolate Tower")
          price = prices.tower[item.option];
        else
          price = prices.others[item.product];

        if (!price || !item.quantity) {
          return res.json({ error: true, message: "Invalid product data" });
        }

        const qty = Number(item.quantity);
        const subtotal = price * qty;
        total += subtotal;

        finalItems.push({
          product: item.product,
          option: item.option || "-",
          quantity: qty,
          price,
          subtotal
        });
      }

      db.run(
        `INSERT INTO orders (phone, total, created_at)
         VALUES (?, ?, ?)`,
        [phone, total, createdAt],
        function () {
          const orderId = this.lastID;

          const stmt = db.prepare(`
            INSERT INTO order_items
            (order_id, product, option, quantity, price, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          finalItems.forEach(i => {
            stmt.run(
              orderId,
              i.product,
              i.option,
              i.quantity,
              i.price,
              i.subtotal
            );
          });

          stmt.finalize();

          res.json({ success: true, orderId, total });
        }
      );
    }
  );
});

/* =====================
   USER – VIEW ORDERS BY PHONE
===================== */
app.get('/orders/:phone', (req, res) => {
  const phone = String(req.params.phone || "").trim();

  db.all(`
    SELECT 
      o.id,
      o.phone,
      o.total,
      o.status,
      o.cancel_request,
      o.created_at,
      GROUP_CONCAT(
        oi.product || ' (' || oi.option || ') x' || oi.quantity,
        ', '
      ) AS items
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE TRIM(o.phone) = ?
    GROUP BY o.id
    ORDER BY o.id DESC
  `, [phone], (err, rows) => {
    if (err) {
      console.error("FETCH ERROR:", err.message);
      return res.status(500).json({ error: true });
    }
    res.json(rows);
  });
});
/* =====================
   USER – CANCEL REQUEST
===================== */
app.post('/order/cancel/:orderId', (req, res) => {
  db.run(
    `UPDATE orders
     SET cancel_request='Yes'
     WHERE id=? AND status='Pending'`,
    [req.params.orderId],
    function (err) {
      if (err || this.changes === 0) {
        return res.json({ error: true });
      }
      res.json({ success: true });
    }
  );
});

/* =====================
   ADMIN – VIEW ALL ORDERS
===================== */
app.get('/admin/orders', (req, res) => {
  db.all(`
    SELECT o.*, 
    GROUP_CONCAT(oi.product || ' x' || oi.quantity, ', ') AS items
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.id DESC
  `, (err, rows) => {
    if (err) return res.json({ error: true });
    res.json(rows);
  });
});

/* =====================
   ADMIN – CANCEL ACTION
===================== */
app.post('/admin/cancel-action', (req, res) => {
  const { orderId, action } = req.body;

  if (action !== "approve" && action !== "reject") {
    return res.json({ error: true });
  }

  const status = action === "approve" ? "Cancelled" : "Pending";
  const cancelStatus = action === "approve" ? "Approved" : "Rejected";

  db.get(
    `SELECT phone FROM orders WHERE id=?`,
    [orderId],
    (err, row) => {
      if (err || !row) {
        return res.json({ error: true });
      }

      const phone = row.phone;

      db.run(
        `UPDATE orders
         SET status=?, cancel_request=?
         WHERE id=?`,
        [status, cancelStatus, orderId],
        function () {
          res.json({
            success: true,
            phone,
            status
          });
        }
      );
    }
  );
});


/* =====================
   DEBUG (REMOVE IN PROD)
===================== */
app.get("/debug-orders", (req, res) => {
  db.all("SELECT * FROM orders", (err, rows) => {
    if (err) return res.json({ error: err.message });
    res.json(rows);
  });
});

app.get('/debug/orders-schema', (req, res) => {
  db.all(`PRAGMA table_info(orders)`, (err, rows) => {
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`✅ EVERLUSH CUSTOMS running on http://localhost:${PORT}`);
});
