// routes/clientes.js
const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientesController");

// Nota: Si montás este router en app.js con app.use('/api/clientes', require('./routes/clientes')),
// entonces las rutas internas deben ser '/' y '/:id'. Si prefieres montar con '/api', ajustá en app.js.

router.get("/", clientesController.getAllClientes);
router.get("/:id", clientesController.getClienteById);
router.post("/", clientesController.createCliente);
router.patch("/:id", clientesController.updateCliente);
router.delete("/:id", clientesController.deleteCliente);

module.exports = router;
