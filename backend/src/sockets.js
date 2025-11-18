const db = require("./config/db.js");

const configurarSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket conectado:", socket.id);

    // 🔥 TEMPERATURA EN VIVO
    socket.on("temperatura:update", async (data) => {
      const { camion_id, temperatura, humedad } = data;

      await db.query(
        "INSERT INTO temp_log (camion_id, temperatura, humedad) VALUES (?,?,?)",
        [camion_id, temperatura, humedad]
      );

      io.emit("temperatura:live", data);
    });

    // 🔥 TRACKING GPS EN VIVO
    socket.on("tracking:update", async (data) => {
      const { orden_despacho_id, camion_id, lat, lng, velocidad, evento } = data;

      await db.query(
        `INSERT INTO tracking_realtime
        (orden_despacho_id, camion_id, lat, lng, velocidad, evento)
        VALUES (?,?,?,?,?,?)`,
        [orden_despacho_id, camion_id, lat, lng, velocidad, evento]
      );

      io.emit(`tracking:od:${orden_despacho_id}`, data);
    });

    // 🔥 EVENTOS OPERATIVOS (entrada cámara, salida camión, etc.)
    socket.on("evento:operacion", (data) => {
      io.emit("evento:notify", data);
    });
  });
};

module.exports = { configurarSockets };