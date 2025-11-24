const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

//-------------local-----------
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || '127.0.0.1',
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASS || '',
//   database: process.env.DB_NAME || 'citrustack',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   namedPlaceholders: true
// });


//-------------vps-----------
const pool = mysql.createPool({
  host: process.env.DB_HOST2 || '127.0.0.1',
  port: process.env.DB_PORT2 || 3306,
  user: process.env.DB_USER2 || 'root',
  password: process.env.DB_PASS2 || '',
  database: process.env.DB_NAME2 || 'citrustack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  enableKeepAlive: true,          // Mantener conexiones vivas
  keepAliveInitialDelay: 10000,   // Delay inicial de 10s
  connectTimeout: 60000,          // Timeout de conexión de 60s
});

module.exports = pool;
