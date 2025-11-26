const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const productosRoutes = require('./routes/productos.routes');
const lotesRoutes = require('./routes/lotes.routes');
const palletsRoutes = require('./routes/pallets.routes');
const transporteRoutes = require('./routes/transporte.routes');
const mailRoutes = require('./routes/mail.routes');
const choferRoutes = require('./routes/chofer.routes');
const productorRoutes = require('./routes/productores.routes');
const camaraRoutes = require('./routes/camara.routes');
const kpiRoutes = require('./routes/kpi.routes');
const binloteRoutes = require('./routes/binlote.routes');
const camionesRoutes = require("./routes/camiones.routes");
const transportistasRoutes = require("./routes/transportistas.routes");
const choferesRoutes = require("./routes/choferes.routes");
const ordenesRoutes = require("./routes/ordenes.routes");
const clientesRoutes = require("./routes/clientes.routes");
const routingRoutes = require("./routes/routing.routes");
const procesoRoutes = require('./routes/proceso.routes');
const rolesRoutes = require("./routes/roles.routes");
const trackingRoutes = require("./routes/tracking.routes");
const stockRoutes = require('./routes/stock.routes');
const cajasRoutes = require('./routes/cajas.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/pallets', palletsRoutes);
app.use('/api/choferes', choferRoutes);
app.use('/api/transporte', transporteRoutes);
app.use('/api/productores', productorRoutes);
app.use('/api/mail', mailRoutes);
app.use("/api/kpi", kpiRoutes);
app.use("/api/binlote", binloteRoutes);
app.use('/api/camaras', camaraRoutes);

app.use("/api/camiones", camionesRoutes);
app.use("/api/transportistas", transportistasRoutes);
app.use("/api/choferes", choferesRoutes);
app.use("/api/ordenes-despacho", ordenesRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/routing", routingRoutes);
app.use('/api/proceso', procesoRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/tracking", trackingRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/cajas', cajasRoutes);
// health
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

module.exports = app;
