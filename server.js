// server/app.js
const express = require('express');
const sql = require('mssql');
const app = express();

// Middleware to parse incoming JSON
app.use(express.json());

// Serve static files from 'public'
app.use(express.static('public'));

// Azure SQL config
const config = {
  user: 'sdProjAdmin',
  password: 'Distinction123',
  server: 'sports-facility-server-sdproj.database.windows.net',
  database: 'SportsFacilityDB',
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create a connection pool
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

poolConnect.then(() => {
  console.log("Connected to Azure SQL Database");

  // Inject pool into request
  app.use((req, res, next) => {
    req.pool = pool;
    next();
  });

  // POST /users to insert a user
  app.post('/users', async (req, res) => {
    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: "uid and role are required" });
    }

    try {
      const query = `
        INSERT INTO Users (user_uid, role, status)
        VALUES (@uid, @role, 'pending')
      `;
      await pool.request()
        .input('uid', sql.NVarChar, uid)
        .input('role', sql.NVarChar, role)
        .query(query);

      res.status(201).json({ success: true, message: "User created successfully" });
    } catch (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: "Database insertion error", details: err.message });
    }
  });

  // GET /users to retrieve users
  app.get('/users', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM Users');
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Start server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error("Error connecting to Azure SQL Database:", err);
});
