const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const productosRoutes = require('./routes/productos.routes');
const lotesRoutes = require('./routes/lotes.routes');
const palletsRoutes = require('./routes/pallets.routes');
const transporteRoutes = require('./routes/transporte.routes');
const mailRoutes = require('./routes/mail.routes');
const kpiRoutes = require('./routes/kpi.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/pallets', palletsRoutes);
app.use('/api/transporte', transporteRoutes);
app.use('/api/mail', mailRoutes);
app.use("/api/kpi", kpiRoutes);
// health
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

module.exports = app;
