// // Cargar variables de entorno
// require('dotenv').config();

// // --- CORRECCIÓN ---
// // Importar la función de sockets usando 'require' (CommonJS)
// const { configurarSockets } = require("./sockets.js");

// // Importar los módulos de http y socket.io
// const http = require("http");
// const { Server } = require("socket.io");

// // Importar la app de Express
// const app = require('./app'); // Asumiendo que app.js está en la misma carpeta

// // Tomar el puerto
// const port = process.env.PORT || 4000;

// // Crear el servidor HTTP
// const server = http.createServer(app);

// // Crear la instancia de Socket.io
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Deberías restringir esto en producción
//   },
// });

// // --- ¡IMPORTANTE! ---
// // Adjuntamos 'io' a la instancia de la app.
// // Ahora, en cualquier controlador, puedes usar 'req.app.get('io')' para emitir eventos.
// app.set('io', io);

// // --- CORRECCIÓN ---
// // Llamamos a la función de configuración y le pasamos la instancia 'io'.
// // Esto reemplaza el bloque io.on("connection", ...) que estaba duplicado aquí.
// configurarSockets(io);

// // Escuchar en el servidor HTTP
// server.listen(port, () => {
//   console.log(`Servidor CitrusTrack (con WebSockets) escuchando en http://localhost:${port}`);
// });

// Cargar variables de entorno
require('dotenv').config();

// --- CORRECCIÓN ---
// Importar la función de sockets usando 'require' (CommonJS)
const { configurarSockets } = require("./sockets.js");

// Importar los módulos de http y socket.io
const http = require("http");
const { Server } = require("socket.io");

// Importar la app de Express
const app = require('./app'); // Asumiendo que app.js está en la misma carpeta

// Tomar el puerto
const port = process.env.PORT || 4000;

// Crear el servidor HTTP
const server = http.createServer(app);

// Crear la instancia de Socket.io - ✅ CORS CORREGIDO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // ✅ Mismo que Express
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  },
});

// --- ¡IMPORTANTE! ---
// Adjuntamos 'io' a la instancia de la app.
// Ahora, en cualquier controlador, puedes usar 'req.app.get('io')' para emitir eventos.
app.set('io', io);

// --- CORRECCIÓN ---
// Llamamos a la función de configuración y le pasamos la instancia 'io'.
// Esto reemplaza el bloque io.on("connection", ...) que estaba duplicado aquí.
configurarSockets(io);

// Escuchar en el servidor HTTP
server.listen(port, () => {
  console.log(`Servidor CitrusTrack (con WebSockets) escuchando en http://localhost:${port}`);
});